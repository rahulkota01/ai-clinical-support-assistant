/**
 * Enhanced Clinical Logic Engine - AI-Level Quality Analysis
 * Advanced keyword detection, clinical reasoning, and treatment recommendations
 * Designed to match AI analysis quality when AI service is unavailable
 */

import { Patient } from '../types';

// Advanced medical keyword libraries with clinical context
const MEDICAL_KEYWORDS = {
  // Cardiac conditions with severity levels
  cardiac: {
    emergency: ['chest pain', 'heart attack', 'myocardial infarction', 'cardiac arrest', 'acute coronary syndrome', 'unstable angina'],
    urgent: ['chest pressure', 'chest tightness', 'heart palpitations', 'arrhythmia', 'atrial fibrillation', 'heart failure'],
    routine: ['chest discomfort', 'heart murmur', 'valve problem', 'cardiomyopathy', 'pericarditis'],
    symptoms: ['dyspnea', 'orthopnea', 'pnd', 'edema', 'fatigue', 'syncope', 'dizziness', 'palpitations'],
    riskFactors: ['hypertension', 'diabetes', 'hyperlipidemia', 'smoking', 'obesity', 'family history', 'age', 'stress']
  },

  // Respiratory conditions
  respiratory: {
    emergency: ['severe shortness of breath', 'respiratory distress', 'anaphylaxis', 'pulmonary embolism'],
    urgent: ['difficulty breathing', 'wheezing', 'asthma attack', 'copd exacerbation', 'pneumonia'],
    routine: ['cough', 'bronchitis', 'allergies', 'sinusitis', 'asthma', 'copd'],
    symptoms: ['dyspnea', 'wheezing', 'cough', 'sputum', 'hemoptysis', 'chest pain', 'fever', 'night sweats'],
    riskFactors: ['smoking', 'allergies', 'asthma', 'copd', 'environmental exposure', 'occupational exposure']
  },

  // Neurological conditions
  neurological: {
    emergency: ['stroke', 'seizure', 'head trauma', 'meningitis', 'encephalitis', 'subarachnoid hemorrhage'],
    urgent: ['severe headache', 'confusion', 'weakness', 'numbness', 'vision changes', 'speech difficulty'],
    routine: ['headache', 'dizziness', 'memory loss', 'tremor', 'neuropathy', 'migraine'],
    symptoms: ['headache', 'dizziness', 'weakness', 'numbness', 'tingling', 'vision changes', 'speech difficulty', 'memory loss', 'confusion', 'seizure'],
    riskFactors: ['hypertension', 'diabetes', 'smoking', 'age', 'family history', 'trauma', 'migraines']
  },

  // Gastrointestinal conditions
  gastrointestinal: {
    emergency: ['severe abdominal pain', 'gastrointestinal bleeding', 'perforation', 'obstruction', 'pancreatitis'],
    urgent: ['abdominal pain', 'vomiting', 'diarrhea', 'gastroenteritis', 'gallstones', 'appendicitis'],
    routine: ['abdominal discomfort', 'indigestion', 'reflux', 'ibs', 'ulcer', 'gastritis'],
    symptoms: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'bloating', 'reflux', 'dyspepsia', 'hematemesis', 'melena'],
    riskFactors: ['nsaid use', 'alcohol', 'smoking', 'stress', 'diet', 'infection', 'medications']
  },

  // Endocrine conditions
  endocrine: {
    emergency: ['diabetic ketoacidosis', 'hyperosmolar hyperglycemic state', 'thyroid storm', 'adrenal crisis'],
    urgent: ['hypoglycemia', 'hyperglycemia', 'thyroid dysfunction', 'electrolyte imbalance'],
    routine: ['diabetes', 'thyroid disease', 'obesity', 'osteoporosis', 'adrenal insufficiency'],
    symptoms: ['polyuria', 'polydipsia', 'polyphagia', 'fatigue', 'weight changes', 'temperature intolerance', 'hair loss', 'menstrual changes'],
    riskFactors: ['family history', 'obesity', 'autoimmune disease', 'age', 'gender', 'ethnicity']
  },

  // Renal conditions
  renal: {
    emergency: ['acute kidney injury', 'renal failure', 'nephrotic syndrome', 'severe electrolyte imbalance'],
    urgent: ['kidney stones', 'uti', 'pyelonephritis', 'glomerulonephritis'],
    routine: ['ckd', 'proteinuria', 'hematuria', 'electrolyte imbalance', 'hypertension'],
    symptoms: ['flank pain', 'dysuria', 'hematuria', 'proteinuria', 'edema', 'fatigue', 'nausea', 'vomiting', 'changes in urine output'],
    riskFactors: ['diabetes', 'hypertension', 'nsaid use', 'dehydration', 'family history', 'age']
  }
};

// Vital sign interpretation thresholds
const VITAL_THRESHOLDS = {
  bloodPressure: {
    normal: { systolic: [90, 120], diastolic: [60, 80] },
    elevated: { systolic: [120, 129], diastolic: [60, 80] },
    stage1: { systolic: [130, 139], diastolic: [80, 89] },
    stage2: { systolic: [140, 180], diastolic: [90, 120] },
    crisis: { systolic: [180, 250], diastolic: [120, 150] }
  },
  heartRate: {
    bradycardia: [40, 59],
    normal: [60, 100],
    tachycardia: [101, 150],
    severe: [151, 200]
  },
  temperature: {
    hypothermia: [35.0, 36.0],
    normal: [36.1, 37.2],
    lowGrade: [37.3, 38.0],
    moderate: [38.1, 39.0],
    high: [39.1, 41.0],
    severe: [41.1, 43.0]
  },
  oxygenSaturation: {
    severe: [85, 89],
    moderate: [90, 93],
    mild: [94, 95],
    normal: [96, 100]
  }
};

