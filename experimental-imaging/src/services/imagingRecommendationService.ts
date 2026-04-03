import { AnalyzeImagingInput, ImagingRecommendation } from "../models/types";

export function getImagingRecommendation(
  triageData: AnalyzeImagingInput,
): ImagingRecommendation {
  if (triageData.triage_level === "RED") {
    return {
      imaging_recommended: true,
      reason: "High-risk vitals + symptoms",
    };
  }

  return {
    imaging_recommended: false,
    reason: "Imaging activation is limited to RED triage in this experimental module",
  };
}
