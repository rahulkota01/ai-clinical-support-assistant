
export interface VitalSigns {
  bp: string;
  hr: string;
  temp: string;
  spo2: string;
}

export interface LabResults {
  wbc?: string;
  platelets?: string;
  rbc?: string;
  creatinine?: string;
  // Extended lab values
  hemoglobin?: string;
  esr?: string;
  mch?: string;
  mchc?: string;
  mcv?: string;
  bloodSugar?: string;
  sodium?: string;
  potassium?: string;
  triglycerides?: string;
  bloodUreaNitrogen?: string;
  sgot?: string;
  sgpt?: string;
}

export interface ExtendedVitals {
  // Additional vital signs
  respiratoryRate?: string;
  painScale?: string;
  bloodGlucose?: string;
}

export interface SocialHistory {
  smoking: boolean;
  alcohol: boolean;
  tobacco: boolean;
}

export interface Medication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  isCurrentlyTaking?: boolean; // For current medication checkbox
}

export interface AISuggestedDrug {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  isComplete: boolean;
  source?: 'AI' | 'Logic' | 'Manual';
}

export interface DrugDetails {
  aiSuggested?: Array<{
    name: string;
    dose: string;
    route: string;
    frequency: string;
    rationale: string;
    confidence: number;
  }>;
  logicSuggested?: Array<{
    name: string;
    category: string;
    rationale: string;
    precautions: string;
    dose: string;
    route: string;
    frequency: string;
  }>;
  manuallyEntered?: Medication[];
  interactions?: Array<{
    drug1: string;
    drug2: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  combinedAnalysis?: string;
}

export interface Visit {
  id: string;
  date: string;
  summary: string;
  vitals: VitalSigns;
  labResults?: LabResults;
  complaints?: string;
  aiReport?: string;
  // Drug details
  drugDetails?: DrugDetails;
  // Post-discharge data entered by HCP
  lifestyleModifications?: string;
  dischargeVitals?: VitalSigns;
  dischargeLabs?: LabResults;
  dischargeInstructions?: string;
  followUpPlan?: string;
  // Diagnosis information
  diagnosis?: string;
  finalDiagnosis?: string;
  diagnosisType?: string;
  diagnosisConfidence?: number;
}

export type PatientStatus = 'Active' | 'Observation' | 'Discharged - Improved' | 'Discharged - Not Improved';

export interface Patient {
  id: string;
  pin: string;
  fullName: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  height: string;
  weight: string;
  baselineVitals: VitalSigns;
  baselineLabs?: LabResults;
  socialHistory: SocialHistory;
  familyHistory: string;
  medications: Medication[];
  complaints: string;
  medicalHistory: string;
  treatmentContext: string;
  status: PatientStatus;
  visits: Visit[];
  consentGiven: boolean;
  otherFindings?: string; // For imaging & report interpretations
  drugDetails?: DrugDetails; // Persisted drug analysis
  suggestedMedications?: AISuggestedDrug[];
}

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ViewState = 'PATIENT_LOGIN' | 'PATIENT_DASHBOARD' | 'HCP_LOGIN' | 'HCP_DASHBOARD';