// Laboratory value interpretation
const LAB_THRESHOLDS = {
  wbc: {
    low: [0.1, 4.0],
    normal: [4.1, 11.0],
    high: [11.1, 50.0],
    severe: [50.1, 100.0]
  },
  hemoglobin: {
    low: [6.0, 11.9],
    normal: [12.0, 15.5],
    high: [15.6, 18.0],
    severe: [18.1, 20.0]
  },
  platelets: {
    low: [20, 149],
    normal: [150, 450],
    high: [451, 700],
    severe: [701, 1000]
  },
  creatinine: {
    normal: [0.6, 1.2],
    mild: [1.3, 1.9],
    moderate: [2.0, 3.0],
    severe: [3.1, 10.0]
  },
  glucose: {
    low: [20, 69],
    normal: [70, 99],
    prediabetes: [100, 125],
    diabetes: [126, 400],
    severe: [401, 1000]
  }
};

// Enhanced clinical condition detection
function detectClinicalConditions(patient: Patient): {
  conditions: string[];
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  confidence: number;
  reasoning: string[];
} {
  const conditions: string[] = [];
  const reasoning: string[] = [];
  let severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical' = 'normal';
  let urgency: 'routine' | 'urgent' | 'emergency' = 'routine';
  let confidence = 0;

  const allText = [
    patient.complaints,
    patient.medicalHistory,
    patient.familyHistory,
    patient.otherFindings,
    ...(patient.medications || []).map(m => m.name)
  ].join(' ').toLowerCase();

  // Analyze each system - ONLY assign organ-system involvement with SPECIFIC evidence
  Object.entries(MEDICAL_KEYWORDS).forEach(([system, keywords]) => {
    // Check emergency conditions first - require clear evidence
    keywords.emergency.forEach(keyword => {
      if (allText.includes(keyword)) {
        conditions.push(`${system}_emergency`);
        reasoning.push(`Emergency ${system} condition detected: ${keyword}`);
        severity = 'critical';
        urgency = 'emergency';
        confidence += 30;
      }
    });

    // Check urgent conditions - require clear evidence
    keywords.urgent.forEach(keyword => {
      if (allText.includes(keyword)) {
        conditions.push(`${system}_urgent`);
        reasoning.push(`Urgent ${system} condition detected: ${keyword}`);
        if (severity !== 'critical') {
          severity = 'severe';
          urgency = 'urgent';
        }
        confidence += 20;
      }
    });

    // Check routine conditions - require clear evidence
    keywords.routine.forEach(keyword => {
      if (allText.includes(keyword)) {
        conditions.push(`${system}_routine`);
        reasoning.push(`${system} condition detected: ${keyword}`);
        if (severity === 'normal') {
          severity = 'mild';
        }
        confidence += 10;
      }
    });

    // CRITICAL FIX: DO NOT assign organ-system involvement unless SPECIFICALLY supported by evidence
    // Dizziness alone = NON-SPECIFIC, Fever alone = SYSTEMIC not respiratory
    // Only assign system-specific symptoms when they are truly indicative
    keywords.symptoms.forEach(symptom => {
      if (allText.includes(symptom)) {
        // Cardiac: Only chest pain, pressure, tightness, palpitations with cardiac context
        if (system === 'cardiac' && ['chest pain', 'chest pressure', 'chest tightness'].includes(symptom)) {
          conditions.push(`${system}_symptom`);
          reasoning.push(`Cardiac symptom: ${symptom}`);
          confidence += 5;
        }
        // Respiratory: Only breathing difficulties, wheezing, hemoptysis
        else if (system === 'respiratory' && ['shortness of breath', 'difficulty breathing', 'wheezing', 'hemoptysis'].includes(symptom)) {
          conditions.push(`${system}_symptom`);
          reasoning.push(`Respiratory symptom: ${symptom}`);
          confidence += 5;
        }
        // Neurological: Only severe/focal neurological symptoms
        else if (system === 'neurological' && ['severe headache', 'vision changes', 'speech difficulty', 'weakness', 'numbness', 'confusion'].includes(symptom)) {
          conditions.push(`${system}_symptom`);
          reasoning.push(`Neurological symptom: ${symptom}`);
          confidence += 5;
        }
        // DO NOT assign dizziness, fatigue, or fever to any specific organ system
      }
    });
  });

  // Analyze vital signs
  const vitalAnalysis = analyzeVitalSigns(patient.baselineVitals);
  conditions.push(...vitalAnalysis.conditions);
  reasoning.push(...vitalAnalysis.reasoning);
  if (vitalAnalysis.severity !== 'normal') {
    severity = vitalAnalysis.severity;
    urgency = vitalAnalysis.urgency;
  }
  confidence += vitalAnalysis.confidence;

  // Analyze laboratory values
  const labAnalysis = analyzeLabValues(patient.baselineLabs || {});
  conditions.push(...labAnalysis.conditions);
  reasoning.push(...labAnalysis.reasoning);
  if (labAnalysis.severity !== 'normal') {
    severity = Math.max(severity === 'critical' ? 4 : severity === 'severe' ? 3 : severity === 'moderate' ? 2 : 1,
      labAnalysis.severity === 'critical' ? 4 : labAnalysis.severity === 'severe' ? 3 : labAnalysis.severity === 'moderate' ? 2 : 1) === 4 ? 'critical' :
      Math.max(severity === 'severe' ? 3 : severity === 'moderate' ? 2 : 1,
        labAnalysis.severity === 'severe' ? 3 : labAnalysis.severity === 'moderate' ? 2 : 1) === 3 ? 'severe' :
        Math.max(severity === 'moderate' ? 2 : 1, labAnalysis.severity === 'moderate' ? 2 : 1) === 2 ? 'moderate' : 'mild';
  }
  confidence += labAnalysis.confidence;

  // Calculate multi-system involvement - ONLY if clinically significant
  const primarySystems = new Set(conditions.map(c => c.split('_')[0]));
  const significantSystems = Array.from(primarySystems).filter(system =>
    conditions.some(c => c.includes(system) && (c.includes('emergency') || c.includes('urgent') || c.includes('symptom')))
  );
  if (significantSystems.length >= 2) {
    confidence += 10;
    reasoning.push(`Multiple system involvement: ${significantSystems.join(', ')}`);
  }

  // Calculate vital sign correlation - ONLY if clinically meaningful
  if (conditions.some(c => c.includes('cardiac') && c.includes('symptom')) &&
    (conditions.some(c => c.includes('hypertension')) || conditions.some(c => c.includes('tachycardia')))) {
    confidence += 10;
    reasoning.push('Cardiac symptoms supported by vital sign abnormalities');
  }

  // Base confidence boost for comprehensive data
  if (patient.baselineVitals.bp && patient.baselineVitals.hr && patient.baselineVitals.spo2) {
    confidence += 10;
  }

  // Cap confidence at 98% (leave room for uncertainty)
  confidence = Math.min(Math.round(confidence * 1.2), 98);

  return {
    conditions: [...new Set(conditions)], // Remove duplicates
    severity,
    urgency,
    confidence,
    reasoning
  };
}

