import { AiAnalysisOutput, AnalyzeImagingInput } from "../models/types";

function includesAnySymptom(symptoms: string[], checks: string[]): boolean {
  const normalized = symptoms.map((symptom) => symptom.toLowerCase());
  return checks.some((check) =>
    normalized.some((symptom) => symptom.includes(check.toLowerCase())),
  );
}

export function runMockInference(input: AnalyzeImagingInput): AiAnalysisOutput {
  const strokeLike = includesAnySymptom(input.symptoms, [
    "slurred speech",
    "facial droop",
    "one-sided weakness",
    "sudden confusion",
  ]);

  const respiratoryLike = includesAnySymptom(input.symptoms, [
    "shortness of breath",
    "wheezing",
    "chest tightness",
    "persistent cough",
  ]);

  const spo2Raw = input.vitals?.spo2;
  const spo2 =
    typeof spo2Raw === "number"
      ? spo2Raw
      : typeof spo2Raw === "string"
        ? Number(spo2Raw)
        : NaN;

  if (strokeLike) {
    return {
      abnormality_detected: true,
      possible_condition: "Findings suggestive of acute neurologic change, consistent with stroke pattern",
      confidence: 0.82,
    };
  }

  if (respiratoryLike || (!Number.isNaN(spo2) && spo2 < 92)) {
    return {
      abnormality_detected: true,
      possible_condition:
        "Findings suggestive of respiratory compromise, consistent with lower respiratory pathology",
      confidence: 0.76,
    };
  }

  return {
    abnormality_detected: false,
    possible_condition: "No major acute abnormality detected; findings may be within expected limits",
    confidence: 0.21,
  };
}
