import { AiAnalysisOutput, AnalyzeImagingInput, ImagingReport } from "../models/types";
import { SAFETY_DISCLAIMERS } from "../utils/safety";

export function generateImagingReport(
  triageData: AnalyzeImagingInput,
  analysis: AiAnalysisOutput | null,
): ImagingReport {
  if (!analysis) {
    return {
      summary: "Imaging analysis was not performed because triage was not RED.",
      findings: [
        `Triage level received: ${triageData.triage_level}`,
        "Experimental policy allows imaging workflow only for RED triage",
      ],
      recommendation: "Continue standard triage protocol and clinician evaluation.",
      confidence: "N/A",
      safety_note: [...SAFETY_DISCLAIMERS],
    };
  }

  const findings = [
    `Triage trigger: ${triageData.triage_level}`,
    `Symptoms reviewed: ${triageData.symptoms.join(", ") || "none provided"}`,
    `AI signal: ${analysis.possible_condition}`,
  ];

  const recommendation = analysis.abnormality_detected
    ? "Urgent clinician review and confirmatory imaging interpretation are recommended."
    : "Correlate with clinical exam; continue clinician-led monitoring and reassessment.";

  return {
    summary: analysis.abnormality_detected
      ? "AI output is suggestive of abnormal findings requiring immediate clinical attention."
      : "AI output does not indicate a clear acute abnormal pattern in this heuristic analysis.",
    findings,
    recommendation,
    confidence: `${Math.round(analysis.confidence * 100)}% (computed algorithmically)`,
    safety_note: [...SAFETY_DISCLAIMERS],
  };
}