// Enhanced vital sign analysis
function analyzeVitalSigns(vitals: any): {
  conditions: string[];
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  confidence: number;
  reasoning: string[];
} {
  const conditions: string[] = [];
  const reasoning: string[] = [];
  let severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical' = 'normal';
  let urgency: 'routine' | 'urgent' | 'emergency' = 'routine';
  let confidence = 0;

  // Blood pressure analysis (ACC/AHA 2017 Guidelines)
  if (vitals.bp) {
    const bpMatch = vitals.bp.match(/(\d+)\/(\d+)/);
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      const diastolic = parseInt(bpMatch[2]);

      if (systolic >= 180 || diastolic >= 120) {
        conditions.push('hypertensive_crisis');
        reasoning.push(`Hypertensive Crisis: BP ${systolic}/${diastolic} requires immediate emergency intervention.`);
        severity = 'critical';
        urgency = 'emergency';
        confidence += 30;
      } else if (systolic >= 140 || diastolic >= 90) {
        conditions.push('stage2_hypertension');
        reasoning.push(`Stage 2 Hypertension: BP ${systolic}/${diastolic}. Target goal is usually <130/80.`);
        severity = 'moderate';
        urgency = 'urgent';
        confidence += 20;
      } else if (systolic >= 130 && systolic < 140 || (diastolic >= 80 && diastolic < 90)) {
        conditions.push('stage1_hypertension');
        reasoning.push(`Stage 1 Hypertension: BP ${systolic}/${diastolic}. Monitoring and lifestyle modifications recommended.`);
        severity = 'mild';
        confidence += 15;
      } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
        conditions.push('elevated_bp');
        reasoning.push(`Elevated Blood Pressure: ${systolic}/${diastolic}. Risk of progressing to hypertension.`);
        severity = 'mild';
        confidence += 10;
      } else if (systolic < 120 && diastolic < 80) {
        reasoning.push(`Normal Blood Pressure: ${systolic}/${diastolic}.`);
        confidence += 5;
      }
    }
  }

  // Heart rate analysis
  if (vitals.hr) {
    const hr = parseInt(vitals.hr);
    if (hr < 40) {
      conditions.push('severe_bradycardia');
      reasoning.push(`🚨 CRITICAL BRADYCARDIA: HR ${hr} bpm is dangerously low.`);
      severity = 'critical';
      urgency = 'emergency';
      confidence += 25;
    } else if (hr < 60) {
      conditions.push('bradycardia');
      reasoning.push(`Bradycardia: HR ${hr} bpm.`);
      severity = 'mild';
      confidence += 10;
    } else if (hr > 150) {
      conditions.push('severe_tachycardia');
      reasoning.push(`🚨 CRITICAL TACHYCARDIA: HR ${hr} bpm is dangerously high.`);
      severity = 'critical';
      urgency = 'emergency';
      confidence += 25;
    } else if (hr > 100) {
      conditions.push('tachycardia');
      reasoning.push(`Tachycardia: HR ${hr} bpm.`);
      severity = 'mild';
      confidence += 10;
    } else {
      reasoning.push(`Normal Heart Rate: ${hr} bpm.`);
    }
  }

  // Oxygen saturation analysis
  if (vitals.spo2) {
    const spo2 = parseInt(vitals.spo2);
    if (spo2 < 90) {
      conditions.push('severe_hypoxemia');
      reasoning.push(`Severe hypoxemia: SpO2 ${spo2}%`);
      severity = 'critical';
      urgency = 'emergency';
      confidence += 30;
    } else if (spo2 < 94) {
      conditions.push('mild_hypoxemia');
      reasoning.push(`Mild hypoxemia: SpO2 ${spo2}%`);
      severity = 'moderate';
      urgency = 'urgent';
      confidence += 15;
    }
  }

  // Temperature analysis (Assuming Fahrenheit with Celsius detection)
  if (vitals.temp) {
    let temp = parseFloat(vitals.temp);
    const unit = vitals.temp.toLowerCase().includes('c') ? 'C' : 'F';

    // Convert to F for internal logic if C is detected
    if (unit === 'C') {
      temp = (temp * 9 / 5) + 32;
    }

    if (temp > 102.2) {
      conditions.push('high_fever');
      reasoning.push(`High Fever: ${temp.toFixed(1)}°F (${((temp - 32) * 5 / 9).toFixed(1)}°C). Immediate cooling and clinical assessment required.`);
      severity = 'moderate';
      urgency = 'urgent';
      confidence += 20;
    } else if (temp > 100.4) {
      conditions.push('fever');
      reasoning.push(`Fever: ${temp.toFixed(1)}°F (${((temp - 32) * 5 / 9).toFixed(1)}°C). Monitor for source of infection.`);
      severity = 'mild';
      confidence += 15;
    } else if (temp < 95.0) {
      conditions.push('hypothermia');
      reasoning.push(`🚨 HYPOTHERMIA: ${temp.toFixed(1)}°F (${((temp - 32) * 5 / 9).toFixed(1)}°C). Medical emergency requiring active rewarming.`);
      severity = 'critical';
      urgency = 'emergency';
      confidence += 25;
    } else {
      reasoning.push(`Normal Temperature: ${temp.toFixed(1)}°F.`);
    }
  }

  return { conditions, severity, urgency, confidence, reasoning };
}

