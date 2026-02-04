import React, { useState } from 'react';
import { Patient, Visit, Medication, PatientStatus, LabResults, AISuggestedDrug, ExtendedVitals } from '../types';
import { enhancedDrugInteractionService } from '../services/enhancedDrugInteractionService';
import { datasetService } from '../services/datasetService';
import { APP_FOOTER, DRUG_DATABASE as CONSTANT_DB } from '../constants';
import { DRUG_DATABASE as CLINICAL_DB } from '../services/drugDatabase';
import { generateSafetyReport, generatePatientFriendlyReport, getAIResponse } from "../services/geminiService";
import { detectClinicalConditions, generateTreatmentRecommendations } from "../services/enhancedClinicalLogic";


import { drugExtractorService } from "../services/drugExtractor";
import { rxNormService } from "../services/rxnorm";
import { openFDAService } from "../services/openfda";
import { grokService } from "../services/grokService";
import { SystemInsights } from './SystemInsights';
// import { DrugInteractionChecker } from './DrugInteractionChecker';
import { EnhancedFollowUpSystem } from './EnhancedFollowUpSystem';
// import { PastCasesDiagnosis } from './PastCasesDiagnosis';
import { DrugInformationPanel } from './DrugDetailsPanel';

// Helper functions for diagnosis
const extractDiagnosisFromAI = (aiReport: string): string => {
  if (!aiReport) return '';

  // Look for diagnosis-related sections in the AI report
  const lines = aiReport.split('\n');
  let diagnosisText = '';

  // Find lines containing diagnosis-related keywords
  const diagnosisLines = lines.filter(line =>
    line.toLowerCase().includes('diagnosis') ||
    line.toLowerCase().includes('assessment') ||
    line.toLowerCase().includes('impression') ||
    line.toLowerCase().includes('clinical assessment')
  );

  if (diagnosisLines.length > 0) {
    diagnosisText = diagnosisLines.join(' ').replace(/[:\*\*]/g, '').trim();
  }

  // If no specific diagnosis found, try to extract from the first few lines
  if (!diagnosisText && lines.length > 0) {
    diagnosisText = lines.slice(0, 3).join(' ').substring(0, 200);
  }

  return diagnosisText;
};

const parseAIDiagnosis = (response: string) => {
  const lines = response.split('\n');
  let primary = '';
  let differentials = '';
  let treatment = '';
  let confidence = 75;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.toLowerCase().includes('primary diagnosis')) {
      primary = trimmedLine.replace(/.*primary diagnosis[:\*\*]*/i, '').trim();
    } else if (trimmedLine.toLowerCase().includes('differential')) {
      differentials = trimmedLine.replace(/.*differential[:\*\*]*/i, '').trim();
    } else if (trimmedLine.toLowerCase().includes('treatment')) {
      treatment = trimmedLine.replace(/.*treatment[:\*\*]*/i, '').trim();
    } else if (trimmedLine.toLowerCase().includes('confidence')) {
      const confidenceMatch = trimmedLine.match(/(\d+)/);
      if (confidenceMatch) {
        confidence = parseInt(confidenceMatch[1]);
      }
    }
  });

  return {
    primary: primary || extractDiagnosisFromAI(response),
    differentials: differentials || 'Consider alternative diagnoses based on clinical presentation',
    treatment: treatment || 'Treatment should be tailored to clinical findings',
    confidence: Math.min(100, Math.max(0, confidence))
  };
};

// SILENT AI ENHANCEMENT: Internal logic-based reinforcement with Grok pre-analysis
const silentlyEnhanceAIReport = async (aiReport: string, patient: Patient): Promise<string> => {
  try {
    console.log("🤖 Starting silent AI enhancement with Grok pre-analysis...");

    // Step 1: Get Grok analysis first for additional insights
    let grokAnalysis = '';
    let patientFriendlyMessage = '';
    try {
      const grokResult = await grokService.generateClinicalAnalysis(patient);
      if (grokResult.success) {
        grokAnalysis = grokResult.analysis || '';
        patientFriendlyMessage = grokResult.patientFriendlyMessage || '';
        console.log("✅ Grok analysis completed successfully");
      }
    } catch (error) {
      console.log("⚠️ Grok analysis failed, continuing with standard enhancement");
    }

    // Step 2: Extract drug names from AI report
    const extractionResult = await drugExtractorService.extractDrugNames(aiReport);
    const extractedDrugs = extractionResult.drugs || [];
    console.log(`💊 Extracted ${extractedDrugs.length} potential drug mentions`);

    if (extractedDrugs.length === 0) {
      console.log("ℹ️ No drugs found in AI report - returning original with Grok insights if available");
      // Add Grok insights if available
      if (grokAnalysis) {
        return `${aiReport}\n\n---\n\n🤖 ADDITIONAL AI INSIGHTS (Grok)\n${grokAnalysis}`;
      }
      return aiReport;
    }

    // Step 3: Normalize drug names using RxNorm-style logic
    const normalizedDrugs = await Promise.all(
      extractedDrugs.map(async (drug) => {
        try {
          const normalized = await rxNormService.normalizeDrugName(drug.name);
          return {
            original: drug.name,
            normalized: (normalized as any).normalized || drug.name,
            confidence: (normalized as any).confidence || 0.7
          };
        } catch (error) {
          console.log(`⚠️ Failed to normalize ${drug.name}`);
          return {
            original: drug.name,
            normalized: drug.name,
            confidence: 0.5
          };
        }
      })
    );

    console.log(`🔄 Normalized ${normalizedDrugs.length} drug names`);

    // Step 4: Check drug interactions using OpenFDA-style data
    const drugNamesForInteraction = normalizedDrugs.map(d => d.normalized).filter(Boolean);
    let interactions: any[] = [];

    if (drugNamesForInteraction.length >= 2) {
      try {
        const interactionResult = await openFDAService.getDrugInteractions(drugNamesForInteraction.join(','));
        interactions = interactionResult.interactions || [];
        console.log(`⚡ Found ${interactions.length} potential interactions`);
      } catch (error) {
        console.log("⚠️ Drug interaction check failed");
      }
    }

    // Step 5: Retrieve adverse events for context
    let adverseEvents: any[] = [];
    try {
      for (const drug of drugNamesForInteraction.slice(0, 3)) { // Limit to prevent API overload
        const eventsResult = await openFDAService.getAdverseEvents(drug);
        if (eventsResult.events) {
          adverseEvents.push(...eventsResult.events);
        }
      }
      console.log(`📊 Retrieved ${adverseEvents.length} adverse event reports`);
    } catch (error) {
      console.log("⚠️ Adverse events retrieval failed");
    }

    // Step 6: Create safety enhancement section
    const safetySection = createSafetyEnhancementSection(
      normalizedDrugs,
      { interactions },
      { events: adverseEvents },
      grokAnalysis,
      patientFriendlyMessage
    );

    // Step 7: Append safety information to AI report
    const enhancedReport = appendSafetyInformation(aiReport, safetySection);

    console.log("✅ Silent AI enhancement completed with Grok insights");
    return enhancedReport;

  } catch (error) {
    console.error("❌ Silent enhancement failed:", error);
    // Always return original AI report if enhancement fails
    return aiReport;
  }
};

// Create safety enhancement section
const createSafetyEnhancementSection = (
  normalizedDrugs: any[],
  interactions: any,
  adverseEvents: any,
  grokAnalysis?: string,
  patientFriendlyMessage?: string
): string => {
  let safetySection = "\n\n---\n\n**🔍 ENHANCED SAFETY ANALYSIS**\n\n";

  // Add Grok insights if available
  if (grokAnalysis) {
    safetySection += "### 🤖 Additional AI Insights (Grok)\n\n";
    safetySection += `${grokAnalysis}\n\n`;
  }

  // Add patient-friendly message if available
  if (patientFriendlyMessage) {
    safetySection += "### 💬 Patient-Friendly Summary\n\n";
    safetySection += `${patientFriendlyMessage}\n\n`;
  }

  // Drug interactions
  if (interactions && interactions.interactions && interactions.interactions.length > 0) {
    safetySection += "### Drug Interactions\n\n";
    interactions.interactions.forEach((interaction: any, index: number) => {
      const severity = interaction.severity.toUpperCase();
      const emoji = severity === 'MAJOR' ? '🔴' : severity === 'MODERATE' ? '🟡' : '🟢';

      safetySection += `${index + 1}. ${emoji} ${severity}: ${interaction.drug1} + ${interaction.drug2}\n`;
      safetySection += `   - Effect: ${interaction.description}\n`;
      safetySection += `   - Recommendation: ${interaction.recommendation}\n\n`;
    });
  } else {
    safetySection += "### Drug Interactions\n\n";
    safetySection += "✅ No clinically significant interactions detected.\n\n";
  }

  // Adverse events summary
  if (adverseEvents && adverseEvents.events && adverseEvents.events.length > 0) {
    safetySection += "### Adverse Events Summary\n\n";

    // Count reactions
    const eventCounts = adverseEvents.events.reduce((acc: any, event: any) => {
      const reaction = event.reaction[0]?.reactionmeddrapt || 'Unknown';
      acc[reaction] = (acc[reaction] || 0) + 1;
      return acc;
    }, {});

    Object.entries(eventCounts).forEach(([reaction, count]) => {
      safetySection += `- ${reaction}: ${count} reported case(s)\n`;
    });
    safetySection += "\n";
  }

  // Drug information
  if (normalizedDrugs.length > 0) {
    safetySection += "### Drug Information\n\n";
    normalizedDrugs.forEach((drug: any, index: number) => {
      safetySection += `${index + 1}. ${drug.normalized} - Confidence: ${Math.round((drug.confidence || 0.7) * 100)}%\n`;
    });
    safetySection += "\n";
  }

  safetySection += "---\n\n";
  return safetySection;
};

// Append safety information to AI report
const appendSafetyInformation = (originalReport: string, safetySection: string): string => {
  // Find the best place to append safety information
  const reportLines = originalReport.split('\n');
  let insertIndex = reportLines.length;

  // Look for conclusion or summary sections
  for (let i = reportLines.length - 1; i >= 0; i--) {
    const line = reportLines[i].toLowerCase();
    if (line.includes('conclusion') || line.includes('summary') || line.includes('recommendation')) {
      insertIndex = i;
      break;
    }
  }

  // Insert safety section before conclusion
  const beforeConclusion = reportLines.slice(0, insertIndex);
  const afterConclusion = reportLines.slice(insertIndex);

  return [...beforeConclusion, safetySection, ...afterConclusion].join('\n');
};

// Helper function: extractDrugsFromAIAnalysis
const extractDrugsFromAIAnalysis = (aiAnalysis: string): string[] => {
  if (!aiAnalysis) return [];

  const extractedDrugs: string[] = [];

  // Extract drug mentions from AI analysis with comprehensive patterns
  const drugPatterns = [
    /\b(Aspirin|Acetaminophen|Ibuprofen|Naproxen|Diclofenac|Celecoxib|Meloxicam)\b/gi,
    /\b(Metoprolol|Atenolol|Propranolol|Carvedilol|Labetalol|Bisoprolol)\b/gi,
    /\b(Lisinopril|Enalapril|Ramipril|Quinapril|Fosinopril|Benazepril)\b/gi,
    /\b(Amlodipine|Nifedipine|Diltiazem|Verapamil|Felodipine)\b/gi,
    /\b(Hydrochlorothiazide|Furosemide|Spironolactone|Triamterene)\b/gi,
    /\b(Albuterol|Salbutamol|Salmeterol|Formoterol|Ipratropium|Tiotropium)\b/gi,
    /\b(Fluticasone|Budesonide|Beclomethasone|Prednisone|Prednisolone|Methylprednisolone)\b/gi,
    /\b(Omeprazole|Esomeprazole|Pantoprazole|Lansoprazole|Rabeprazole)\b/gi,
    /\b(Ondansetron|Granisetron|Dolasetron|Palonosetron)\b/gi,
    /\b(Metformin|Glipizide|Glyburide|Pioglitazone|Sitagliptin|Empagliflozin)\b/gi,
    /\b(Insulin|Glargine|Lispro|Aspart|Detemir|Degludec)\b/gi,
    /\b(Acetaminophen|Paracetamol|Tramadol|Codeine|Morphine|Oxycodone|Hydrocodone)\b/gi,
    /\b(Sumatriptan|Rizatriptan|Zolmitriptan|Naratriptan|Frovatriptan|Almotriptan)\b/gi,
    /\b(Warfarin|Coumadin|Heparin|Enoxaparin|Dalteparin|Apixaban|Rivaroxaban|Dabigatran)\b/gi,
    /\b(Atorvastatin|Simvastatin|Rosuvastatin|Pravastatin|Lovastatin|Fluvastatin)\b/gi,
    /\b(Sertraline|Fluoxetine|Escitalopram|Citalopram|Paroxetine|Venlafaxine|Duloxetine)\b/gi,
    /\b(Lorazepam|Diazepam|Alprazolam|Clonazepam|Temazepam)\b/gi,
    /\b(Gabapentin|Pregabalin|Duloxetine|Amitriptyline|Nortriptyline)\b/gi,
    /\b(Levothyroxine|Liothyronine|Methimazole|Propylthiouracil)\b/gi,
    /\b(Fluconazole|Itraconazole|Voriconazole|Amphotericin|Nystatin)\b/gi,
    /\b(Acyclovir|Valacyclovir|Famciclovir|Ganciclovir)\b/gi,
    /\b(Azithromycin|Clarithromycin|Doxycycline|Amoxicillin|Augmentin|Cephalexin)\b/gi,
    /\b(Ciprofloxacin|Levofloxacin|Moxifloxacin|Nitrofurantoin|Trimethoprim)\b/gi,
    /\b(Vancomycin|Linezolid|Daptomycin|Cefazolin|Ceftriaxone|Cefepime)\b/gi
  ];

  drugPatterns.forEach(pattern => {
    const matches = aiAnalysis.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const drugName = match.split(/\s+/)[0];
        if (drugName.length > 2 && !extractedDrugs.includes(drugName)) {
          extractedDrugs.push(drugName);
        }
      });
    }
  });

  return [...new Set(extractedDrugs)]; // Remove duplicates
};

interface Props {
  patients: Patient[];
  userRole?: string | null; // <--- This clears the red line in App.tsx
  onAddPatient: (p: Patient) => void;
  onUpdatePatient: (p: Patient) => void;
  onResetRegistry: () => void;
  onLogout: () => void;
  onDeletePatients: (ids: string[]) => void;
}

