export type TriageLevel = "RED" | "YELLOW" | "GREEN";

export interface AnalyzeImagingInput {
  triage_level: TriageLevel;
  vitals: Record<string, number | string | boolean | null | undefined>;
  symptoms: string[];
  image_path?: string;
}

export interface ImagingRecommendation {
  imaging_recommended: boolean;
  reason: string;
}

export type PipelineStage = "intake" | "processing" | "ready-for-analysis";

export interface PipelineEvent {
  stage: PipelineStage;
  at: string;
}

export interface ImageMetrics {
  contrast: number;
  variance: number;
}

export interface ExplainabilityMetrics {
  clinical_weight: number;
  image_weight: number;
  image_influence: string;
}

export interface AiAnalysisOutput {
  abnormality_detected: boolean;
  possible_condition: string;
  confidence: number;
  explanation: ExplainabilityMetrics;
  image_metrics: ImageMetrics;
}

export interface ImagingReport {
  summary: string;
  findings: string[];
  recommendation: string;
  confidence: string;
  safety_note: string[];
}

export interface AnalyzeImagingResponse {
  imaging_recommended: boolean;
  reason: string;
  pipeline: PipelineEvent[];
  analysis: AiAnalysisOutput | null;
  report: ImagingReport;
  safety_disclaimer: string[];
  processing_time_ms: number;
  note?: string;
}