// Enhanced laboratory analysis
function analyzeLabValues(labs: any): {
  conditions: string[];
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  confidence: number;
  reasoning: string[];
} {
  const conditions: string[] = [];
  const reasoning: string[] = [];
  let severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical' = 'normal';
  let urgency: 'routine' | 'urgent' | 'emergency' = 'routine';
  let confidence = 0;

  // WBC analysis
  if (labs.wbc) {
    const wbc = parseFloat(labs.wbc);
    if (wbc > 20) {
      conditions.push('severe_leukocytosis');
      reasoning.push(`Severe leukocytosis: WBC ${wbc} K/μL`);
      severity = 'severe';
      urgency = 'urgent';
      confidence += 20;
    } else if (wbc > 11) {
      conditions.push('leukocytosis');
      reasoning.push(`Leukocytosis: WBC ${wbc} K/μL`);
      severity = 'mild';
      confidence += 10;
    } else if (wbc < 4) {
      conditions.push('leukopenia');
      reasoning.push(`Leukopenia: WBC ${wbc} K/μL`);
      severity = 'mild';
      confidence += 10;
    }
  }

  // Hemoglobin analysis
  if (labs.hemoglobin) {
    const hgb = parseFloat(labs.hemoglobin);
    if (hgb < 8) {
      conditions.push('severe_anemia');
      reasoning.push(`Severe anemia: Hgb ${hgb} g/dL`);
      severity = 'severe';
      urgency = 'urgent';
      confidence += 20;
    } else if (hgb < 12) {
      conditions.push('anemia');
      reasoning.push(`Anemia: Hgb ${hgb} g/dL`);
      severity = 'mild';
      confidence += 10;
    }
  }

  // Platelets analysis
  if (labs.platelets) {
    const platelets = parseFloat(labs.platelets);
    if (platelets < 50) {
      conditions.push('severe_thrombocytopenia');
      reasoning.push(`Severe thrombocytopenia: Platelets ${platelets} K/μL`);
      severity = 'severe';
      urgency = 'urgent';
      confidence += 20;
    } else if (platelets < 150) {
      conditions.push('thrombocytopenia');
      reasoning.push(`Thrombocytopenia: Platelets ${platelets} K/μL`);
      severity = 'mild';
      confidence += 10;
    }
  }

  // Creatinine analysis
  if (labs.creatinine) {
    const creatinine = parseFloat(labs.creatinine);
    if (creatinine > 3.0) {
      conditions.push('severe_renal_impairment');
      reasoning.push(`Severe renal impairment: Creatinine ${creatinine} mg/dL`);
      severity = 'severe';
      urgency = 'urgent';
      confidence += 20;
    } else if (creatinine > 1.3) {
      conditions.push('renal_impairment');
      reasoning.push(`Renal impairment: Creatinine ${creatinine} mg/dL`);
      severity = 'mild';
      confidence += 10;
    }
  }

  return { conditions, severity, urgency, confidence, reasoning };
}