const HCPPortal: React.FC<Props> = ({
  patients,
  userRole,
  onAddPatient,
  onUpdatePatient,
  onResetRegistry,
  onLogout,
  onDeletePatients
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'INSIGHTS' | 'FOLLOWUP' | 'REGISTRY' | 'DRUGDETAILS'>('NEW');
  // ... (The rest of your code stays exactly the same)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [isLoggingVisit, setIsLoggingVisit] = useState(false);

  // OPTIMIZATION: Pre-load the dataset service to prevent lag during save
  React.useEffect(() => {
    enhancedDrugInteractionService.init().catch(console.error);
  }, []);

  // Form State for New Patient
  const [formData, setFormData] = useState<Partial<Patient>>({
    fullName: '',
    age: undefined,
    sex: 'Male',
    height: '',
    weight: '',
    baselineVitals: { bp: '', hr: '', temp: '', spo2: '' },
    baselineLabs: {
      wbc: '', platelets: '', rbc: '', creatinine: '',
      hemoglobin: '', esr: '', mch: '', mchc: '', mcv: '',
      bloodSugar: '', sodium: '', potassium: '', triglycerides: '',
      bloodUreaNitrogen: '', sgot: '', sgpt: ''
    },
    socialHistory: { smoking: false, alcohol: false, tobacco: false },
    familyHistory: '',
    medications: [],
    complaints: '',
    medicalHistory: '',
    treatmentContext: '',
    status: 'Active',
    visits: [],
    consentGiven: false,
    otherFindings: ''
  });

  const [newMed, setNewMed] = useState<Medication>({ name: '', dose: '', route: '', frequency: '' });
  const [patientPin, setPatientPin] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [tempId, setTempId] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Prevent duplicate saves
  const [drugAnalysisCache, setDrugAnalysisCache] = useState<Map<string, any>>(new Map()); // Cache drug analysis
  const [currentMedications, setCurrentMedications] = useState<Medication[]>([]);
  const [aiSuggestedDrugs, setAiSuggestedDrugs] = useState<AISuggestedDrug[]>([]);
  const [showAIDrugBox, setShowAIDrugBox] = useState(false);
  const [selectedMedicationsForInteraction, setSelectedMedicationsForInteraction] = useState<Set<string>>(new Set());
  const [selectedAIDrugsForInteraction, setSelectedAIDrugsForInteraction] = useState<Set<string>>(new Set());
  const [drugSuggestions, setDrugSuggestions] = useState<string[]>([]);
  const [drugReport, setDrugReport] = useState<string>('');

  // Drug Information Panel persistent state (prevents reset on tab switch)
  const [drugInfoExtraMeds, setDrugInfoExtraMeds] = useState<string[]>([]);
  const [drugInfoRemovedMeds, setDrugInfoRemovedMeds] = useState<Set<string>>(new Set());

  // Suggested Medications state (for the new suggest medications box)
  const [suggestedMedications, setSuggestedMedications] = useState<Array<{
    name: string;
    source: 'AI' | 'Logic' | 'Manual';
    dose: string;
    frequency: string;
    route: string;
    isComplete: boolean;
  }>>([]);
  const [dischargeData, setDischargeData] = useState({
    lifestyleModifications: '',
    dischargeVitals: { bp: '', hr: '', temp: '', spo2: '' },
    dischargeLabs: {
      wbc: '',
      platelets: '',
      rbc: '',
      creatinine: '',
      hemoglobin: '',
      esr: '',
      crp: '',
      tsh: '',
      fasting: '',
      pp: '',
      bloodSugar: '',
      sodium: '',
      potassium: '',
      triglycerides: '',
      bloodUreaNitrogen: '',
      sgot: '',
      sgpt: ''
    },
    dischargeInstructions: '',
    followUpPlan: ''
  });
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Revisit functionality state
  const [showRevisitModal, setShowRevisitModal] = useState(false);
  const [showEnhancedFollowUp, setShowEnhancedFollowUp] = useState(false);
  const [revisitData, setRevisitData] = useState({
    complaints: '',
    onExamination: '',
    vitals: { bp: '', hr: '', temp: '', spo2: '' },
    labs: { wbc: '', platelets: '', rbc: '', creatinine: '' },
    summary: '',
    medicalHistory: '',
    familyHistory: '',
    socialHistory: { smoking: false, alcohol: false, tobacco: false },
    height: '',
    weight: '',
    otherFindings: '',
    medications: [] as Medication[]
  });

  // AI analysis state for revisit
  const [revisitAiReport, setRevisitAiReport] = useState<string | null>(null);
  const [isRevisitAnalyzing, setIsRevisitAnalyzing] = useState(false);

  // Final diagnosis state
  const [diagnosisType, setDiagnosisType] = useState<'manual' | 'ai'>('manual');
  const [showPastCases, setShowPastCases] = useState(false);
  const [manualDiagnosis, setManualDiagnosis] = useState({
    primary: '',
    differentials: '',
    treatment: '',
    confidence: 75
  });
  const [aiDiagnosis, setAiDiagnosis] = useState<{
    primary: string;
    differentials: string;
    treatment: string;
    confidence: number;
  } | null>(null);
  const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);

  // Drug analysis state
  const [suggestedDrugs, setSuggestedDrugs] = useState<Array<{
    name: string;
    category: string;
    rationale: string;
    precautions: string;
    selected: boolean;
    dose: string;
    route: string;
    frequency: string;
  }>>([]);
  const [drugAnalysisType, setDrugAnalysisType] = useState<'manual' | 'ai' | 'logic'>('logic');
  const [isGeneratingDrugAnalysis, setIsGeneratingDrugAnalysis] = useState(false);
  const [isSavingRevisit, setIsSavingRevisit] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState({
    type: 'manual' as 'manual' | 'ai' | 'logic',
    diagnosis: '',
    confidence: 0
  });

  // Close drug suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.drug-input-container')) {
        setDrugSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDrugEquivalents = async (drugName: string): Promise<string[]> => {
    try {
      // Try OpenAI for brand/generic name matching
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `What are the brand names and generic equivalents for "${drugName}"? Return only a comma-separated list of drug names, no explanations.`
          }],
          max_tokens: 100,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const equivalents = data.choices[0]?.message?.content?.split(',').map((eq: string) => eq.trim()) || [];
        return equivalents.filter((eq: string) => eq.length > 0);
      }
    } catch (error) {
      console.log('Could not get AI equivalents, using database only');
    }
    return [];
  };

  const handleDrugNameChange = async (value: string) => {
    setNewMed({ ...newMed, name: value });

    if (value.length >= 2) {
      // Enhanced local filtering with fuzzy matching
      const searchTerm = value.toLowerCase();

      // 1. Get suggestions from the large DatasetService (Single Source of Truth)
      // This is fast and synchronous if loaded
      const datasetSuggestions = datasetService.getDrugSuggestions(value, 8); // Top 8 from large DB

      // 2. Get suggestions from small static DB (for legacy support)
      const staticMatches = Object.keys(CLINICAL_DB)
        .filter(k => k.toLowerCase().includes(searchTerm))
        .slice(0, 4);

      // 3. Combine and Deduplicate
      // prioritize large dataset, then static
      const combined = Array.from(new Set([
        ...datasetSuggestions.map(s => s.charAt(0).toUpperCase() + s.slice(1)), // Capitalize
        ...staticMatches
      ])).slice(0, 10);

      // 4. Fallback to AI if absolutely nothing found locally (optional, kept for robustness)
      if (combined.length === 0) {
        try {
          const equivalents = await getDrugEquivalents(value);
          setDrugSuggestions(equivalents.slice(0, 5));
        } catch (e) {
          setDrugSuggestions([]);
        }
      } else {
        setDrugSuggestions(combined);
      }
    } else {
      setDrugSuggestions([]);
    }
  };

  const handleAddMed = () => {
    if (!newMed.name) return;
    const medicationToAdd: Medication = {
      name: newMed.name,
      dose: newMed.dose || "TBD",
      route: newMed.route || "Oral",
      frequency: newMed.frequency || "QD"
    };
    setFormData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), medicationToAdd]
    }));
    setNewMed({ name: '', dose: '', route: '', frequency: '' });
    setDrugSuggestions([]);
  };

  const removeMed = (index: number) => {
    const updated = [...(formData.medications || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, medications: updated });
  };

  // Update AI suggested drug
  const updateAiSuggestedDrug = (index: number, field: keyof AISuggestedDrug, value: string) => {
    const updated = [...aiSuggestedDrugs];
    updated[index] = { ...updated[index], [field]: value };

    // Check if all mandatory fields are filled
    updated[index].isComplete = !!(updated[index].name && updated[index].dose &&
      updated[index].route && updated[index].frequency);

    setAiSuggestedDrugs(updated);
  };

  // Add AI suggested drug to medications
  const addAiSuggestedDrug = (index: number) => {
    const drug = aiSuggestedDrugs[index];
    if (!drug.isComplete) {
      alert('Please fill all mandatory fields (Dose, Route, Frequency) before adding.');
      return;
    }

    const medication: Medication = {
      name: drug.name,
      dose: drug.dose,
      route: drug.route,
      frequency: drug.frequency,
      isCurrentlyTaking: false
    };

    setFormData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), medication]
    }));

    // Remove from AI suggested drugs
    setAiSuggestedDrugs(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegisterStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentGiven) {
      alert("Clinical record creation requires patient consent.");
      return;
    }
    const id = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    setTempId(id);
    setShowPinDialog(true);
  };

  const handleCompleteRegistration = async () => {
    if (isSaving) {
      console.log('Save already in progress, preventing duplicate...');
      return;
    }

    if (patientPin.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }

    setIsSaving(true); // Start save operation

    // Calculate detailed drug analysis for persistence (cached and non-blocking)
    let drugDetailsData: any | undefined = undefined;
    const cacheKey = `patient-${tempId}-${JSON.stringify(formData.medications)}-${JSON.stringify(aiSuggestedDrugs)}`;

    try {

      if (drugAnalysisCache.has(cacheKey)) {
        drugDetailsData = drugAnalysisCache.get(cacheKey);
        console.log("Using cached drug analysis");
      } else {
        try {
          console.log("Generating comprehensive drug analysis for storage...");

          // 1. Logic Suggestions
          const conditions = detectClinicalConditions(formData as Patient);
          const logicAnalysis = generateTreatmentRecommendations(conditions.conditions, conditions.severity, formData as Patient);

          // 2. AI Suggestions (from state)
          const aiDrugs = aiSuggestedDrugs.map(d => ({
            name: d.name,
            dose: d.dose,
            route: d.route,
            frequency: d.frequency,
            rationale: d.rationale || 'AI Suggested',
            confidence: d.confidence || 0.85
          }));

          // 3. Interaction Check (with timeout to prevent blocking)
          const allDrugNames = [
            ...(formData.medications?.map(m => m.name) || []),
            ...aiDrugs.map(d => d.name),
            ...logicAnalysis.medications.map(m => m.name)
          ];
          const uniqueDrugs = Array.from(new Set(allDrugNames.filter(n => n && n.trim())));

          // Non-blocking interaction check with timeout
          const interactionPromise = enhancedDrugInteractionService.checkAllInteractions(uniqueDrugs);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Interaction check timeout')), 2000)
          );

          let interactions: any[] = [];
          try {
            const result = await Promise.race([interactionPromise, timeoutPromise]);
            interactions = Array.isArray(result) ? result : [];
          } catch (error) {
            console.warn("Interaction check timed out, proceeding without interactions");
            interactions = [];
          }

          drugDetailsData = {
            manuallyEntered: formData.medications,
            aiSuggested: aiDrugs,
            logicSuggested: logicAnalysis.medications,
            interactions: interactions.map(i => ({
              drug1: i.drug1,
              drug2: i.drug2,
              severity: i.severity,
              description: i.description,
              recommendation: i.recommendation || 'Monitor'
            })),
            combinedAnalysis: `Analysis generated on ${new Date().toLocaleDateString()}`
          };

          // Cache the result
          setDrugAnalysisCache(prev => new Map(prev).set(cacheKey, drugDetailsData));
          console.log("Drug analysis generated and cached:", drugDetailsData);
        } catch (err) {
          console.error("Error generating persistence analysis:", err);
          // Use basic fallback
          drugDetailsData = {
            manuallyEntered: formData.medications,
            aiSuggested: [],
            logicSuggested: [],
            interactions: [],
            combinedAnalysis: `Basic analysis on ${new Date().toLocaleDateString()}`
          };
        }
      }

      const initialVisits: Visit[] = [];

      // Logic Update: User wants AI report ALWAYS, even if HCP didn't manually trigger "Analyze"
      let finalAIReport = aiReport;
      let shouldBackgroundGenerate = false;

      if (!finalAIReport || finalAIReport.trim().length === 0) {
        console.log("No AI report found. Auto-generating placeholder for background analysis...");
        // Placeholder that matches the structure user wants, to be filled in background
        finalAIReport = `**Patient Discharge Summary**\n\n` +
          `**Condition Details**\nClinical data is being processed for your personalized health summary.\n` +
          `**Safety Measures**\n• Follow all medication instructions carefully.\n• Monitor for worsening symptoms.\n` +
          `**Doctor's Assurance**\nWe are with you. Your health is our priority.\n\n` +
          `*(Comprehensive analysis is generating in background...)*`;

        shouldBackgroundGenerate = true;
      }

      // Create the initial visit with whatever report we have (real or placeholder)
      if (finalAIReport && finalAIReport.trim().length > 0) {
        const initialVisitId = `INIT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        initialVisits.push({
          id: initialVisitId,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          summary: 'Initial Clinical Registration & AI Analysis',
          complaints: formData.complaints || 'Patient Registration',
          vitals: formData.baselineVitals || {},
          labResults: formData.baselineLabs || {},
          aiReport: finalAIReport,
          drugDetails: drugDetailsData
        });
      }

      const newPatient: Patient = {
        ...(formData as Patient),
        age: formData.age || 0,
        id: tempId,
        pin: patientPin,
        visits: initialVisits,
        drugDetails: drugDetailsData,
        suggestedMedications: suggestedMedications // SAVED during registration
      };

      // Trigger background generation if needed
      if (shouldBackgroundGenerate) {
        console.log("Triggering background AI report generation...");
        // Using setTimeout to break out of current execution flow
        setTimeout(() => {
          const bgPatient = { ...newPatient }; // Clone to avoid ref issues
          generatePatientFriendlyReport(bgPatient).then(report => {
            if (report && onUpdatePatient) {
              console.log("Background report generated, updating patient...");
              const updatedVisits = bgPatient.visits.map(v =>
                v.id.startsWith('INIT') ? { ...v, aiReport: report } : v
              );
              onUpdatePatient({
                ...bgPatient,
                visits: updatedVisits
              });
            }
          }).catch(e => console.error("Background gen failed:", e));
        }, 100);
      }

      onAddPatient(newPatient);
      setFormData({
        fullName: '', age: undefined, sex: 'Male', height: '', weight: '',
        baselineVitals: { bp: '', hr: '', temp: '', spo2: '' },
        baselineLabs: { wbc: '', platelets: '', rbc: '', creatinine: '' },
        socialHistory: { smoking: false, alcohol: false, tobacco: false },
        familyHistory: '', medications: [], complaints: '', medicalHistory: '',
        treatmentContext: '', status: 'Active', visits: [], consentGiven: false
      });
      setPatientPin('');
      setAiReport(null);
      setAiSuggestedDrugs([]); // Clear AI state
      setSuggestedMedications([]); // Clear suggested meds state after registration
      setShowPinDialog(false);
      setActiveTab('REGISTRY');
      alert(`Registration Complete. Patient ID: ${tempId}`);

    } finally {
      setIsSaving(false); // Reset save state
    }
  };

  const generatePatientSafetyReport = async (patient: Patient): Promise<string> => {
    try {
      setStatusMessage("Performing Clinical Assessment...");
      console.log("Generating safety report...");
      const report = await generateSafetyReport(patient);

      if (report && !report.includes("technical difficulties")) {
        console.log("AI analysis completed successfully");
        setStatusMessage("Optimizing drug suggestions...");
        // Update drug suggestions from the report
        extractDrugsFromAIReport(report);
        return report;
      }
      return report;
    } catch (error: any) {
      console.error("Error in generatePatientSafetyReport:", error);
      return `Primary AI analysis encountered an error. Please try again or use local clinical logic.`;
    }
  };

  const handlePreRegistrationAnalysis = async () => {
    if (!formData.complaints) {
      alert("Please enter chief complaints for clinical reasoning analysis.");
      return;
    }
    setIsAnalyzing(true);
    setStatusMessage("Connecting to AI Engine...");
    try {
      const tempPatient: Patient = {
        ...(formData as Patient),
        age: formData.age || 0,
        id: 'TEMP', pin: '', visits: []
      };
      setStatusMessage("Analyzing clinical context...");
      console.log("Generating safety report for patient:", tempPatient.fullName);

      const report = await generateSafetyReport(tempPatient);

      if (report && report.trim().length > 0) {
        setStatusMessage("Report ready! Finalizing safety checks...");
        // Show report immediately for better UX
        setAiReport(report);
        extractDrugsFromAIReport(report, formData.medications || []);
        setIsAnalyzing(false); // Stop spinner early!
        console.log("Initial safety report displayed");

        // SILENT ENHANCEMENT: Add drug safety information in background
        console.log("Starting background safety enhancement...");
        silentlyEnhanceAIReport(report, tempPatient).then(enhancedReport => {
          if (enhancedReport !== report) {
            setAiReport(enhancedReport);
            console.log("Safety report enhanced in background");
          }
        }).catch(err => {
          console.error("Background enhancement failed:", err);
        });
      } else {
        throw new Error("Empty response from AI service");
      }
    } catch (e: any) {
      console.error("Error generating analysis:", e);
      setAiReport(`I'm currently experiencing technical difficulties. Please try again in a few moments, or contact support if the issue persists. Your patient data has been saved securely.`);
      setIsAnalyzing(false);
    }
  };

  const toggleDeleteSelect = (id: string) => {
    setSelectedForDelete(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedForDelete.length === 0) return;
    if (window.confirm(`Delete ${selectedForDelete.length} selected records?`)) {
      onDeletePatients(selectedForDelete);
      setSelectedForDelete([]);
      if (selectedPatientId && selectedForDelete.includes(selectedPatientId)) {
        setSelectedPatientId(null);
      }
    }
  };

  const activePatient = React.useMemo(() =>
    patients.find(p => p.id === selectedPatientId),
    [patients, selectedPatientId]);

  // PERFORMANCE & SAFETY FIX: Reset patient-specific state when switching patients
  React.useEffect(() => {
    if (activePatient) {
      setDrugInfoExtraMeds([]);
      setDrugInfoRemovedMeds(new Set());
      // CRITICAL FIX: Load existing suggested medications from patient record
      setSuggestedMedications(activePatient.suggestedMedications || []);
      if (activePatient.aiReport) {
        setAiReport(activePatient.aiReport);
      } else {
        setAiReport('');
      }
    } else {
      // Also reset if no patient is active (like in NEW tab)
      setDrugInfoExtraMeds([]);
      setDrugInfoRemovedMeds(new Set());
      setSuggestedMedications([]);
      setAiReport('');
    }
  }, [selectedPatientId]);

  // SYNC FIX: Persist suggested medications back to patient record when they change
  React.useEffect(() => {
    if (activePatient) {
      // Robust sync including empty state (to allow clearing)
      const currentJSON = JSON.stringify(activePatient.suggestedMedications || []);
      const nextJSON = JSON.stringify(suggestedMedications);

      if (currentJSON !== nextJSON) {
        console.log(`💾 Syncing ${suggestedMedications.length} suggested meds to patient ${activePatient.id}`);
        onUpdatePatient({
          ...activePatient,
          suggestedMedications: suggestedMedications
        });
      }
    }
  }, [suggestedMedications, activePatient?.id]);

  // FIX: Resolve medications based on context (New Session vs Active Patient) to ensure Drug Details tab has data
  const resolvedMedications = (activeTab === 'NEW' || !activePatient)
    ? (formData.medications || [])
    : (activePatient.medications || []);
  const [followUpVisit, setFollowUpVisit] = useState({
    summary: '', complaints: '', bp: '', hr: '', temp: '', spo2: '',
    wbc: '', platelets: '', rbc: '', creatinine: '',
    attachReport: true
  });

  // Generate AI analysis for revisit case
  const generateRevisitAIAnalysis = async () => {
    if (!activePatient || !revisitData.complaints) return;

    setIsRevisitAnalyzing(true);
    setStatusMessage("Connecting to Clinical Engine...");

    try {
      // Create temporary patient object for AI analysis
      const tempRevisitPatient: Patient = {
        id: activePatient.id,
        fullName: activePatient.fullName,
        age: revisitData.age || activePatient.age,
        sex: activePatient.sex,
        height: revisitData.height || activePatient.height,
        weight: revisitData.weight || activePatient.weight,
        baselineVitals: revisitData.vitals,
        baselineLabs: revisitData.labs,
        socialHistory: revisitData.socialHistory,
        familyHistory: activePatient.familyHistory,
        medicalHistory: revisitData.medicalHistory || activePatient.medicalHistory,
        medications: revisitData.medications,
        complaints: revisitData.complaints,
        otherFindings: revisitData.otherFindings,
        status: 'Active',
        visits: [],
        consentGiven: false,
        pin: '',
        treatmentContext: revisitData.treatmentContext
      };

      setStatusMessage("Analyzing symptoms & history...");
      const report = await generateSafetyReport(tempRevisitPatient);

      if (report && report.trim().length > 0 && !report.includes("Error")) {
        setStatusMessage("Report ready!");
        setRevisitAiReport(report);
        console.log("Revisit AI analysis generated successfully");
      } else {
        throw new Error("Empty AI response");
      }
    } catch (error: any) {
      console.error("Error generating revisit AI analysis:", error);
      setRevisitAiReport(`Error generating analysis: ${error.message || "Unknown error"}`);
    } finally {
      setIsRevisitAnalyzing(false);
      setStatusMessage('');
    }
  };

  // Generate AI diagnosis from existing AI report
  const generateAIDiagnosisFromReport = async () => {
    if (!aiReport) {
      alert('Please generate AI analysis first before creating AI diagnosis.');
      setDiagnosisType('manual');
      return;
    }

    setIsGeneratingDiagnosis(true);
    try {
      // Parse the AI report to extract diagnosis information
      const parsed = parseAIDiagnosis(aiReport);
      setAiDiagnosis(parsed);
      console.log('AI diagnosis generated from report:', parsed);
    } catch (error: any) {
      console.error('Error generating AI diagnosis:', error);
      alert('Error generating AI diagnosis. Please try manual diagnosis instead.');
      setDiagnosisType('manual');
    } finally {
      setIsGeneratingDiagnosis(false);
    }
  };

  // Generate AI diagnosis with enhanced clinical reasoning
  const generateAIDiagnosis = async () => {

    setIsAnalyzing(true);
    try {
      console.log('🤖 AI-FIRST: Attempting AI drug analysis...');

      // Create temporary patient for drug analysis
      const tempPatient: Patient = {
        id: activePatient.id,
        fullName: activePatient.fullName,
        age: activePatient.age,
        sex: activePatient.sex,
        height: activePatient.height,
        weight: activePatient.weight,
        complaints: `${revisitData.complaints}\n\nON EXAMINATION: ${revisitData.onExamination || 'No specific examination findings recorded'}`,
        baselineVitals: revisitData.vitals,
        baselineLabs: revisitData.labs,
        socialHistory: activePatient.socialHistory,
        familyHistory: activePatient.familyHistory,
        medicalHistory: revisitData.medicalHistory || activePatient.medicalHistory,
        medications: currentMedications,
        otherFindings: revisitData.otherFindings || '',
        treatmentContext: `${revisitData.otherFindings || activePatient.treatmentContext || ''}\n\nEXAMINATION FINDINGS: ${revisitData.onExamination || 'None recorded'}`,
        status: activePatient.status,
        visits: activePatient.visits,
        consentGiven: activePatient.consentGiven,
        pin: activePatient.pin
      };

      // Also get AI analysis for additional insights
      const aiAnalysis = await generatePatientSafetyReport(tempPatient);
      console.log("AI analysis:", aiAnalysis);

      // Extract drugs from AI analysis and auto-fill
      const extractedDrugs = extractDrugsFromAIAnalysis(aiAnalysis);
      console.log("Extracted drugs:", extractedDrugs);

      // Auto-fill AI drugs into current medications
      const newAIDrugs: Medication[] = extractedDrugs.map(drug => ({
        name: drug,
        dose: '', // To be filled manually
        route: '', // To be filled manually
        frequency: '' // To be filled manually
      }));

      setCurrentMedications(prev => [...prev, ...newAIDrugs]);
      setAiSuggestedDrugs(extractedDrugs.map(drug => ({
        name: drug,
        reason: 'AI-suggested based on clinical analysis',
        confidence: 85,
        alternatives: []
      })));
      setShowAIDrugBox(true);

      console.log("✅ AI drug analysis completed successfully - drugs auto-filled");

    } catch (error) {
      console.error('Drug analysis error:', error);
      setDrugReport('Error in drug analysis. Please try again.');
    } finally {
      setIsGeneratingDrugAnalysis(false);
    }
  };

  const generateDrugAnalysis = async () => {
    setIsGeneratingDrugAnalysis(true);
    let drugSuggestions: any[] = [];
    // Determine context (New Patient vs Revisit)
    const complaints = (activePatient ? revisitData.complaints : (formData.complaints || ''))?.toLowerCase() || '';
    const vitals = activePatient ? revisitData.vitals : (formData.baselineVitals || { bp: '', hr: '', temp: '', spo2: '' });
    const medications = activePatient ? currentMedications : (formData.medications || []);

    try {
      if (complaints.includes('pain') || complaints.includes('ache') || complaints.includes('sore')) {
        drugSuggestions = [
          {
            name: 'Acetaminophen',
            category: 'Analgesic',
            rationale: '*Acetaminophen* may be considered for pain relief. Commonly used as first-line analgesic.',
            precautions: 'Monitor total daily dose to avoid hepatotoxicity.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Ibuprofen',
            category: 'NSAID',
            rationale: '*Ibuprofen* is often evaluated for inflammatory pain. Commonly used for its anti-inflammatory effects.',
            precautions: 'Avoid in renal impairment or peptic ulcer disease.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          }
        ];
      } else if (complaints.includes('nausea') || complaints.includes('vomiting')) {
        drugSuggestions = [
          {
            name: 'Omeprazole',
            category: 'PPI',
            rationale: '*Omeprazole* may be considered for acid suppression in GERD and peptic ulcer disease. Commonly used for its proton pump inhibition.',
            precautions: 'Long-term use may be associated with increased infection risk and bone density loss. Monitor renal function.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Ondansetron',
            category: 'Anti-emetic',
            rationale: '*Ondansetron* is often evaluated for nausea and vomiting control. Commonly used for its anti-emetic effects with minimal sedation.',
            precautions: 'Use with caution in patients with QT prolongation or on other QT-prolonging medications.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Metoclopramide',
            category: 'Prokinetic',
            rationale: '*Metoclopramide* may be considered for gastric motility enhancement and nausea control. Commonly used in gastroparesis.',
            precautions: 'Monitor for extrapyramidal symptoms, especially in younger patients. Use with caution in Parkinson\'s disease.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          }
        ];
      } else if (complaints.includes('headache') || complaints.includes('migraine')) {
        drugSuggestions = [
          {
            name: 'Acetaminophen',
            category: 'Analgesic',
            rationale: '*Acetaminophen* may be considered for mild to moderate pain relief. Commonly used as first-line analgesic with favorable safety profile.',
            precautions: 'Monitor total daily dose to avoid hepatotoxicity. Use with caution in patients with liver disease or alcohol use.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Ibuprofen',
            category: 'NSAID',
            rationale: '*Ibuprofen* is often evaluated for inflammatory pain and headache relief. Commonly used for its anti-inflammatory and analgesic effects.',
            precautions: 'Avoid in patients with renal impairment, peptic ulcer disease, or cardiovascular risk factors. Monitor renal function.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Sumatriptan',
            category: 'Triptan',
            rationale: '*Sumatriptan* may be considered for acute migraine attacks. Commonly used for its vasoconstrictive effects in migraine therapy.',
            precautions: 'Contraindicated in patients with cardiovascular disease, uncontrolled hypertension, or hemiplegic migraine. Monitor for chest tightness.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          }
        ];
      } else if (complaints.includes('thirst') || complaints.includes('urination') || complaints.includes('sugar')) {
        drugSuggestions = [
          {
            name: 'Metformin',
            category: 'Oral Hypoglycemic',
            rationale: '*Metformin* is commonly used as first-line therapy for type 2 diabetes. Often evaluated for its insulin-sensitizing effects.',
            precautions: 'Avoid in patients with severe renal impairment (eGFR <30). Monitor for lactic acidosis risk factors and vitamin B12 deficiency.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Insulin',
            category: 'Hormone',
            rationale: '*Insulin* may be considered for glycemic control in diabetes. Commonly used when oral agents are insufficient or contraindicated.',
            precautions: 'Monitor blood glucose closely to avoid hypoglycemia. Educate on proper injection technique and storage.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Empagliflozin',
            category: 'SGLT2 Inhibitor',
            rationale: '*Empagliflozin* is often evaluated for its cardio-renal protective effects in diabetes. Commonly used for its glucose-lowering and diuretic effects.',
            precautions: 'Monitor for genital infections and volume depletion. Use with caution in elderly patients and those with recurrent UTIs.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          }
        ];
      } else if (vitals.bp && (vitals.bp.includes('140') || vitals.bp.includes('150') || vitals.bp.includes('160'))) {
        drugSuggestions = [
          {
            name: 'Lisinopril',
            category: 'ACE Inhibitor',
            rationale: '*Lisinopril* may be considered for blood pressure control and cardio-renal protection. Commonly used as first-line antihypertensive therapy.',
            precautions: 'Monitor for cough, hyperkalemia, and renal function. Avoid in pregnancy and patients with angioedema history.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Amlodipine',
            category: 'Calcium Channel Blocker',
            rationale: '*Amlodipine* is often evaluated for hypertension management. Commonly used for its vasodilatory effects and favorable side effect profile.',
            precautions: 'Monitor for peripheral edema and reflex tachycardia. Use with caution in patients with heart failure.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Hydrochlorothiazide',
            category: 'Diuretic',
            rationale: '*Hydrochlorothiazide* may be considered for blood pressure control and volume management. Commonly used as adjunctive antihypertensive therapy.',
            precautions: 'Monitor electrolytes, especially potassium and magnesium. Use with caution in patients with gout or diabetes.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          }
        ];
      } else {
        // General symptom management
        drugSuggestions = [
          {
            name: 'Acetaminophen',
            category: 'Analgesic',
            rationale: '*Acetaminophen* may be considered for general pain and fever management. Commonly used as first-line analgesic with minimal side effects.',
            precautions: 'Monitor total daily dose to avoid hepatotoxicity. Use with caution in patients with liver disease.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          },
          {
            name: 'Ondansetron',
            category: 'Anti-emetic',
            rationale: '*Ondansetron* is often evaluated for nausea control. Commonly used for its anti-emetic effects with minimal sedation.',
            precautions: 'Monitor for QT prolongation, especially with other QT-prolonging medications.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          }
        ];
      }

      // Add current medications to suggestions if they exist
      if (medications.length > 0) {
        medications.forEach(med => {
          if (!drugSuggestions.find(d => d.name === med.name)) {
            drugSuggestions.unshift({
              name: med.name,
              category: 'Current Medication',
              rationale: `*${med.name}* is currently prescribed and should be continued unless contraindicated. Often evaluated for ongoing therapy.`,
              precautions: 'Review current dosing and monitor for side effects. Consider drug interactions with new medications.',
              selected: true,
              dose: med.dose || '',
              route: med.route || '',
              frequency: med.frequency || ''
            });
          }
        });
      }

      setSuggestedDrugs(drugSuggestions);
      console.log("Drug analysis generated successfully");

    } catch (error: any) {
      console.error("Error generating drug analysis:", error);
      // Fallback to basic drug suggestions
      setSuggestedDrugs([
        {
          name: 'Acetaminophen',
          category: 'Analgesic',
          rationale: '*Acetaminophen* may be considered for pain and fever management. Commonly used as first-line analgesic.',
          precautions: 'Monitor total daily dose to avoid hepatotoxicity.',
          selected: false,
          dose: '',
          route: '',
          frequency: ''
        }
      ]);
    } finally {
      setIsGeneratingDrugAnalysis(false);
    }
  };

  // Enhanced drug extraction from AI analysis
  const extractDrugsFromAIReport = (aiReport: string, contextMedications?: Medication[]) => {
    if (!aiReport) return;

    const extractedDrugs = [];
    const currentMedications = contextMedications || (activeTab === 'NEW' ? formData.medications : revisitData.medications) || [];

    // Add current medications first
    currentMedications.forEach(med => {
      extractedDrugs.push({
        name: med.name,
        category: 'Current Medication',
        rationale: `*${med.name}* is currently prescribed and should be continued unless contraindicated. Often evaluated for ongoing therapy.`,
        precautions: 'Review current dosing and monitor for side effects. Consider drug interactions with new medications.',
        selected: true,
        dose: med.dose || '',
        route: med.route || '',
        frequency: med.frequency || ''
      });
    });

    const foundDrugs = new Set();
    const existingNames = new Set(currentMedications.map(m => m.name.toLowerCase()));

    // NEW STRATEGY: Tokenize text and validate against the massive DatasetService
    // This catches ANY valid drug mentioned in the text, not just a small list
    const words = aiReport.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);

    // We scan for single words and 2-word combinations
    for (let i = 0; i < words.length; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];

      let candidate = w1; // Check single word
      let isValid = datasetService.isValidDrug(candidate);

      // If single word isn't a drug, try 2-word combo (e.g. "Calcium Carbonate")
      if (!isValid && w2) {
        const combo = `${w1} ${w2}`;
        if (datasetService.isValidDrug(combo)) {
          candidate = combo;
          isValid = true;
          i++; // Skip next word as it's part of this drug
        }
      }

      if (isValid) {
        // Clean up name (Capitalize)
        const drugName = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();

        if (!foundDrugs.has(drugName) && !existingNames.has(drugName.toLowerCase())) {
          foundDrugs.add(drugName);

          extractedDrugs.push({
            name: drugName,
            category: 'AI Identified',
            rationale: `*${drugName}* was identified in the clinical analysis. Review context in report.`,
            precautions: 'Verify indication and safety before prescribing.',
            selected: false,
            dose: '',
            route: '',
            frequency: ''
          });
        }
      }
    }

    setSuggestedDrugs(extractedDrugs);
    console.log(`Extracted ${extractedDrugs.length} drugs from AI analysis using comprehensive dataset validation`);
  };

  // Trigger revisit modal when discharged patient is selected
  // React.useEffect(() => {
  //   if (activePatient && activePatient.status.includes('Discharged')) {
  //     setShowRevisitModal(true);
  //   }
  // }, [activePatient]);

  const handleAddVisit = async () => {
    if (!activePatient || isLoggingVisit) return;
    setIsLoggingVisit(true);

    // CRITICAL FIX: Strengthening unique ID to prevent any duplicate spamming
    const uniqueVisitId = `VISIT-${Date.now()}-${Math.floor(Math.random() * 100000)}-${activePatient.id}`;

    // Enhanced AI Report Attachment Logic - Use patient-friendly report
    let reportToAttach: string | undefined = undefined;
    if (followUpVisit.attachReport) {
      try {
        console.log("Generating patient-friendly AI analysis for visit attachment");
        const report = await generatePatientFriendlyReport(activePatient);
        if (report && report.trim().length > 0 && !report.includes("Error") && !report.includes("technical difficulties")) {
          reportToAttach = report;
        }
      } catch (error: any) {
        console.error("Error generating patient-friendly report:", error);
        // Fall back to existing report if available
        if (aiReport && aiReport.trim().length > 0 && !aiReport.includes("Error") && !aiReport.includes("technical difficulties")) {
          reportToAttach = aiReport;
        }
      }
    }

    // Calculate drug details for this visit
    let drugDetailsData: any | undefined = undefined;
    try {
      const conditions = detectClinicalConditions(activePatient);
      // Logic
      const logicAnalysis = generateTreatmentRecommendations(conditions.conditions, conditions.severity, activePatient);

      // Interactions Check
      const allDrugNames = [
        ...activePatient.medications.map(m => m.name),
        ...logicAnalysis.medications.map(m => m.name)
      ];
      const uniqueDrugs = Array.from(new Set(allDrugNames.filter(n => n && n.trim())));
      const interactions = await enhancedDrugInteractionService.checkAllInteractions(uniqueDrugs);

      drugDetailsData = {
        manuallyEntered: activePatient.medications,
        logicSuggested: logicAnalysis.medications,
        interactions: interactions.map(i => ({
          drug1: i.drug1,
          drug2: i.drug2,
          severity: i.severity,
          description: i.description,
          recommendation: i.recommendation || 'Monitor'
        })),
        combinedAnalysis: `Follow-up analysis generated on ${new Date().toLocaleDateString()}`
      };
    } catch (e) {
      console.error("Error generating visit drug details:", e);
    }

    const newVisit: Visit = {
      id: uniqueVisitId,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      summary: followUpVisit.summary,
      complaints: followUpVisit.complaints || activePatient.complaints,
      vitals: { bp: followUpVisit.bp, hr: followUpVisit.hr, temp: followUpVisit.temp, spo2: followUpVisit.spo2 },
      labResults: {
        wbc: followUpVisit.wbc, platelets: followUpVisit.platelets,
        rbc: followUpVisit.rbc, creatinine: followUpVisit.creatinine
      },
      aiReport: reportToAttach,
      drugDetails: drugDetailsData // Persist analysis
    };

    const currentVisits = activePatient.visits || [];
    const updated = { ...activePatient, visits: [newVisit, ...currentVisits] };

    onUpdatePatient(updated);

    setFollowUpVisit({
      summary: '', complaints: '', bp: '', hr: '', temp: '', spo2: '',
      wbc: '', platelets: '', rbc: '', creatinine: '',
      attachReport: true
    });
    setAiReport(null);
    setIsLoggingVisit(false);

    const message = reportToAttach ?
      "Professional visit record committed with AI analysis attached." :
      "Professional visit record committed.";
    alert(message);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <nav className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg leading-none">HCP Portal</h1>
              <p className="text-[9px] md:text-[10px] text-indigo-400 font-medium tracking-widest uppercase mt-0.5 md:mt-1">Clinical Hub</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-[10px] md:text-xs font-semibold bg-white/10 px-2 md:px-3 py-1 rounded hover:bg-white/20 transition">Exit Hub</button>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto no-scrollbar">
          <TabButton label="New Session" active={activeTab === 'NEW'} onClick={() => setActiveTab('NEW')} />
          <TabButton label="Drug Details" active={activeTab === 'DRUGDETAILS'} onClick={() => setActiveTab('DRUGDETAILS')} />
          <TabButton label="Insights" active={activeTab === 'INSIGHTS'} onClick={() => setActiveTab('INSIGHTS')} />
          <TabButton label="Follow-Up" active={activeTab === 'FOLLOWUP'} onClick={() => setActiveTab('FOLLOWUP')} />
          <TabButton label="Active Registry" active={activeTab === 'REGISTRY'} onClick={() => setActiveTab('REGISTRY')} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8 flex-1 w-full">
        {activeTab === 'NEW' && (
          <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">New Clinical Session</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Analyze Drugs button remove as per user request to consolidate features */}
                <button
                  onClick={handlePreRegistrationAnalysis}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg flex flex-col items-center"
                >
                  <span className="flex items-center">
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      "Run Full AI Analysis"
                    )}
                  </span>
                  {isAnalyzing && (
                    <span className="text-[8px] mt-1 opacity-80 normal-case font-medium">{statusMessage || 'Processing Clinical Data...'}</span>
                  )}
                </button>
              </div>
            </div>

            {aiReport && (
              <>
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-5 rounded-r-xl mb-6 animate-in slide-in-from-top duration-500">
                  <h3 className="font-bold text-indigo-900 mb-2 uppercase text-xs tracking-widest">Advanced Safety Report</h3>
                  <div
                    className="prose prose-indigo prose-sm max-w-none text-indigo-900 font-medium"
                    dangerouslySetInnerHTML={{
                      __html: aiReport
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>

                {/* Diagnosis Options After AI Analysis */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200 mb-8">
                  <h3 className="font-bold text-purple-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    🩺 Diagnosis & Treatment Plan
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Based on the AI analysis above, choose your preferred diagnosis approach:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setDiagnosisType('manual');
                        // Extract diagnosis from AI report for manual reference
                        const aiDiagnosisText = extractDiagnosisFromAI(aiReport);
                        setManualDiagnosis({
                          ...manualDiagnosis,
                          primary: aiDiagnosisText || '',
                          differentials: '',
                          treatment: '',
                          confidence: 75
                        });
                      }}
                      className="p-4 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-200 transition">
                          <span className="text-blue-600 font-bold">📝</span>
                        </div>
                        <h4 className="font-bold text-gray-900">Manual Diagnosis</h4>
                      </div>
                      <p className="text-sm text-gray-600">Enter diagnosis manually with AI assistance as reference</p>
                      <div className="mt-2 text-xs text-blue-600 font-medium">→ AI report pre-filled for reference</div>
                    </button>

                    <button
                      onClick={() => {
                        setDiagnosisType('ai');
                        generateAIDiagnosisFromReport();
                      }}
                      className="p-4 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-green-200 transition">
                          <span className="text-green-600 font-bold">🤖</span>
                        </div>
                        <h4 className="font-bold text-gray-900">AI-Assisted Diagnosis</h4>
                      </div>
                      <p className="text-sm text-gray-600">Generate AI-powered diagnosis based on analysis results</p>
                      <div className="mt-2 text-xs text-green-600 font-medium">→ Uses AI analysis for diagnosis</div>
                    </button>
                  </div>

                  {/* Diagnosis Form */}
                  {diagnosisType && (
                    <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-4">
                        {diagnosisType === 'manual' ? '📝 Manual Diagnosis Entry' : '🤖 AI-Assisted Diagnosis'}
                      </h4>

                      {diagnosisType === 'manual' ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Diagnosis</label>
                            <textarea
                              value={manualDiagnosis.primary}
                              onChange={e => setManualDiagnosis({ ...manualDiagnosis, primary: e.target.value })}
                              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm h-20 resize-none"
                              placeholder="Enter primary diagnosis..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Differential Diagnoses</label>
                            <textarea
                              value={manualDiagnosis.differentials}
                              onChange={e => setManualDiagnosis({ ...manualDiagnosis, differentials: e.target.value })}
                              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm h-20 resize-none"
                              placeholder="List differential diagnoses..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Treatment Plan</label>
                            <textarea
                              value={manualDiagnosis.treatment}
                              onChange={e => setManualDiagnosis({ ...manualDiagnosis, treatment: e.target.value })}
                              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm h-20 resize-none"
                              placeholder="Outline treatment plan..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confidence Level: {manualDiagnosis.confidence}%</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={manualDiagnosis.confidence}
                              onChange={e => setManualDiagnosis({ ...manualDiagnosis, confidence: parseInt(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {aiDiagnosis ? (
                            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                              <h5 className="font-bold text-green-900 mb-2">AI-Generated Diagnosis:</h5>
                              <div className="text-sm text-gray-700 space-y-2">
                                <p><strong>Primary:</strong> {aiDiagnosis.primary}</p>
                                <p><strong>Differentials:</strong> {aiDiagnosis.differentials}</p>
                                <p><strong>Treatment:</strong> {aiDiagnosis.treatment}</p>
                                <p><strong>Confidence:</strong> {aiDiagnosis.confidence}%</p>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => {
                                    setManualDiagnosis({
                                      primary: aiDiagnosis.primary,
                                      differentials: aiDiagnosis.differentials,
                                      treatment: aiDiagnosis.treatment,
                                      confidence: aiDiagnosis.confidence
                                    });
                                    setDiagnosisType('manual');
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                                >
                                  Edit Manually
                                </button>
                                <button
                                  onClick={() => {
                                    // Save AI diagnosis
                                    console.log('AI diagnosis saved:', aiDiagnosis);
                                    alert('AI diagnosis saved successfully!');
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                >
                                  Accept Diagnosis
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                              <p className="text-sm text-gray-600 mt-2">Generating AI diagnosis...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <form onSubmit={handleRegisterStart} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Age</label>
                  <input required value={formData.age === undefined ? '' : formData.age} onChange={e => setFormData({ ...formData, age: e.target.value === '' ? undefined : Number(e.target.value) })} type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold" placeholder="Age..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sex</label>
                  <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value as any })} className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold bg-white">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} placeholder="Ht(cm)" className="border-2 border-gray-100 rounded-xl p-3 font-bold" />
                  <input value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} placeholder="Wt(kg)" className="border-2 border-gray-100 rounded-xl p-3 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
                  <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Clinical Vitals</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <VitalInput label="BP (mmHg)" value={formData.baselineVitals?.bp || ''} onChange={val => setFormData({ ...formData, baselineVitals: { ...formData.baselineVitals!, bp: val } })} />
                    <VitalInput label="HR (bpm)" value={formData.baselineVitals?.hr || ''} onChange={val => setFormData({ ...formData, baselineVitals: { ...formData.baselineVitals!, hr: val } })} />
                    <VitalInput label="Temp (°C/°F)" value={formData.baselineVitals?.temp || ''} onChange={val => setFormData({ ...formData, baselineVitals: { ...formData.baselineVitals!, temp: val } })} />
                    <VitalInput label="SpO2 (%)" value={formData.baselineVitals?.spo2 || ''} onChange={val => setFormData({ ...formData, baselineVitals: { ...formData.baselineVitals!, spo2: val } })} />
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
                  <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Clinical Tests</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <VitalInput label="WBC Count" value={formData.baselineLabs?.wbc || ''} onChange={val => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, wbc: val } })} />
                    <VitalInput label="Platelet Count" value={formData.baselineLabs?.platelets || ''} onChange={val => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, platelets: val } })} />
                    <VitalInput label="RBC Count" value={formData.baselineLabs?.rbc || ''} onChange={val => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, rbc: val } })} />
                    <VitalInput label="Creatinine" value={formData.baselineLabs?.creatinine || ''} onChange={val => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, creatinine: val } })} />
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
                  <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Social & Genetic Context</h3>
                  <div className="flex gap-4">
                    <Checkbox label="Smoking" checked={!!formData.socialHistory?.smoking} onChange={v => setFormData({ ...formData, socialHistory: { ...formData.socialHistory!, smoking: v } })} />
                    <Checkbox label="Alcohol" checked={!!formData.socialHistory?.alcohol} onChange={v => setFormData({ ...formData, socialHistory: { ...formData.socialHistory!, alcohol: v } })} />
                    <Checkbox label="Tobacco" checked={!!formData.socialHistory?.tobacco} onChange={v => setFormData({ ...formData, socialHistory: { ...formData.socialHistory!, tobacco: v } })} />
                  </div>
                  <textarea value={formData.familyHistory} onChange={e => setFormData({ ...formData, familyHistory: e.target.value })} className="w-full border-2 border-gray-100 rounded-xl p-3 h-20 font-bold text-sm" placeholder="Lineage history..." />
                  <textarea value={formData.medicalHistory} onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })} className="w-full border-2 border-gray-100 rounded-xl p-3 h-20 font-bold text-sm" placeholder="Past medical history (previous diagnoses, surgeries, chronic conditions)..." />
                </div>
              </div>

              {/* Extended Vitals & Lab Input Panel */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="font-black text-blue-900 text-[10px] uppercase tracking-widest mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Extended Vitals & Laboratory Panel
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Hematology Panel */}
                  <div className="space-y-3">
                    <h4 className="text-[8px] font-black text-blue-700 uppercase tracking-widest">Hematology</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">Hemoglobin (g/dL)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.hemoglobin || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, hemoglobin: e.target.value } })}
                          placeholder="12-16"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">ESR (mm/hr)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.esr || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, esr: e.target.value } })}
                          placeholder="0-20"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">MCH (pg)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.mch || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, mch: e.target.value } })}
                          placeholder="27-33"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">MCHC (g/dL)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.mchc || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, mchc: e.target.value } })}
                          placeholder="32-36"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">MCV (fL)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.mcv || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, mcv: e.target.value } })}
                          placeholder="80-100"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metabolic Panel */}
                  <div className="space-y-3">
                    <h4 className="text-[8px] font-black text-blue-700 uppercase tracking-widest">Metabolic</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">Blood Sugar (mg/dL)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.bloodSugar || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, bloodSugar: e.target.value } })}
                          placeholder="70-140"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">Sodium (mEq/L)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.sodium || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, sodium: e.target.value } })}
                          placeholder="135-145"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">Potassium (mEq/L)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.potassium || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, potassium: e.target.value } })}
                          placeholder="3.5-5.5"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">Triglycerides/VLDL (mg/dL)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.triglycerides || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, triglycerides: e.target.value } })}
                          placeholder="50-150"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Renal Panel */}
                  <div className="space-y-3">
                    <h4 className="text-[8px] font-black text-blue-700 uppercase tracking-widest">Renal</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">Serum Creatinine (mg/dL)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.creatinine || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, creatinine: e.target.value } })}
                          placeholder="0.6-1.3"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">BUN (mg/dL)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.bloodUreaNitrogen || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, bloodUreaNitrogen: e.target.value } })}
                          placeholder="7-20"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Liver Panel */}
                  <div className="space-y-3">
                    <h4 className="text-[8px] font-black text-blue-700 uppercase tracking-widest">Liver</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">SGOT/AST (U/L)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.sgot || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, sgot: e.target.value } })}
                          placeholder="10-40"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[7px] font-black text-gray-600 uppercase tracking-wider mb-1">SGPT/ALT (U/L)</label>
                        <input
                          type="text"
                          value={formData.baselineLabs?.sgpt || ''}
                          onChange={e => setFormData({ ...formData, baselineLabs: { ...formData.baselineLabs!, sgpt: e.target.value } })}
                          placeholder="10-40"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Current Medications Exposure</h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="relative drug-input-container">
                    <input
                      placeholder="Drug Name"
                      value={newMed.name}
                      onChange={e => handleDrugNameChange(e.target.value)}
                      className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold"
                    />
                    {drugSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {drugSuggestions.map((drug, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setNewMed({ ...newMed, name: drug });
                              setDrugSuggestions([]);
                            }}
                            className="px-3 py-2 text-sm font-medium hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            {drug}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <input list="dose-list" placeholder="Dose" value={newMed.dose} onChange={e => setNewMed({ ...newMed, dose: e.target.value })} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold" />
                    <datalist id="dose-list">
                      <option value="500mg" /><option value="250mg" /><option value="100mg" /><option value="10cc" /><option value="5cc" /><option value="1ml" /><option value="5 Units" /><option value="10 Units" />
                    </datalist>
                  </div>

                  <div className="relative">
                    <input list="route-list" placeholder="Route" value={newMed.route} onChange={e => setNewMed({ ...newMed, route: e.target.value })} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold" />
                    <datalist id="route-list">
                      <option value="Oral" /><option value="IV" /><option value="IM" /><option value="SC" /><option value="Sublingual" /><option value="Topical" /><option value="PR" />
                    </datalist>
                  </div>

                  <div className="relative">
                    <input list="freq-list" placeholder="Frequency" value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm font-bold" />
                    <datalist id="freq-list">
                      <option value="QD (Once Daily)" /><option value="BID (Twice Daily)" /><option value="TID (Thrice Daily)" /><option value="QID (4x Daily)" /><option value="PRN (As Needed)" /><option value="STAT (Immediately)" />
                    </datalist>
                  </div>

                  <button type="button" onClick={handleAddMed} className="bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase h-full min-h-[48px] shadow-lg active:scale-95 transition">Add to Record</button>
                </div>

                {formData.medications && formData.medications.length > 0 && (
                  <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100">
                    <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Medications Under Consideration:</h4>
                    <div className="space-y-2">
                      {formData.medications.map((m, i) => (
                        <div key={i} className="bg-white border border-indigo-100 p-3 rounded-xl shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <input
                                type="checkbox"
                                checked={m.isCurrentlyTaking || false}
                                onChange={e => {
                                  const updated = [...formData.medications];
                                  updated[i] = { ...updated[i], isCurrentlyTaking: e.target.checked };
                                  setFormData(prev => ({ ...prev, medications: updated }));
                                }}
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <div className="flex-1">
                                <span className="text-[10px] font-black text-indigo-700">{m.name}</span>
                                <span className="text-[9px] text-gray-500 ml-2">{m.dose} • {m.route} • {m.frequency}</span>
                                {m.isCurrentlyTaking && (
                                  <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded-full">CURRENTLY TAKING</span>
                                )}
                              </div>
                            </div>
                            <button onClick={() => removeMed(i)} className="ml-2 text-red-300 hover:text-red-500 transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[8px] text-gray-500 font-medium">
                      ✓ Check "Is patient currently taking this drug?" to include in interaction analysis
                    </div>
                  </div>
                )}

                {/* AI Suggested Drugs Box */}
                {aiSuggestedDrugs.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-200 shadow-sm">
                    <h4 className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Suggested Drugs
                    </h4>
                    <div className="space-y-3">
                      {aiSuggestedDrugs.map((drug, index) => (
                        <div key={index} className="bg-white p-3 rounded-xl border border-purple-100">
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-2">
                            <div className="sm:col-span-2">
                              <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Drug Name</label>
                              <input
                                type="text"
                                value={drug.name}
                                readOnly
                                className="w-full bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 text-xs font-bold text-purple-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">Dose *</label>
                              <input
                                type="text"
                                value={drug.dose}
                                onChange={e => updateAiSuggestedDrug(index, 'dose', e.target.value)}
                                placeholder="e.g., 500mg"
                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:border-red-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">Route *</label>
                              <select
                                value={drug.route}
                                onChange={e => updateAiSuggestedDrug(index, 'route', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:border-red-400 focus:outline-none"
                              >
                                <option value="">Select</option>
                                <option value="Oral">Oral</option>
                                <option value="IV">IV</option>
                                <option value="IM">IM</option>
                                <option value="SC">SC</option>
                                <option value="Topical">Topical</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">Frequency *</label>
                              <select
                                value={drug.frequency}
                                onChange={e => updateAiSuggestedDrug(index, 'frequency', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:border-red-400 focus:outline-none"
                              >
                                <option value="">Select</option>
                                <option value="QD (Once Daily)">QD</option>
                                <option value="BID (Twice Daily)">BID</option>
                                <option value="TID (Thrice Daily)">TID</option>
                                <option value="QID (4x Daily)">QID</option>
                                <option value="PRN (As Needed)">PRN</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-[8px] font-medium text-gray-500">
                              {!drug.isComplete && <span className="text-red-500">* Fill all mandatory fields</span>}
                              {drug.isComplete && <span className="text-green-600">✓ Ready to add</span>}
                            </div>
                            <button
                              onClick={() => addAiSuggestedDrug(index)}
                              disabled={!drug.isComplete}
                              className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition ${drug.isComplete
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                              Add to Medications
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chief Complaints & Examination */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="font-black text-blue-900 text-[10px] uppercase tracking-widest mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Chief Complaints & Clinical Findings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black text-blue-700 uppercase tracking-wider mb-2">
                      Patient's Chief Complaints:
                    </label>
                    <textarea
                      required
                      value={formData.complaints}
                      onChange={e => setFormData({ ...formData, complaints: e.target.value })}
                      className="w-full border-2 border-blue-100 rounded-xl p-4 h-32 text-sm font-medium focus:border-blue-300 focus:outline-none bg-white/80"
                      placeholder="Example: 'Patient presents with chest pain radiating to left arm, shortness of breath for 2 hours...'"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-blue-700 uppercase tracking-wider mb-2">
                      On Examination Findings:
                    </label>
                    <textarea
                      value={formData.otherFindings || ''}
                      onChange={e => setFormData({ ...formData, otherFindings: e.target.value })}
                      className="w-full border-2 border-blue-100 rounded-xl p-4 h-24 text-sm font-medium focus:border-blue-300 focus:outline-none bg-white/80"
                      placeholder="Example: 'On examination: Patient appears anxious, diaphoretic. Heart sounds regular, no murmurs. Lungs clear bilaterally. Abdomen soft, non-tender...'"
                    />
                  </div>
                </div>
              </div>

              {/* Imaging & Report Findings */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="font-black text-purple-900 text-[10px] uppercase tracking-widest mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Imaging & Report Findings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black text-purple-700 uppercase tracking-wider mb-2">
                      Imaging Results (MRI, CT, X-ray, Ultrasound, etc.):
                    </label>
                    <textarea
                      value={revisitData.otherFindings || ''}
                      onChange={e => setRevisitData({ ...revisitData, otherFindings: e.target.value })}
                      className="w-full border-2 border-purple-100 rounded-xl p-4 h-32 text-sm font-medium focus:border-purple-300 focus:outline-none bg-white/80"
                      placeholder="Example: 'CT chest shows bilateral pulmonary infiltrates consistent with pneumonia. No pleural effusion. Cardiac silhouette normal...'"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-teal-600 font-medium">
                💡 AI will analyze these findings contextually and include them in your clinical analysis
              </div>
              <div className="flex items-center space-x-3 p-4 bg-indigo-50 rounded-2xl border border-dashed border-indigo-200">
                <input type="checkbox" checked={formData.consentGiven} onChange={e => setFormData({ ...formData, consentGiven: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
                <span className="text-xs font-black text-indigo-900">Grant consent for professional clinical storage</span>
              </div>

              <button type="submit" disabled={!formData.consentGiven} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition active:scale-95 disabled:opacity-50">
                Save to Professional Registry
              </button>
            </form>
          </div>
        )}

        {activeTab === 'INSIGHTS' && <SystemInsights patients={patients} onResetRegistry={onResetRegistry} />}

        {activeTab === 'DRUGDETAILS' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <DrugInformationPanel
              medications={resolvedMedications}
              aiSuggestedDrugs={suggestedDrugs.map(d => d.name)}
              logicSuggestedDrugs={(() => {
                const targetPatient = activePatient || {
                  ...formData,
                  id: 'TEMP',
                  age: formData.age || 0,
                  sex: formData.sex || 'Male',
                  medications: formData.medications || [],
                  baselineVitals: formData.vitals || {},
                  baselineLabs: formData.labs || {},
                  socialHistory: formData.socialHistory || { smoking: false, alcohol: false, tobacco: false }
                } as any as Patient;

                try {
                  const analysis = detectClinicalConditions(targetPatient);
                  return generateTreatmentRecommendations(analysis.conditions, analysis.severity, targetPatient).medications;
                } catch (e) {
                  return [];
                }
              })()}
              extraMedications={drugInfoExtraMeds}
              removedMedications={drugInfoRemovedMeds}
              onExtraMedicationsChange={setDrugInfoExtraMeds}
              onRemovedMedicationsChange={setDrugInfoRemovedMeds}
              suggestedMedications={suggestedMedications}
              onSuggestedMedicationsChange={setSuggestedMedications}
            />
          </div>
        )}

        {activeTab === 'FOLLOWUP' && (
          <div className="space-y-6">
            <EnhancedFollowUpSystem
              patients={patients}
              userRole={userRole}
              onRevisit={(patient) => {
                setSelectedPatientId(patient.id);
                // Pre-fill revisit data from patient record while preserving structure
                setRevisitData({
                  complaints: '',
                  summary: '',
                  medicalHistory: patient.medicalHistory || '',
                  familyHistory: patient.familyHistory || '',
                  socialHistory: patient.socialHistory || { smoking: false, alcohol: false, tobacco: false },
                  vitals: { bp: '', hr: '', temp: '', spo2: '' },
                  labs: { wbc: '', platelets: '', rbc: '', creatinine: '' },
                  height: patient.height || '',
                  weight: patient.weight || '',
                  medications: patient.medications.map(m => ({ ...m, isCurrentlyTaking: true })),
                  otherFindings: '',
                  age: patient.age,
                  onExamination: '',
                  treatmentContext: patient.treatmentContext || ''
                });
                setShowRevisitModal(true);
              }}
            />
          </div>
        )}

        {activeTab === 'REGISTRY' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border shadow-sm flex flex-col h-[600px]">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registry Files ({patients.length})</h3>
                {selectedForDelete.length > 0 && <button onClick={handleBulkDelete} className="bg-red-500 text-white text-[8px] px-2 py-1 rounded font-black">Purge Selected ({selectedForDelete.length})</button>}
              </div>
              <div className="overflow-y-auto flex-1 divide-y">
                {/* Active Patients Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-b">
                  <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Active Patients</h3>
                </div>
                {patients.filter(p => !p.status.includes('Discharged') && p.status !== 'Observation').length === 0 ?
                  <p className="p-6 text-center text-gray-400 font-bold italic text-xs">No active patients.</p> :
                  patients.filter(p => !p.status.includes('Discharged') && p.status !== 'Observation').map(p => (
                    <div key={p.id} className={`p-4 hover:bg-indigo-50 transition cursor-pointer flex items-center gap-3 ${selectedPatientId === p.id ? 'bg-indigo-50' : ''}`} onClick={() => setSelectedPatientId(p.id)}>
                      <input type="checkbox" checked={selectedForDelete.includes(p.id)} onChange={() => toggleDeleteSelect(p.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 text-red-500 rounded" />
                      <div className="flex-1">
                        <p className="font-black text-slate-900 text-sm">{p.fullName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{p.id} • {p.age}y {p.sex}</p>
                      </div>
                    </div>
                  ))}

                {/* Observation Patients Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 border-b mt-4">
                  <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Observation Patients (Monitoring)</h3>
                </div>
                {patients.filter(p => p.status === 'Observation').length === 0 ?
                  <p className="p-6 text-center text-gray-400 font-bold italic text-xs">No observation patients.</p> :
                  patients.filter(p => p.status === 'Observation').map(p => (
                    <div key={p.id} className={`p-4 hover:bg-amber-50 transition cursor-pointer flex items-center gap-3 ${selectedPatientId === p.id ? 'bg-amber-50' : ''}`} onClick={() => setSelectedPatientId(p.id)}>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 text-sm">{p.fullName}</p>
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">{p.id} • {p.age}y {p.sex} • {p.status}</p>
                        <p className="text-[8px] text-amber-500 font-medium mt-1">Click to monitor and update</p>
                      </div>
                    </div>
                  ))}

                {/* Discharged Patients Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 border-b mt-4">
                  <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Discharged Patients (Revisit Available)</h3>
                </div>
                {patients.filter(p => p.status.includes('Discharged')).length === 0 ?
                  <p className="p-6 text-center text-gray-400 font-bold italic text-xs">No discharged patients.</p> :
                  patients.filter(p => p.status.includes('Discharged')).map(p => (
                    <div key={p.id} className={`p-4 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-3 ${selectedPatientId === p.id ? 'bg-emerald-50' : ''}`} onClick={() => setSelectedPatientId(p.id)}>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 text-sm">{p.fullName}</p>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">{p.id} • {p.age}y {p.sex} • {p.status}</p>
                        <p className="text-[8px] text-emerald-500 font-medium mt-1">Click to create revisit case</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {!activePatient ? (
                <div className="h-full bg-white rounded-2xl border-2 border-dashed flex items-center justify-center p-10 text-gray-400 font-black uppercase tracking-widest text-sm">Select Clinical File</div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-6 md:p-8 rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">{activePatient.fullName}</h2>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{activePatient.id} • {activePatient.status}</p>
                      </div>
                      <select value={activePatient.status} onChange={e => {
                        const newStatus = e.target.value as PatientStatus;
                        if (newStatus.includes('Discharged') && activePatient.status !== newStatus) {
                          setShowDischargeModal(true);
                        } else {
                          onUpdatePatient({ ...activePatient, status: newStatus });
                        }
                      }} className="bg-slate-900 text-white rounded-xl text-[10px] px-4 py-2 font-black uppercase">
                        <option>Active</option><option>Observation</option><option>Discharged - Improved</option><option>Discharged - Not Improved</option>
                      </select>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 space-y-4 border">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprehensive Clinical Profile</h4>
                      <div className="grid grid-cols-2 gap-6 text-xs font-bold">
                        <div className="col-span-2 md:col-span-1"><p className="text-indigo-600 mb-1">Chief Complaints:</p><p className="text-slate-800">{activePatient.complaints}</p></div>
                        <div className="col-span-2 md:col-span-1"><p className="text-indigo-600 mb-1">Medical/Family History:</p><p className="text-slate-800">{activePatient.familyHistory || 'None recorded'}</p></div>
                        <div className="col-span-2 md:col-span-1"><p className="text-indigo-600 mb-1">Initial Vitals:</p><p className="text-slate-800 font-black">BP: {activePatient.baselineVitals.bp} | HR: {activePatient.baselineVitals.hr} | Temp: {activePatient.baselineVitals.temp}</p></div>
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-indigo-600 mb-1">Initial Lab Tests:</p>
                          <p className="text-slate-800 uppercase text-[9px]">WBC: {activePatient.baselineLabs?.wbc || '--'} | Platelets: {activePatient.baselineLabs?.platelets || '--'} | RBC: {activePatient.baselineLabs?.rbc || '--'}</p>
                        </div>
                        <div className="col-span-2"><p className="text-indigo-600 mb-1">Baseline Medications:</p><p className="text-slate-800">{activePatient.medications.map(m => `${m.name} (${m.dose}) via ${m.route}`).join(', ') || 'None recorded'}</p></div>

                        {/* Suggested Medications Display */}
                        {suggestedMedications.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-emerald-600 mb-2 flex items-center gap-2">
                              <span>💡 Suggested Medications (from Drug Information):</span>
                            </p>
                            <div className="space-y-2">
                              {suggestedMedications.map((med, idx) => (
                                <div key={idx} className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-slate-900 font-black text-sm capitalize">{med.name}</p>
                                      <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                                        <div>
                                          <span className="text-emerald-700 font-bold uppercase">Dose:</span>
                                          <span className="text-slate-700 ml-1">{med.dose}</span>
                                        </div>
                                        <div>
                                          <span className="text-emerald-700 font-bold uppercase">Frequency:</span>
                                          <span className="text-slate-700 ml-1">{med.frequency}</span>
                                        </div>
                                        <div>
                                          <span className="text-emerald-700 font-bold uppercase">Route:</span>
                                          <span className="text-slate-700 ml-1">{med.route}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${med.source === 'AI' ? 'bg-purple-100 text-purple-700' :
                                      med.source === 'Logic' ? 'bg-amber-100 text-amber-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                      {med.source}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border-2 border-slate-100 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-slate-700">📝 Clinical Visit Update</h4>
                        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          Log Current Visit
                        </div>
                      </div>
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          💡 <strong>What this is:</strong> Record today's visit details, observations, and treatment decisions.
                          This creates a permanent record in the patient's file.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">📋 Today's Complaints/Findings</label>
                          <textarea
                            placeholder="What brought the patient in today? Current symptoms, concerns..."
                            value={followUpVisit.complaints}
                            onChange={e => setFollowUpVisit({ ...followUpVisit, complaints: e.target.value })}
                            className="border rounded-xl p-3 text-sm h-24 font-medium w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">📄 Clinical Summary</label>
                          <textarea
                            placeholder="Your assessment, diagnosis, and treatment plan for today..."
                            value={followUpVisit.summary}
                            onChange={e => setFollowUpVisit({ ...followUpVisit, summary: e.target.value })}
                            className="border rounded-xl p-3 text-sm h-24 font-bold w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <input placeholder="BP" value={followUpVisit.bp} onChange={e => setFollowUpVisit({ ...followUpVisit, bp: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                        <input placeholder="HR" value={followUpVisit.hr} onChange={e => setFollowUpVisit({ ...followUpVisit, hr: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                        <input placeholder="Temp (C/F)" value={followUpVisit.temp} onChange={e => setFollowUpVisit({ ...followUpVisit, temp: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                        <input placeholder="SpO2" value={followUpVisit.spo2} onChange={e => setFollowUpVisit({ ...followUpVisit, spo2: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <input placeholder="WBC" value={followUpVisit.wbc} onChange={e => setFollowUpVisit({ ...followUpVisit, wbc: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                        <input placeholder="Platelets" value={followUpVisit.platelets} onChange={e => setFollowUpVisit({ ...followUpVisit, platelets: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                        <input placeholder="RBC" value={followUpVisit.rbc} onChange={e => setFollowUpVisit({ ...followUpVisit, rbc: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                        <input placeholder="Creatinine" value={followUpVisit.creatinine} onChange={e => setFollowUpVisit({ ...followUpVisit, creatinine: e.target.value })} className="border rounded-xl p-2 text-xs font-bold text-center" />
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" checked={followUpVisit.attachReport} onChange={e => setFollowUpVisit({ ...followUpVisit, attachReport: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Attach Latest AI Analysis</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!activePatient) return;
                            setIsAnalyzing(true);
                            setAiReport(null);
                            try {
                              const updatedPatient = {
                                ...activePatient,
                                baselineVitals: {
                                  bp: followUpVisit.bp || activePatient.baselineVitals.bp,
                                  hr: followUpVisit.hr || activePatient.baselineVitals.hr,
                                  temp: followUpVisit.temp || activePatient.baselineVitals.temp,
                                  spo2: followUpVisit.spo2 || activePatient.baselineVitals.spo2
                                },
                                baselineLabs: {
                                  wbc: followUpVisit.wbc || activePatient.baselineLabs?.wbc || '',
                                  platelets: followUpVisit.platelets || activePatient.baselineLabs?.platelets || '',
                                  rbc: followUpVisit.rbc || activePatient.baselineLabs?.rbc || '',
                                  creatinine: followUpVisit.creatinine || activePatient.baselineLabs?.creatinine || ''
                                }
                              };
                              console.log("Refreshing AI analysis for visit update");
                              const report = await generateSafetyReport(updatedPatient);
                              if (report && report.trim().length > 0) {
                                setAiReport(report);
                                console.log("Visit analysis generated successfully");
                              } else {
                                throw new Error("Empty response from AI service");
                              }
                            } catch (e: any) {
                              console.error("Error refreshing AI analysis:", e);
                              const errorMsg = e.message || "Unknown error occurred";
                              alert(`Error generating analysis: ${errorMsg}. Please check your API key and try again.`);
                              setAiReport(`Error: ${errorMsg}`);
                            } finally {
                              setIsAnalyzing(false);
                            }
                          }}
                          disabled={isAnalyzing}
                          className="text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? "Analyzing..." : "Refresh AI Logic"}
                        </button>
                      </div>
                      <button
                        onClick={handleAddVisit}
                        disabled={isLoggingVisit}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-black transition disabled:opacity-50"
                      >
                        {isLoggingVisit ? 'Committing...' : 'Log Professional Visit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showPinDialog && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md border-t-8 border-indigo-600 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-900 text-center mb-4">Security PIN Required</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Create access key for Patient ID: <span className="font-mono font-black text-indigo-600">{tempId}</span></p>
            <input type="password" maxLength={6} value={patientPin} onChange={e => setPatientPin(e.target.value)} placeholder="••••" className="w-full border-4 border-slate-50 rounded-2xl p-4 text-center text-3xl font-black outline-none bg-slate-50 focus:border-indigo-100" />
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowPinDialog(false)} className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase">Cancel</button>
              <button onClick={handleCompleteRegistration} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Finalize</button>
            </div>
          </div>
        </div>
      )}

      {showDischargeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border-t-8 border-emerald-600 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-900 text-center mb-6">Post-Discharge Data Entry</h3>
            <p className="text-sm text-gray-500 text-center mb-8">Enter discharge information for Patient ID: <span className="font-mono font-black text-emerald-600">{activePatient?.id}</span></p>

            <div className="space-y-6">
              {/* Discharge Vitals */}
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Discharge Vitals</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <VitalInput label="BP" value={dischargeData.dischargeVitals.bp} onChange={v => setDischargeData({ ...dischargeData, dischargeVitals: { ...dischargeData.dischargeVitals, bp: v } })} />
                  <VitalInput label="HR" value={dischargeData.dischargeVitals.hr} onChange={v => setDischargeData({ ...dischargeData, dischargeVitals: { ...dischargeData.dischargeVitals, hr: v } })} />
                  <VitalInput label="Temp" value={dischargeData.dischargeVitals.temp} onChange={v => setDischargeData({ ...dischargeData, dischargeVitals: { ...dischargeData.dischargeVitals, temp: v } })} />
                  <VitalInput label="SpO2" value={dischargeData.dischargeVitals.spo2} onChange={v => setDischargeData({ ...dischargeData, dischargeVitals: { ...dischargeData.dischargeVitals, spo2: v } })} />
                </div>
              </div>

              {/* Discharge Labs - Enhanced */}
              <div className="bg-slate-50 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Discharge Lab Results</h4>
                  <span className="text-xs text-slate-500 font-medium">Optional - Fill if available</span>
                </div>

                {/* Basic Labs */}
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Basic Laboratory Values</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalInput label="WBC" value={dischargeData.dischargeLabs.wbc} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, wbc: v } })} />
                    <VitalInput label="Platelets" value={dischargeData.dischargeLabs.platelets} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, platelets: v } })} />
                    <VitalInput label="RBC" value={dischargeData.dischargeLabs.rbc} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, rbc: v } })} />
                    <VitalInput label="Creatinine" value={dischargeData.dischargeLabs.creatinine} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, creatinine: v } })} />
                  </div>
                </div>

                {/* Hematology */}
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Hematology</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalInput label="Hemoglobin" value={dischargeData.dischargeLabs.hemoglobin} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, hemoglobin: v } })} />
                    <VitalInput label="MCV" value={dischargeData.dischargeLabs.mcv} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, mcv: v } })} />
                    <VitalInput label="MCH" value={dischargeData.dischargeLabs.mch} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, mch: v } })} />
                    <VitalInput label="MCHC" value={dischargeData.dischargeLabs.mchc} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, mchc: v } })} />
                  </div>
                </div>

                {/* Chemistry */}
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Chemistry</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalInput label="Blood Sugar" value={dischargeData.dischargeLabs.bloodSugar} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, bloodSugar: v } })} />
                    <VitalInput label="Sodium" value={dischargeData.dischargeLabs.sodium} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, sodium: v } })} />
                    <VitalInput label="Potassium" value={dischargeData.dischargeLabs.potassium} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, potassium: v } })} />
                    <VitalInput label="BUN" value={dischargeData.dischargeLabs.bloodUreaNitrogen} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, bloodUreaNitrogen: v } })} />
                  </div>
                </div>

                {/* Liver Function */}
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Liver Function</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalInput label="SGOT (AST)" value={dischargeData.dischargeLabs.sgot} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, sgot: v } })} />
                    <VitalInput label="SGPT (ALT)" value={dischargeData.dischargeLabs.sgpt} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, sgpt: v } })} />
                    <VitalInput label="Triglycerides" value={dischargeData.dischargeLabs.triglycerides} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, triglycerides: v } })} />
                    <VitalInput label="ESR" value={dischargeData.dischargeLabs.esr} onChange={v => setDischargeData({ ...dischargeData, dischargeLabs: { ...dischargeData.dischargeLabs, esr: v } })} />
                  </div>
                </div>

                {/* Quick Fill Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setDischargeData({
                        ...dischargeData,
                        dischargeLabs: {
                          wbc: '7.5', platelets: '280', rbc: '4.8', creatinine: '1.2',
                          hemoglobin: '14.5', mcv: '90', mch: '30', mchc: '33',
                          bloodSugar: '95', sodium: '140', potassium: '4.0', bloodUreaNitrogen: '15',
                          sgot: '25', sgpt: '30', triglycerides: '120', esr: '10'
                        }
                      });
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-black rounded hover:bg-blue-200 transition"
                  >
                    Fill Normal Values
                  </button>
                  <button
                    onClick={() => {
                      setDischargeData({
                        ...dischargeData,
                        dischargeLabs: {
                          wbc: '', platelets: '', rbc: '', creatinine: '',
                          hemoglobin: '', esr: '', mch: '', mchc: '',
                          mcv: '', bloodSugar: '', sodium: '', potassium: '',
                          triglycerides: '', bloodUreaNitrogen: '', sgot: '', sgpt: ''
                        }
                      });
                    }}
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded hover:bg-slate-200 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Lifestyle Modifications */}
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Lifestyle Modifications</h4>
                <textarea
                  value={dischargeData.lifestyleModifications}
                  onChange={e => setDischargeData({ ...dischargeData, lifestyleModifications: e.target.value })}
                  placeholder="Enter lifestyle recommendations (diet, exercise, sleep, etc.)"
                  className="w-full border-2 border-slate-100 rounded-xl p-4 text-sm font-bold h-24 resize-none"
                />
              </div>

              {/* Discharge Instructions */}
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Discharge Instructions</h4>
                <textarea
                  value={dischargeData.dischargeInstructions}
                  onChange={e => setDischargeData({ ...dischargeData, dischargeInstructions: e.target.value })}
                  placeholder="Enter specific discharge instructions for the patient"
                  className="w-full border-2 border-slate-100 rounded-xl p-4 text-sm font-bold h-24 resize-none"
                />
              </div>

              {/* Follow-up Plan */}
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Follow-up Plan</h4>
                <textarea
                  value={dischargeData.followUpPlan}
                  onChange={e => setDischargeData({ ...dischargeData, followUpPlan: e.target.value })}
                  placeholder="Enter follow-up appointments and monitoring plan"
                  className="w-full border-2 border-slate-100 rounded-xl p-4 text-sm font-bold h-24 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowDischargeModal(false)} className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase">Cancel</button>
              <button onClick={() => {
                if (activePatient) {
                  // Create discharge visit if no visits exist, or update last visit
                  const dischargeVisit = {
                    id: `discharge-${Date.now()}`,
                    date: new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }),
                    summary: 'Discharge Summary',
                    complaints: activePatient.complaints,
                    vitals: dischargeData.dischargeVitals,
                    labResults: dischargeData.dischargeLabs,
                    lifestyleModifications: dischargeData.lifestyleModifications,
                    dischargeVitals: dischargeData.dischargeVitals,
                    dischargeLabs: dischargeData.dischargeLabs,
                    dischargeInstructions: dischargeData.dischargeInstructions,
                    followUpPlan: dischargeData.followUpPlan
                  };

                  let updatedVisits;
                  if (activePatient.visits.length > 0) {
                    // Update last visit
                    updatedVisits = [...activePatient.visits];
                    updatedVisits[updatedVisits.length - 1] = dischargeVisit;
                  } else {
                    // Create first visit
                    updatedVisits = [dischargeVisit];
                  }

                  const dischargeStatus = activePatient.status.includes('Improved') ? 'Discharged - Improved' : 'Discharged - Not Improved';
                  onUpdatePatient({ ...activePatient, visits: updatedVisits, status: dischargeStatus });
                  setShowDischargeModal(false);

                  // Reset form
                  setDischargeData({
                    lifestyleModifications: '',
                    dischargeVitals: { bp: '', hr: '', temp: '', spo2: '' },
                    dischargeLabs: {
                      wbc: '',
                      platelets: '',
                      rbc: '',
                      creatinine: '',
                      hemoglobin: '',
                      esr: '',
                      mch: '',
                      mchc: '',
                      mcv: '',
                      bloodSugar: '',
                      sodium: '',
                      potassium: '',
                      triglycerides: '',
                      bloodUreaNitrogen: '',
                      sgot: '',
                      sgpt: ''
                    },
                    dischargeInstructions: '',
                    followUpPlan: ''
                  });

                  console.log("Discharge data saved successfully!");
                }
              }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Save Discharge Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Revisit Modal for Discharged Patients - Hospital OPD Style */}
      {showRevisitModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto border-t-8 border-emerald-600 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">OPD Revisit Registration</h3>
              <p className="text-sm text-gray-600">Creating revisit case for Patient ID: <span className="font-mono font-black text-emerald-600">{(activePatient || patients.find(p => p.id === selectedPatientId))?.id}</span></p>
              <p className="text-xs text-emerald-600 font-medium mt-2">Patient info preserved • New visit details required</p>
            </div>

            {/* Patient Information - Read Only */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-2xl mb-8 border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Patient Information (Unchangeable)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</p>
                  <p className="text-sm font-black text-slate-800">{(activePatient || patients.find(p => p.id === selectedPatientId))?.fullName}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Age *</p>
                  <input
                    type="number"
                    value={revisitData.age || activePatient?.age || ''}
                    onChange={e => setRevisitData({ ...revisitData, age: parseInt(e.target.value) })}
                    className="w-full border-2 border-emerald-200 rounded-lg p-2 text-sm font-bold"
                    placeholder="Current age"
                  />
                  <p className="text-xs text-slate-500 mt-1">Previous: {activePatient?.age} years</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Sex</p>
                  <p className="text-sm font-black text-slate-800">{activePatient?.sex}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Case Type</p>
                  <p className="text-sm font-black text-emerald-700">REVISIT</p>
                </div>
              </div>
            </div>

            {/* Previous Case Summary */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl mb-8 border border-amber-200">
              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Previous Case Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-amber-200">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2">Previous Visits</p>
                  <p className="text-lg font-black text-slate-800">{activePatient?.visits.length || 0}</p>
                  <p className="text-xs text-slate-600">Total visits recorded</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2">Last Visit</p>
                  <p className="text-sm font-black text-slate-800">{activePatient?.visits[0]?.date || 'No visits'}</p>
                  <p className="text-xs text-slate-600 truncate">{activePatient?.visits[0]?.complaints || 'No complaints'}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2">Status</p>
                  <p className="text-sm font-black text-slate-800">{activePatient?.status}</p>
                  <p className="text-xs text-slate-600">Previous case status</p>
                </div>
              </div>
            </div>

            {/* New Visit Details Form */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl mb-8 border border-emerald-200">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Visit Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Height (cm)</label>
                  <input
                    type="text"
                    value={revisitData.height}
                    onChange={e => setRevisitData({ ...revisitData, height: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm"
                    placeholder="cm"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={revisitData.weight}
                    onChange={e => setRevisitData({ ...revisitData, weight: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-sm"
                    placeholder="kg"
                  />
                </div>
              </div>

              {/* Medications Section */}
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Current Medications</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-700 font-medium">Include in Drug Analysis:</span>
                    <button
                      onClick={() => {
                        const updated = revisitData.medications.map(med => ({
                          ...med,
                          isCurrentlyTaking: true
                        }));
                        setRevisitData({ ...revisitData, medications: updated });
                      }}
                      className="px-2 py-1 bg-purple-600 text-white text-xs font-black rounded hover:bg-purple-700 transition"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        const updated = revisitData.medications.map(med => ({
                          ...med,
                          isCurrentlyTaking: false
                        }));
                        setRevisitData({ ...revisitData, medications: updated });
                      }}
                      className="px-2 py-1 bg-gray-600 text-white text-xs font-black rounded hover:bg-gray-700 transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {revisitData.medications.map((med, index) => (
                    <div key={index} className={`bg-white p-3 rounded-xl border-2 ${med.isCurrentlyTaking ? 'border-purple-300 bg-purple-50' : 'border-purple-100'}`}>
                      <div className="flex items-start gap-3">
                        <div className="pt-2">
                          <input
                            type="checkbox"
                            checked={med.isCurrentlyTaking || false}
                            onChange={(e) => {
                              const updated = [...revisitData.medications];
                              updated[index] = {
                                ...updated[index],
                                isCurrentlyTaking: e.target.checked
                              };
                              setRevisitData({ ...revisitData, medications: updated });
                            }}
                            className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <div className="md:col-span-2">
                              <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Medication Name</label>
                              <input
                                type="text"
                                value={med.name}
                                onChange={e => {
                                  const updated = [...revisitData.medications];
                                  updated[index].name = e.target.value;
                                  setRevisitData({ ...revisitData, medications: updated });
                                }}
                                className="w-full border-2 border-gray-100 rounded-lg p-2 text-xs font-bold"
                                placeholder="Medication name"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Dose</label>
                              <input
                                type="text"
                                value={med.dose}
                                onChange={e => {
                                  const updated = [...revisitData.medications];
                                  updated[index].dose = e.target.value;
                                  setRevisitData({ ...revisitData, medications: updated });
                                }}
                                className="w-full border-2 border-gray-100 rounded-lg p-2 text-xs font-bold"
                                placeholder="e.g., 500mg"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Route</label>
                              <select
                                value={med.route}
                                onChange={e => {
                                  const updated = [...revisitData.medications];
                                  updated[index].route = e.target.value;
                                  setRevisitData({ ...revisitData, medications: updated });
                                }}
                                className="w-full border-2 border-gray-100 rounded-lg p-2 text-xs font-bold"
                              >
                                <option value="">Select</option>
                                <option value="Oral">Oral</option>
                                <option value="IV">IV</option>
                                <option value="IM">IM</option>
                                <option value="SC">SC</option>
                                <option value="Topical">Topical</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Frequency</label>
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={e => {
                                  const updated = [...revisitData.medications];
                                  updated[index].frequency = e.target.value;
                                  setRevisitData({ ...revisitData, medications: updated });
                                }}
                                className="w-full border-2 border-gray-100 rounded-lg p-2 text-xs font-bold"
                                placeholder="e.g., Twice daily"
                              />
                            </div>
                          </div>
                          {med.isCurrentlyTaking && (
                            <div className="mt-2 text-xs text-purple-700 font-medium bg-purple-100 rounded px-2 py-1 inline-block">
                              ✓ Included in Drug Analysis
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setRevisitData({
                        ...revisitData,
                        medications: [...revisitData.medications, {
                          name: '',
                          dose: '',
                          route: '',
                          frequency: '',
                          isCurrentlyTaking: false
                        }]
                      });
                    }}
                    className="w-full py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase"
                  >
                    + Add Medication
                  </button>
                </div>
              </div>

              {/* Imaging & Other Findings */}
              <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
                <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-4">Imaging & Other Findings</h4>
                <textarea
                  value={revisitData.otherFindings}
                  onChange={e => setRevisitData({ ...revisitData, otherFindings: e.target.value })}
                  placeholder="X-ray, CT, MRI findings or other clinical observations..."
                  className="w-full border-2 border-teal-100 rounded-xl p-4 text-sm font-bold h-24 resize-none"
                />
              </div>

              {/* Treatment Context */}
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">Treatment Context</h4>
                <textarea
                  value={revisitData.treatmentContext}
                  onChange={e => setRevisitData({ ...revisitData, treatmentContext: e.target.value })}
                  placeholder="Treatment context, previous therapies, specialist consultations..."
                  className="w-full border-2 border-orange-100 rounded-xl p-4 text-sm font-bold h-24 resize-none"
                />
              </div>
            </div>

            {/* Current Complaints & History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Current Complaints *</h4>
                <textarea
                  value={revisitData.complaints}
                  onChange={e => setRevisitData({ ...revisitData, complaints: e.target.value })}
                  placeholder="Describe current symptoms or reason for revisit..."
                  className="w-full border-2 border-slate-100 rounded-xl p-4 text-sm font-bold h-32 resize-none"
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Updated Medical History</h4>
                <textarea
                  value={revisitData.medicalHistory}
                  onChange={e => setRevisitData({ ...revisitData, medicalHistory: e.target.value })}
                  placeholder="Any new medical conditions or updates..."
                  className="w-full border-2 border-slate-100 rounded-xl p-4 text-sm font-bold h-32 resize-none"
                />
              </div>
            </div>

            {/* Social History */}
            <div className="bg-slate-50 p-6 rounded-2xl mb-6">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Social History</h4>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={revisitData.socialHistory.smoking}
                    onChange={e => setRevisitData({ ...revisitData, socialHistory: { ...revisitData.socialHistory, smoking: e.target.checked } })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm font-bold">Smoking</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={revisitData.socialHistory.alcohol}
                    onChange={e => setRevisitData({ ...revisitData, socialHistory: { ...revisitData.socialHistory, alcohol: e.target.checked } })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm font-bold">Alcohol</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={revisitData.socialHistory.tobacco}
                    onChange={e => setRevisitData({ ...revisitData, socialHistory: { ...revisitData.socialHistory, tobacco: e.target.checked } })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm font-bold">Tobacco</span>
                </label>
              </div>
            </div>

            {/* Current Vitals & Labs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Current Vitals</h4>
                <div className="grid grid-cols-2 gap-4">
                  <VitalInput label="BP" value={revisitData.vitals.bp} onChange={v => setRevisitData({ ...revisitData, vitals: { ...revisitData.vitals, bp: v } })} />
                  <VitalInput label="HR" value={revisitData.vitals.hr} onChange={v => setRevisitData({ ...revisitData, vitals: { ...revisitData.vitals, hr: v } })} />
                  <VitalInput label="Temp" value={revisitData.vitals.temp} onChange={v => setRevisitData({ ...revisitData, vitals: { ...revisitData.vitals, temp: v } })} />
                  <VitalInput label="SpO2" value={revisitData.vitals.spo2} onChange={v => setRevisitData({ ...revisitData, vitals: { ...revisitData.vitals, spo2: v } })} />
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4">Current Lab Results</h4>
                <div className="grid grid-cols-2 gap-4">
                  <VitalInput label="WBC" value={revisitData.labs.wbc} onChange={v => setRevisitData({ ...revisitData, labs: { ...revisitData.labs, wbc: v } })} />
                  <VitalInput label="Platelets" value={revisitData.labs.platelets} onChange={v => setRevisitData({ ...revisitData, labs: { ...revisitData.labs, platelets: v } })} />
                  <VitalInput label="RBC" value={revisitData.labs.rbc} onChange={v => setRevisitData({ ...revisitData, labs: { ...revisitData.labs, rbc: v } })} />
                  <VitalInput label="Creatinine" value={revisitData.labs.creatinine} onChange={v => setRevisitData({ ...revisitData, labs: { ...revisitData.labs, creatinine: v } })} />
                </div>
              </div>
            </div>

            {/* Visit Summary */}
            <div className="bg-slate-50 p-6 rounded-2xl mb-6">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">OPD Assessment & Plan</h4>
              <textarea
                value={revisitData.summary}
                onChange={e => setRevisitData({ ...revisitData, summary: e.target.value })}
                placeholder="Initial assessment, diagnosis, and treatment plan for this revisit..."
                className="w-full border-2 border-slate-100 rounded-xl p-4 text-sm font-bold h-32 resize-none"
              />
            </div>

            {/* AI Analysis Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl mb-8 border border-indigo-200">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Analysis for Revisit
              </h4>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={generateRevisitAIAnalysis}
                  disabled={isRevisitAnalyzing || !revisitData.complaints}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50 transition flex flex-col items-center justify-center min-h-[50px]"
                >
                  <span className="flex items-center">
                    {isRevisitAnalyzing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate AI Analysis
                      </>
                    )}
                  </span>
                  {isRevisitAnalyzing && (
                    <span className="text-[7px] mt-1 opacity-80 normal-case font-bold">{statusMessage || 'Processing...'}</span>
                  )}
                </button>
              </div>

              {revisitAiReport && (
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-5 rounded-r-xl">
                  <h5 className="font-bold text-indigo-900 mb-2 uppercase text-xs tracking-widest">AI Analysis Report</h5>
                  <div
                    className="prose prose-indigo prose-sm max-w-none text-indigo-900 font-medium"
                    dangerouslySetInnerHTML={{
                      __html: revisitAiReport
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}
            </div>

            {/* Final Diagnosis Box - Enhanced */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl mb-8 border border-emerald-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-black text-emerald-700 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  🩺 Diagnosis & Treatment Plan
                </h4>
                <div className="text-xs text-emerald-600 font-medium bg-emerald-100 px-3 py-1 rounded-full">
                  Choose Analysis Type
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-bold text-slate-700 mb-3 block">🔍 Select Diagnosis Method:</label>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setDiagnosisType('manual')}
                    className={`py-3 px-4 rounded-xl font-bold text-sm uppercase transition-all transform hover:scale-105 ${diagnosisType === 'manual'
                      ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300'
                      : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                  >
                    📝 Manual Diagnosis
                    <div className="text-xs font-normal mt-1 opacity-80">Enter diagnosis manually</div>
                  </button>
                  <button
                    onClick={() => setDiagnosisType('ai')}
                    className={`py-3 px-4 rounded-xl font-bold text-sm uppercase transition-all transform hover:scale-105 ${diagnosisType === 'ai'
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                      : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                  >
                    🤖 AI-Assisted Diagnosis
                    <div className="text-xs font-normal mt-1 opacity-80">Get AI-powered diagnosis</div>
                  </button>
                </div>
              </div>
              <div>
                {diagnosisType === 'manual' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-700">Manual Diagnosis Entry</h4>
                      <button
                        onClick={() => setShowPastCases(!showPastCases)}
                        className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition"
                      >
                        📋 {showPastCases ? 'Hide' : 'Show'} Past Cases
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Primary Diagnosis</label>
                      <textarea
                        value={manualDiagnosis.primary}
                        onChange={e => setManualDiagnosis({ ...manualDiagnosis, primary: e.target.value })}
                        className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold h-20 resize-none"
                        placeholder="Enter primary diagnosis..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Differential Diagnoses</label>
                      <textarea
                        value={manualDiagnosis.differentials}
                        onChange={e => setManualDiagnosis({ ...manualDiagnosis, differentials: e.target.value })}
                        className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm h-20 resize-none"
                        placeholder="List differential diagnoses..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Treatment Plan</label>
                      <textarea
                        value={manualDiagnosis.treatment}
                        onChange={e => setManualDiagnosis({ ...manualDiagnosis, treatment: e.target.value })}
                        className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm h-20 resize-none"
                        placeholder="Outline treatment plan..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Confidence Level: {manualDiagnosis.confidence}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={manualDiagnosis.confidence}
                        onChange={e => setManualDiagnosis({ ...manualDiagnosis, confidence: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {diagnosisType === 'ai' && (
                  <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={generateAIDiagnosis}
                        disabled={isGeneratingDiagnosis || !revisitData.complaints}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50 transition flex items-center justify-center"
                      >
                        {isGeneratingDiagnosis ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8C12 4 8 4 4 8"></path>
                            </svg>
                            Generating AI Diagnosis...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate AI Diagnosis
                          </>
                        )}
                      </button>
                    </div>

                    {aiDiagnosis && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-600 p-5 rounded-r-xl">
                        <h5 className="font-bold text-emerald-900 mb-3 uppercase text-xs tracking-widest">AI-Generated Diagnosis</h5>
                        <div className="space-y-3">
                          <div>
                            <h6 className="font-black text-emerald-800 text-xs uppercase tracking-wider mb-1">Primary Diagnosis</h6>
                            <div className="text-emerald-900 font-medium text-sm">{aiDiagnosis.primary}</div>
                          </div>
                          <div>
                            <h6 className="font-black text-emerald-800 text-xs uppercase tracking-wider mb-1">Differential Diagnoses</h6>
                            <div className="text-emerald-900 font-medium text-sm">{aiDiagnosis.differentials}</div>
                          </div>
                          <div>
                            <h6 className="font-black text-emerald-800 text-xs uppercase tracking-wider mb-1">Treatment Plan</h6>
                            <div className="text-emerald-900 font-medium text-sm">{aiDiagnosis.treatment}</div>
                          </div>
                          <div>
                            <h6 className="font-black text-emerald-800 text-xs uppercase tracking-wider mb-1">Confidence Level</h6>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-emerald-200 rounded-full h-2">
                                <div
                                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${aiDiagnosis.confidence}%` }}
                                />
                              </div>
                              <span className="text-emerald-900 font-black text-xs">{aiDiagnosis.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drug Analysis & Suggestion Box */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl mb-8 border border-amber-200">
              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Drug Analysis & Medication Suggestions
              </h4>

              <div className="mb-4">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Analysis Type</label>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setDrugAnalysisType('manual')}
                    className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${drugAnalysisType === 'manual'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setDrugAnalysisType('ai')}
                    className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${drugAnalysisType === 'ai'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    AI-Assisted
                  </button>
                  <button
                    onClick={() => setDrugAnalysisType('logic')}
                    className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${drugAnalysisType === 'logic'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Logic-Based
                  </button>
                </div>
              </div>

              {/* Extract Drugs from AI Analysis */}
              {revisitAiReport && (
                <div className="mb-6">
                  <button
                    onClick={() => extractDrugsFromAIReport(revisitAiReport)}
                    className="w-full py-2 bg-amber-100 text-amber-800 rounded-lg font-black text-[10px] uppercase border-2 border-amber-300 hover:bg-amber-200 transition"
                  >
                    🔄 Extract Drug Suggestions from AI Analysis
                  </button>
                </div>
              )}

              {/* Generate Drug Analysis */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={generateDrugAnalysis}
                  disabled={isGeneratingDrugAnalysis || !revisitData.complaints}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50 transition flex items-center justify-center"
                >
                  {isGeneratingDrugAnalysis ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8C12 4 8 4 4 8"></path>
                      </svg>
                      Generating Drug Analysis...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Generate Drug Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Suggested Drugs List */}
              {suggestedDrugs.length > 0 && (
                <div className="space-y-4">
                  <h5 className="font-black text-amber-800 text-xs uppercase tracking-wider">Suggested Medications</h5>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {suggestedDrugs.map((drug, index) => (
                      <div key={index} className="bg-white border-2 border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={drug.selected}
                            onChange={(e) => {
                              const updated = [...suggestedDrugs];
                              updated[index].selected = e.target.checked;
                              setSuggestedDrugs(updated);
                            }}
                            className="mt-1 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h6 className="font-black text-amber-900 text-sm italic">{drug.name}</h6>
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-black uppercase">
                                {drug.category}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div>
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Dose</label>
                                <input
                                  type="text"
                                  value={drug.dose}
                                  onChange={(e) => {
                                    const updated = [...suggestedDrugs];
                                    updated[index].dose = e.target.value;
                                    setSuggestedDrugs(updated);
                                  }}
                                  placeholder="e.g., 10mg"
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                                  disabled={!drug.selected}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Route</label>
                                <select
                                  value={drug.route}
                                  onChange={(e) => {
                                    const updated = [...suggestedDrugs];
                                    updated[index].route = e.target.value;
                                    setSuggestedDrugs(updated);
                                  }}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                                  disabled={!drug.selected}
                                >
                                  <option value="">Select</option>
                                  <option value="oral">Oral</option>
                                  <option value="iv">IV</option>
                                  <option value="im">IM</option>
                                  <option value="topical">Topical</option>
                                  <option value="inhaled">Inhaled</option>
                                  <option value="sublingual">Sublingual</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Frequency</label>
                                <input
                                  type="text"
                                  value={drug.frequency}
                                  onChange={(e) => {
                                    const updated = [...suggestedDrugs];
                                    updated[index].frequency = e.target.value;
                                    setSuggestedDrugs(updated);
                                  }}
                                  placeholder="e.g., daily"
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                                  disabled={!drug.selected}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Rationale</label>
                                <div className="text-xs text-slate-700 bg-amber-50 p-2 rounded">
                                  {drug.rationale}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Precautions</label>
                                <div className="text-xs text-slate-700 bg-red-50 p-2 rounded">
                                  {drug.precautions}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drug Interaction Checker consolidated into Drug Details tab */}
            </div>

            {/* Final Diagnosis Summary Box */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-purple-200">
              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-6 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Final Diagnosis Summary
              </h4>

              <div className="mb-4">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Diagnosis Method</label>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setFinalDiagnosis({ ...finalDiagnosis, type: 'manual' })}
                    className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${finalDiagnosis.type === 'manual'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Manual Diagnosis
                  </button>
                  <button
                    onClick={() => setFinalDiagnosis({ ...finalDiagnosis, type: 'ai' })}
                    className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${finalDiagnosis.type === 'ai'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    AI Diagnosis
                  </button>
                  <button
                    onClick={() => setFinalDiagnosis({ ...finalDiagnosis, type: 'logic' })}
                    className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${finalDiagnosis.type === 'logic'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Logic-Based
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Final Diagnosis</label>
                  <textarea
                    value={finalDiagnosis.diagnosis}
                    onChange={(e) => setFinalDiagnosis({ ...finalDiagnosis, diagnosis: e.target.value })}
                    placeholder="Enter final diagnosis based on clinical analysis..."
                    className="w-full border-2 border-purple-100 rounded-xl p-4 text-sm font-bold h-32 resize-none focus:border-purple-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Confidence Level</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={finalDiagnosis.confidence}
                      onChange={(e) => setFinalDiagnosis({ ...finalDiagnosis, confidence: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-purple-900 font-black text-sm w-12 text-right">{finalDiagnosis.confidence}%</span>
                  </div>
                  <div className="flex-1 bg-purple-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${finalDiagnosis.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowRevisitModal(false)} className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase border-2 border-slate-200 rounded-xl">Cancel</button>
              <button
                disabled={isSavingRevisit}
                onClick={async () => {
                  if (activePatient && revisitData.complaints && revisitData.age) {
                    setIsSavingRevisit(true);
                    try {

                      // Create new patient record for revisit (like hospital OPD)
                      const newPatientId = `${activePatient.id}-REVISIT-${Date.now()}`;

                      // Calculate drug details for revisit
                      let drugDetailsData: any | undefined = undefined;
                      try {
                        const tempPatient = { ...activePatient, ...revisitData, medications: revisitData.medications } as Patient;
                        const conditions = detectClinicalConditions(tempPatient);
                        // Logic
                        const logicAnalysis = generateTreatmentRecommendations(conditions.conditions, conditions.severity, tempPatient);

                        // Interactions Check
                        const allDrugNames = [
                          ...revisitData.medications.map(m => m.name),
                          ...logicAnalysis.medications.map(m => m.name)
                        ];
                        const uniqueDrugs = Array.from(new Set(allDrugNames.filter(n => n && n.trim())));
                        const interactions = await enhancedDrugInteractionService.checkAllInteractions(uniqueDrugs);

                        drugDetailsData = {
                          manuallyEntered: revisitData.medications,
                          logicSuggested: logicAnalysis.medications,
                          interactions: interactions.map(i => ({
                            drug1: i.drug1,
                            drug2: i.drug2,
                            severity: i.severity,
                            description: i.description,
                            recommendation: i.recommendation || 'Monitor'
                          })),
                          combinedAnalysis: `Revisit analysis generated on ${new Date().toLocaleDateString()}`
                        };
                      } catch (e) {
                        console.error("Error generating revisit drug details:", e);
                      }

                      const newPatient: Patient = {
                        id: newPatientId,
                        fullName: activePatient.fullName, // Keep original name
                        age: revisitData.age, // Use updated age
                        sex: activePatient.sex, // Keep original sex
                        height: revisitData.height || activePatient.height,
                        weight: revisitData.weight || activePatient.weight,
                        baselineVitals: revisitData.vitals,
                        baselineLabs: revisitData.labs,
                        socialHistory: revisitData.socialHistory,
                        familyHistory: activePatient.familyHistory, // Keep original
                        medicalHistory: revisitData.medicalHistory || activePatient.medicalHistory,
                        medications: revisitData.medications, // Include medications
                        complaints: revisitData.complaints,
                        otherFindings: revisitData.otherFindings,
                        status: 'Active',
                        visits: [{
                          id: `VISIT-${Date.now()}`,
                          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                          summary: revisitData.summary,
                          complaints: revisitData.complaints,
                          vitals: revisitData.vitals,
                          labResults: revisitData.labs,
                          aiReport: revisitAiReport || undefined, // Include AI report if generated
                          drugDetails: drugDetailsData // Persist Analysis
                        }],
                        consentGiven: false,
                        pin: '',
                        treatmentContext: revisitData.treatmentContext,
                        drugDetails: drugDetailsData // Persist analysis at patient level too
                      };

                      // Add new patient record
                      onAddPatient(newPatient);
                      setShowRevisitModal(false);

                      // Reset form
                      setRevisitData({
                        complaints: '',
                        vitals: { bp: '', hr: '', temp: '', spo2: '' },
                        labs: { wbc: '', platelets: '', rbc: '', creatinine: '' },
                        summary: '',
                        medicalHistory: '',
                        familyHistory: '',
                        socialHistory: { smoking: false, alcohol: false, tobacco: false },
                        height: '',
                        weight: '',
                        age: undefined,
                        medications: [],
                        otherFindings: '',
                        treatmentContext: ''
                      });
                      setRevisitAiReport(null);

                      // Show success message
                      alert(`Revisit case created successfully!\nNew Case ID: ${newPatientId}\nOriginal case ${activePatient.id} preserved.\nPatient: ${activePatient.fullName}\nAge updated: ${revisitData.age} years (was ${activePatient.age})`);
                    } finally {
                      setIsSavingRevisit(false);
                    }
                  } else {
                    alert('Please fill in current complaints and age (required fields)');
                  }
                }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50">
                {isSavingRevisit ? 'Processing Revisit...' : 'Create Revisit Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {APP_FOOTER}
    </div>
  );
};

const TabButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition ${active ? 'text-indigo-500 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{label}</button>
);

const VitalInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} className="w-full border-2 border-slate-100 rounded-lg p-2 text-xs font-bold" placeholder="--" />
  </div>
);

const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center space-x-2 text-xs font-black text-slate-700 cursor-pointer uppercase tracking-tighter">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
    <span>{label}</span>
  </label>
);

const VitalBox = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white p-4 rounded-xl border-2 border-slate-50 shadow-sm text-center">
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-base font-black text-slate-900">{value || '--'}</p>
  </div>
);
export default HCPPortal;