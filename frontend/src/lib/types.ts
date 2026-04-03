export type TriagePriority = 'CRITICAL' | 'MODERATE' | 'STABLE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Mode = 'HOSPITAL' | 'AMBULANCE';
export type DeteriorationRisk = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PatientInfo {
  name: string;
  age: number;
  gender: Gender;
}

export interface VitalSigns {
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  pulse: number;
  temperature: number;
  spo2: number;
  respiratoryRate: number;
}

export interface Symptoms {
  chestPain: boolean;
  breathlessness: boolean;
  bleeding: boolean;
  unconscious: boolean;
  seizure: boolean;
  fever: boolean;
  abdomenPain: boolean;
  trauma: boolean;
  other?: string;
}

export interface TriageScore {
  totalScore: number;
  vitalScore: number;
  symptomScore: number;
  breakdown: {
    category: string;
    points: number;
    reason: string;
  }[];
}

export interface ExplainabilityData {
  reasoning: string[];
  whyNotRed: string;
  whyNotGreen: string;
  biasNote: string;
}

export interface RiskAssessment {
  deteriorationRisk: DeteriorationRisk;
  riskTimeframe: string;
  riskIndicators: string[];
  preparationNotes: string[];
}

export interface TriageInput {
  patient: PatientInfo;
  vitals: VitalSigns;
  symptoms: Symptoms;
  mode: Mode;
  etaMinutes?: number;
  operatorName?: string;
}

export interface TriageResult {
  id: string;
  priority: TriagePriority;
  confidence: number;
  score: TriageScore;
  explainability: ExplainabilityData;
  riskAssessment: RiskAssessment;
  patient: PatientInfo;
  vitals: VitalSigns;
  symptoms: Symptoms;
  mode: Mode;
  etaMinutes?: number;
  alertSentAt?: string;
  operatorName?: string;
  createdAt: string;
  isOverridden?: boolean;
  overrideReason?: string;
}

export interface DashboardSummary {
  totalToday: number;
  red: number;
  yellow: number;
  green: number;
  averageConfidence: number;
  highRiskCount: number;
  ambulanceModeCount: number;
  recentEntries: TriageResult[];
}

export interface AuditLog {
  id: string;
  action: 'TRIAGE_CREATED' | 'PRIORITY_OVERRIDDEN' | 'RECORD_EXPORTED';
  triageId?: string;
  details: Record<string, unknown>;
  operatorName?: string;
  createdAt: string;
}

// Legacy type mappings for backward compatibility
export interface Vitals {
  bpSystolic: string;
  bpDiastolic: string;
  pulse: string;
  temperature: string;
  spo2: string;
  respiratoryRate: string;
}

export const SYMPTOMS = [
  'Chest Pain',
  'Breathlessness',
  'Bleeding',
  'Fever',
  'Unconscious',
  'Trauma',
  'Abdominal Pain',
  'Seizure',
] as const;