// Enhanced treatment recommendation engine
function generateTreatmentRecommendations(conditions: string[], severity: string, patient: Patient): {
  recommendations: string[];
  medications: Array<{
    name: string;
    category: string;
    dose: string;
    route: string;
    frequency: string;
    rationale: string;
    precautions: string;
    alternatives: string[];
  }>;
  monitoring: string[];
  followUp: string;
} {
  const recommendations: string[] = [];
  const medications: any[] = [];
  const monitoring: string[] = [];
  let followUp = 'Routine follow-up in 3-6 months';

  // Cardiac conditions
  if (conditions.some(c => c.includes('cardiac'))) {
    if (conditions.some(c => c.includes('emergency'))) {
      recommendations.push('🚨 IMMEDIATE CARDIAC EVALUATION REQUIRED');
      recommendations.push('Activate cardiac catheterization lab if STEMI suspected');
      recommendations.push('Administer aspirin 325mg chewable if no contraindications');
      recommendations.push('Obtain 12-lead ECG immediately');
      recommendations.push('Draw cardiac enzymes (troponin, CK-MB)');
      recommendations.push('Establish IV access and cardiac monitoring');

      medications.push({
        name: 'Aspirin',
        category: 'Antiplatelet',
        dose: '325mg',
        route: 'PO',
        frequency: 'Once',
        rationale: 'Immediate antiplatelet therapy for suspected ACS',
        precautions: 'Contraindicated in active bleeding, aspirin allergy, or recent GI bleed',
        alternatives: ['Clopidogrel 75mg', 'Ticagrelor 180mg loading dose']
      });

      medications.push({
        name: 'Nitroglycerin',
        category: 'Vasodilator',
        dose: '0.4mg',
        route: 'SL',
        frequency: 'Every 5 minutes x3 doses',
        rationale: 'Relieves ischemic chest pain through coronary vasodilation',
        precautions: 'Avoid in hypotension (SBP <90), right ventricular infarct, or recent PDE5 inhibitor use',
        alternatives: ['Morphine sulfate 2-4mg IV', 'Beta-blocker if no contraindications']
      });

      monitoring.push('Continuous cardiac monitoring');
      monitoring.push('Serial ECGs every 15-30 minutes');
      monitoring.push('Cardiac enzymes every 3-6 hours');
      monitoring.push('Blood pressure every 5 minutes initially');
      monitoring.push('Pain assessment every 15 minutes');

      followUp = 'Urgent cardiology consultation within 30 minutes. Consider ICU admission for hemodynamic monitoring.';
    }
  }

  // Respiratory conditions
  if (conditions.some(c => c.includes('respiratory'))) {
    if (conditions.some(c => c.includes('emergency'))) {
      recommendations.push('🚨 IMMEDIATE RESPIRATORY SUPPORT REQUIRED');
      recommendations.push('Assess airway, breathing, circulation (ABCs)');
      recommendations.push('Provide supplemental oxygen to maintain SpO2 ≥94%');
      recommendations.push('Consider mechanical ventilation if respiratory failure');
      recommendations.push('Obtain chest X-ray and arterial blood gas');

      medications.push({
        name: 'Albuterol',
        category: 'Bronchodilator',
        dose: '2.5mg',
        route: 'Nebulized',
        frequency: 'Every 20 minutes x3 doses',
        rationale: 'Rapid bronchodilation for acute bronchospasm',
        precautions: 'Monitor for tachycardia and tremor. Use with caution in cardiac disease',
        alternatives: ['Levalbuterol 1.25mg nebulized', 'Ipratropium bromide 0.5mg nebulized']
      });

      monitoring.push('Continuous pulse oximetry');
      monitoring.push('Respiratory rate and effort every 15 minutes');
      monitoring.push('Peak flow measurements if able');
      monitoring.push('Blood pressure and heart rate monitoring');

      followUp = 'Urgent pulmonology consultation if no improvement. Consider ICU admission for severe respiratory distress.';
    }
  }

  // Hypertension management
  if (conditions.some(c => c.includes('hypertension'))) {
    if (conditions.some(c => c.includes('crisis'))) {
      recommendations.push('🚨 HYPERTENSIVE CRISIS - EMERGENCY TREATMENT');
      recommendations.push('Admit to ICU for continuous BP monitoring');
      recommendations.push('IV antihypertensive therapy (nicardipine, labetalol, or clevidipine)');
      recommendations.push('Target BP reduction: 25% in first hour, then 160/100-110 over next 2-6 hours');
      recommendations.push('Assess for end-organ damage (cardiac, renal, neurological)');

      medications.push({
        name: 'Nicardipine',
        category: 'Calcium Channel Blocker',
        dose: '5mg/hr',
        route: 'IV infusion',
        frequency: 'Continuous titration',
        rationale: 'Rapid, controllable BP reduction with minimal reflex tachycardia',
        precautions: 'Monitor for reflex tachycardia, headache, and hypotension. Avoid in severe aortic stenosis',
        alternatives: ['Labetalol 20mg IV bolus then 2-8mg/min infusion', 'Clevidipine 1-2mg/hr infusion']
      });

      monitoring.push('Arterial line for continuous BP monitoring');
      monitoring.push('Cardiac monitoring for arrhythmias');
      monitoring.push('Neurological checks every hour');
      monitoring.push('Renal function and urine output monitoring');

      followUp = 'ICU admission for 24-48 hours. Transition to oral antihypertensives when stable.';
    } else if (conditions.some(c => c.includes('stage2'))) {
      recommendations.push('Stage 2 Hypertension - Initiate combination therapy');
      recommendations.push('Lifestyle modifications: DASH diet, sodium restriction <2g/day');
      recommendations.push('Exercise 150 minutes/week moderate intensity');
      if (patient.weight && parseInt(patient.weight) > 85) recommendations.push('Weight loss if BMI >25');
      if (patient.socialHistory.alcohol) recommendations.push('Limit alcohol to ≤1 drink/day (women) or ≤2 drinks/day (men)');
      if (patient.socialHistory.smoking) recommendations.push('Smoking cessation strongly advised');

      medications.push({
        name: 'Lisinopril',
        category: 'ACE Inhibitor',
        dose: '10mg',
        route: 'PO',
        frequency: 'Once daily',
        rationale: 'First-line antihypertensive with renal and cardiac protective effects (primary choice)',
        precautions: 'Monitor for cough, hyperkalemia, and renal function. Avoid in pregnancy',
        alternatives: ['Losartan 50mg daily', 'Telmisartan 40mg daily']
      });

      medications.push({
        name: 'Amlodipine',
        category: 'Calcium Channel Blocker',
        dose: '5mg',
        route: 'PO',
        frequency: 'Once daily',
        rationale: 'Effective BP lowering via vasodilation (secondary choice for combination therapy)',
        precautions: 'Monitor for peripheral edema. Use with caution in heart failure',
        alternatives: ['Nifedipine XL 30mg daily', 'Felodipine 5mg daily']
      });

      medications.push({
        name: 'Chlorthalidone',
        category: 'Thiazide Diuretic',
        dose: '12.5mg',
        route: 'PO',
        frequency: 'Daily',
        rationale: 'Potent diuretic for long-term BP control (adjunctive choice)',
        precautions: 'Monitor for hypokalemia and hyperuricemia',
        alternatives: ['Hydrochlorothiazide 25mg daily']
      });

      monitoring.push('Blood pressure monitoring weekly until at target');
      monitoring.push('Renal function and electrolytes in 2-4 weeks');
      monitoring.push('Check for medication side effects at each visit');
      followUp = 'Follow-up in 2 weeks to assess BP response and medication tolerance.';
    }
  }

  // Infection / Fever Management (Cause-Specific)
  if (conditions.some(c => c.includes('fever') || c.includes('leukocytosis')) || patient.complaints.toLowerCase().includes('infection')) {
    recommendations.push('Suspected infection profile - Initiate antimicrobial/antipyretic protocol');

    medications.push({
      name: 'Amoxicillin-Clavulanate',
      category: 'Antibiotic (Penicillin)',
      dose: '875/125mg',
      route: 'PO',
      frequency: 'Twice daily',
      rationale: 'Broad-spectrum coverage for suspected bacterial infection (Primary choice)',
      precautions: 'Check for penicillin allergy. Take with food to reduce GI upset.',
      alternatives: ['Azithromycin 500mg daily', 'Cefdinir 300mg BID']
    });

    medications.push({
      name: 'Doxycycline',
      category: 'Antibiotic (Tetracycline)',
      dose: '100mg',
      route: 'PO',
      frequency: 'Twice daily',
      rationale: 'Effective coverage for respiratory and atypical pathogens (Secondary choice)',
      precautions: 'Avoid in pregnancy/children. Photosensitivity risk. Separate from antacids.',
      alternatives: ['Levofloxacin 500mg daily']
    });

    monitoring.push('Temperature tracking twice daily');
    monitoring.push('Monitor for worsening symptoms or allergic reaction');
    monitoring.push('Complete full course even if feeling better');
    if (!followUp.includes('weeks')) followUp = 'Follow-up in 48-72 hours if no improvement in symptoms.';
  }

  // Pain Management (Cause-Specific)
  const isPainful = patient.complaints.toLowerCase().includes('pain') ||
    patient.complaints.toLowerCase().includes('ache') ||
    patient.complaints.toLowerCase().includes('hurt');

  if (isPainful || conditions.some(c => c.includes('fever'))) {
    medications.push({
      name: 'Acetaminophen',
      category: 'Analgesic',
      dose: '500mg',
      route: 'PO',
      frequency: 'Every 6 hours as needed',
      rationale: 'First-line for mild to moderate pain and fever. Less GI side effects than NSAIDs.',
      precautions: 'Do not exceed 4000mg/day. Use with caution in liver impairment.',
      alternatives: ['Ibuprofen 200-400mg every 6 hours as needed']
    });

    medications.push({
      name: 'Ibuprofen',
      category: 'NSAID',
      dose: '400mg',
      route: 'PO',
      frequency: 'Every 6 hours as needed',
      rationale: 'Effective for mild to moderate pain and inflammation. Inhibits prostaglandin synthesis.',
      precautions: 'Take with food to reduce GI upset. Use with caution in renal impairment, heart failure, or history of GI bleed.',
      alternatives: ['Naproxen 220-440mg every 12 hours as needed']
    });
  }

  // Neurological conditions (dizziness, weakness, etc.)
  if (conditions.some(c => c.includes('neurological'))) {
    recommendations.push('Neurological evaluation recommended');
    recommendations.push('Assess for orthostatic hypotension');
    recommendations.push('Check vitamin B12, folate, and thyroid function');

    // If dizziness with low BP or dehydration
    if (patient.baselineVitals.bp && parseInt(patient.baselineVitals.bp.split('/')[0]) < 110) {
      recommendations.push('Increase fluid and salt intake');
      recommendations.push('Avoid sudden position changes');
    }

    monitoring.push('Blood pressure monitoring in different positions');
    monitoring.push('Neurological assessment for focal deficits');
    followUp = 'Neurology consultation if symptoms persist or worsen';
  }

  // Respiratory symptoms (breathing issues, hypoxemia)
  if (conditions.some(c => c.includes('respiratory') || c.includes('hypoxemia'))) {
    if (conditions.some(c => c.includes('mild_hypoxemia'))) {
      recommendations.push('Respiratory evaluation for chronic hypoxemia');
      recommendations.push('Supplemental oxygen if SpO2 <94%');
      recommendations.push('Pulmonary function testing');
      recommendations.push('Chest X-ray to rule out structural abnormalities');

      medications.push({
        name: 'Albuterol Inhaler',
        category: 'Bronchodilator',
        dose: '90mcg (2 puffs)',
        route: 'Inhaled',
        frequency: 'Every 4-6 hours as needed',
        rationale: 'Provides bronchodilation for breathing difficulties and improves oxygen delivery',
        precautions: 'Monitor for tachycardia, tremor, and palpitations. Use with caution in cardiac disease',
        alternatives: ['Levalbuterol inhaler', 'Ipratropium bromide inhaler']
      });

      monitoring.push('Pulse oximetry monitoring');
      monitoring.push('Respiratory rate and effort assessment');
      monitoring.push('Peak flow measurements if asthma suspected');
      followUp = 'Pulmonology consultation for persistent hypoxemia';
    }
  }

  // Stage 1 Hypertension (mild elevation)
  if (conditions.some(c => c.includes('stage1_hypertension'))) {
    recommendations.push('Lifestyle modifications for blood pressure control');
    recommendations.push('DASH diet with sodium restriction <2g/day');
    recommendations.push('Regular aerobic exercise 150 minutes/week');
    if (patient.weight && parseInt(patient.weight) > 85) recommendations.push('Weight loss if BMI >25');
    if (patient.socialHistory.alcohol) recommendations.push('Limit alcohol consumption');
    if (patient.socialHistory.smoking) recommendations.push('Smoking cessation strongly advised');
    recommendations.push('Stress reduction techniques');

    // Consider medication if additional risk factors present
    const hasRiskFactors = patient.age > 40 ||
      patient.socialHistory.smoking ||
      patient.medicalHistory.toLowerCase().includes('diabetes') ||
      patient.medicalHistory.toLowerCase().includes('heart');

    if (hasRiskFactors) {
      medications.push({
        name: 'Lisinopril',
        category: 'ACE Inhibitor',
        dose: '5-10mg',
        route: 'PO',
        frequency: 'Once daily',
        rationale: 'First-line antihypertensive for Stage 1 hypertension with cardiovascular risk factors. Provides renal and cardiac protection',
        precautions: 'Monitor for dry cough (10% incidence), hyperkalemia, and renal function. Contraindicated in pregnancy and bilateral renal artery stenosis. Check K+ and creatinine in 2-4 weeks',
        alternatives: ['Losartan 25-50mg daily (ARB, no cough)', 'Amlodipine 2.5-5mg daily (CCB)', 'Hydrochlorothiazide 12.5mg daily (thiazide diuretic)']
      });
    }

    monitoring.push('Home blood pressure monitoring twice daily');
    monitoring.push('Renal function and electrolytes in 2-4 weeks if medication started');
    monitoring.push('Lipid panel and fasting glucose');
    followUp = 'Follow-up in 4 weeks to reassess BP and medication tolerance';
  }

  // Anemia management (Patient-Specific)
  if (conditions.some(c => c.includes('anemia'))) {
    recommendations.push('Evaluate cause of anemia (iron studies, B12, folate)');
    recommendations.push('Assess for occult GI bleeding if iron deficiency');

    if (patient.sex.toLowerCase() === 'female' && patient.age < 50) {
      recommendations.push('Counseling on iron-rich diet (spinach, red meat, lentils) for menstrual-related losses');
    } else {
      recommendations.push('Dietary counseling for iron-rich foods');
    }

    medications.push({
      name: 'Ferrous Sulfate',
      category: 'Iron Supplement',
      dose: '325mg (65mg elemental iron)',
      route: 'PO',
      frequency: 'Once daily',
      rationale: `Treats iron deficiency anemia. ${patient.sex.toLowerCase() === 'female' && patient.age < 50 ? 'Recommended for reproductive age females with iron stores depletion.' : 'Replenishes iron stores for hemoglobin synthesis.'}`,
      precautions: 'Take on empty stomach for best absorption (with vitamin C if tolerated). Common side effects: constipation, dark stools, nausea. Separate from calcium, antacids, and PPIs by 2 hours. May take 3-6 months to replenish stores',
      alternatives: ['Ferrous gluconate 325mg daily (better tolerated)', 'Polysaccharide iron complex 150mg daily (less GI upset)', 'IV iron if severe or intolerant to oral']
    });

    monitoring.push('CBC with reticulocyte count in 4 weeks');
    monitoring.push('Iron studies (ferritin, TIBC, transferrin saturation)');
    monitoring.push('Assess for GI side effects');
    followUp = 'Hematology consultation if anemia persists despite treatment';
  }

  // Weakness and fatigue management (Patient-Specific)
  if (patient.complaints.toLowerCase().includes('weak') || patient.complaints.toLowerCase().includes('fatigue')) {
    recommendations.push('Comprehensive metabolic workup for weakness/fatigue');
    recommendations.push('Check thyroid function (TSH, Free T4)');
    recommendations.push('Vitamin D, B12, and folate levels');

    if (patient.sex.toLowerCase() === 'female' && patient.age >= 18 && patient.age <= 45) {
      recommendations.push('Consider prenatal vitamin if pregnancy is possible');
    }

    medications.push({
      name: patient.sex.toLowerCase() === 'female' && patient.age >= 18 && patient.age <= 45 ? 'Prenatal Multivitamin' : 'Vitamin D3 (Cholecalciferol)',
      category: 'Vitamin Supplement',
      dose: patient.sex.toLowerCase() === 'female' && patient.age >= 18 && patient.age <= 45 ? '1 tablet' : '2000 IU',
      route: 'PO',
      frequency: 'Once daily',
      rationale: 'Addresses nutritional deficiencies that commonly manifest as weakness and fatigue.',
      precautions: 'Generally well tolerated. Check serum levels before high-dose supplementation. Take with food for better absorption',
      alternatives: ['Vitamin B Complex', 'Multivitamin with Minerals']
    });

    medications.push({
      name: 'Vitamin B Complex',
      category: 'Vitamin Supplement',
      dose: '1 tablet',
      route: 'PO',
      frequency: 'Once daily',
      rationale: 'B vitamins (especially B12, B6, folate) are essential for energy production and neurological function. Deficiency causes fatigue and weakness',
      precautions: 'Generally safe. May cause bright yellow urine (riboflavin). Take with food to reduce nausea',
      alternatives: ['Vitamin B12 1000mcg sublingual daily', 'Methylcobalamin 1000mcg daily']
    });

    monitoring.push('Thyroid function tests');
    monitoring.push('Vitamin D and B12 levels');
    monitoring.push('Energy level and symptom diary');
    followUp = 'Follow-up in 6-8 weeks to reassess symptoms and lab results';
  }

  // Itching/Allergic symptoms
  if (patient.complaints.toLowerCase().includes('itch') || patient.complaints.toLowerCase().includes('rash') || patient.complaints.toLowerCase().includes('allerg')) {
    recommendations.push('Identify and avoid potential allergens');
    recommendations.push('Use fragrance-free, hypoallergenic products');
    recommendations.push('Keep skin moisturized');
    recommendations.push('Avoid hot showers and harsh soaps');

    medications.push({
      name: 'Cetirizine (Zyrtec)',
      category: 'Antihistamine (2nd generation)',
      dose: '10mg',
      route: 'PO',
      frequency: 'Once daily',
      rationale: 'Non-sedating antihistamine for allergic symptoms and itching. Blocks histamine H1 receptors to reduce allergic response',
      precautions: 'May cause mild drowsiness in some patients. Avoid alcohol. Reduce dose in renal impairment (CrCl <30: 5mg daily)',
      alternatives: ['Loratadine 10mg daily (less sedating)', 'Fexofenadine 180mg daily (no sedation)', 'Levocetirizine 5mg daily (more potent)']
    });

    medications.push({
      name: 'Hydrocortisone Cream 1%',
      category: 'Topical Corticosteroid',
      dose: 'Thin layer',
      route: 'Topical',
      frequency: 'Twice daily to affected areas',
      rationale: 'Reduces inflammation and itching from allergic skin reactions, eczema, or dermatitis',
      precautions: 'Do not use on face or broken skin without medical advice. Limit use to 2 weeks unless directed. Do not cover with occlusive dressing',
      alternatives: ['Triamcinolone 0.1% cream (stronger)', 'Calamine lotion (non-steroid option)', 'Colloidal oatmeal baths']
    });

    monitoring.push('Skin condition assessment');
    monitoring.push('Identify triggers and patterns');
    monitoring.push('Response to antihistamine therapy');
    followUp = 'Dermatology or Allergy consultation if symptoms persist despite treatment';
  }

  // Anxiety/Stress-related symptoms
  if (patient.complaints.toLowerCase().includes('stress') || patient.complaints.toLowerCase().includes('anxious') || patient.complaints.toLowerCase().includes('panic')) {
    recommendations.push('Stress management and relaxation techniques');
    recommendations.push('Cognitive behavioral therapy (CBT)');
    recommendations.push('Regular exercise and adequate sleep');
    recommendations.push('Mindfulness and meditation practices');
    recommendations.push('Avoid caffeine and stimulants');

    // Note: User is already on Escitalopram, so acknowledge this
    if (patient.medications.some(m => m.name.toLowerCase().includes('escitalopram') || m.name.toLowerCase().includes('ssri'))) {
      recommendations.push('Continue current SSRI therapy (Escitalopram)');
      recommendations.push('Assess medication effectiveness and side effects');
      recommendations.push('Consider dose adjustment if symptoms not controlled');

      monitoring.push('Monitor for SSRI side effects (nausea, insomnia, sexual dysfunction)');
      monitoring.push('Assess mood and anxiety levels');
      monitoring.push('Screen for suicidal ideation');
      followUp = 'Psychiatry follow-up for medication management and therapy';
    }
  }

  // General supportive care if no specific medications added
  if (medications.length === 0) {
    recommendations.push('Supportive care and symptom management');
    recommendations.push('Adequate hydration (8-10 glasses water daily)');
    recommendations.push('Balanced nutrition with fruits and vegetables');
    recommendations.push('Regular sleep schedule (7-9 hours nightly)');
    recommendations.push('Moderate exercise as tolerated');

    medications.push({
      name: 'Multivitamin',
      category: 'Nutritional Supplement',
      dose: '1 tablet',
      route: 'PO',
      frequency: 'Once daily with food',
      rationale: 'Provides comprehensive nutritional support and fills potential dietary gaps. Supports overall health and energy levels',
      precautions: 'Generally safe. Take with food to improve absorption and reduce nausea. Avoid taking with dairy products (may reduce iron absorption)',
      alternatives: ['Individual vitamin supplements based on deficiencies', 'Prenatal vitamin if female of childbearing age']
    });

    monitoring.push('General health and symptom monitoring');
    monitoring.push('Nutritional assessment');
    followUp = 'Routine follow-up in 3-6 months or sooner if symptoms worsen';
  }

  return {
    recommendations: [...new Set(recommendations)],
    medications,
    monitoring: [...new Set(monitoring)],
    followUp
  };
}

