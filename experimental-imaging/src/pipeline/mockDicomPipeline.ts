import { PipelineEvent, PipelineStage } from "../models/types";

const PIPELINE_STAGES: PipelineStage[] = ["intake", "processing", "ready-for-analysis"];

export function runMockDicomPipeline(): PipelineEvent[] {
  const baseTime = Date.now();

  return PIPELINE_STAGES.map((stage, index) => ({
    stage,
    at: new Date(baseTime + index * 1000).toISOString(),
  }));
}