// Main enhanced clinical analysis function - CARING DOCTOR TONE
export function generateEnhancedClinicalAnalysis(patient: Patient): string {
  const clinicalAnalysis = detectClinicalConditions(patient);
  const treatmentPlan = generateTreatmentRecommendations(
    clinicalAnalysis.conditions,
    clinicalAnalysis.severity,
    patient
  );

  // Determine confidence level with a friendly explanation
  let confidenceLevel = 'Thinking through things...';
  let confidenceExplanation = 'I am looking at the information we have right now.';

  if (clinicalAnalysis.confidence >= 80) {
    confidenceLevel = 'Quite confident';
    confidenceExplanation = 'We have some good, clear information to work with here.';
  } else if (clinicalAnalysis.confidence >= 60) {
    confidenceLevel = 'Learning more...';
    confidenceExplanation = 'I have a good start, but I would like to keep an eye on things as they develop.';
  }

  // Generate patient-specific clinical reasoning with a warm tone
  const report = `HELLO THERE! LET'S LOOK AT WHAT WE'RE SEEING TODAY

• What's bothering our patient: ${patient.complaints || 'Nothing specific reported yet'}
• Vital signs & findings: We've noted a BP of ${patient.baselineVitals.bp || '--'}, heart rate at ${patient.baselineVitals.hr || '--'} bpm, temperature of ${patient.baselineVitals.temp || '--'}°F, and oxygen levels at ${patient.baselineVitals.spo2 || '--'}%.
• My clinical thoughts: ${clinicalAnalysis.reasoning.slice(0, 3).join('; ') || 'I am carefully reviewing all the findings to understand the best path forward.'}
• What I'm considering: ${clinicalAnalysis.conditions.length > 0 ? clinicalAnalysis.conditions.slice(0, 2).map(c => c.replace('_', ' ')).join(', ') : 'I want to Rule Out any immediate concerns first.'}
• What seems less likely right now: ${clinicalAnalysis.conditions.length === 0 ? 'Any acute emergencies' : 'Conditions that don\'t match these specific findings'}
• What we still need to figure out: ${clinicalAnalysis.confidence < 70 ? 'We\'ll need a few more tests to be absolutely sure of the best diagnosis.' : 'We\'ll monitor how things progress over the next few days.'}

MY CLINICAL IMPRESSION:
${clinicalAnalysis.severity === 'critical' ? 'This is something we need to take care of right away.' :
      clinicalAnalysis.severity === 'severe' ? 'This is definitely something that needs our urgent attention.' :
        clinicalAnalysis.severity === 'moderate' ? 'We should address this reasonably soon to keep things on the right track.' :
          'Everything looks quite stable, and we\'ll focus on routine care and keeping you comfortable.'}

HOW I'M FEELING ABOUT THIS:
${confidenceLevel}
(${confidenceExplanation})

OUR PLAN FOR MOVING FORWARD:
${treatmentPlan.recommendations.length > 0 ?
      treatmentPlan.recommendations.map(rec => `• ${rec.replace('🚨 ', '')}`).join('\n') :
      '• We\'ll stick with our current plan for now\n• Keeping a steady eye on how you\'re feeling'}

${treatmentPlan.medications.length > 0 ?
      `Suggested Medications To Consider:\n${treatmentPlan.medications.map(med =>
        `• ${med.name} (${med.category}) - ${med.dose} ${med.route} ${med.frequency}\n  Thinking: ${med.rationale}\n  Keep in mind: ${med.precautions}`
      ).join('\n\n')}` :
      'I don\'t see any need to change medications right at this moment.'}

What to watch: ${treatmentPlan.monitoring.join(', ') || 'Just follow your regular routine'}
When we'll chat again: ${treatmentPlan.followUp}

--- Patient-Friendly Message ---

Hello! I've been looking over how you're feeling and your latest test results. I want you to know that we are right here with you, and your health is my absolute top priority.

Based on what you've told me—especially about ${patient.complaints || 'how things have been going'}—here's what I'm thinking:

I've carefully checked your vitals, like your blood pressure and heart rate. They give me a good window into how your body is doing right now. ${clinicalAnalysis.severity === 'normal' ? "Everything looks quite steady, which is very reassuring." : "I've noticed a few things we should keep an eye on, but please don't worry—that's exactly why we're monitoring you so closely."}

I've put together a plan that I think will really help you feel better. It includes some lifestyle adjustments and perhaps some gentle medication to support your recovery. 

Please remember: We are with you. Don't worry, your health is our priority and we will monitor your progress closely.

Take it one day at a time, and never hesitate to reach out if anything changes or if you just have a question. We're in this together!

Warmly,
Your Clinical Support Assistant

Disclaimer: This analysis is based on available data and is intended for educational and support purposes. It should be reviewed by your medical team.`;

  return report;
}

export { detectClinicalConditions, analyzeVitalSigns, analyzeLabValues, generateTreatmentRecommendations };
