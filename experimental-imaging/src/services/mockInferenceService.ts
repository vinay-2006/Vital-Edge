import { Jimp } from "jimp";
import { AiAnalysisOutput, AnalyzeImagingInput } from "../models/types";

function includesAnySymptom(symptoms: string[], checks: string[]): boolean {
  const normalized = symptoms.map((symptom) => symptom.toLowerCase());
  return checks.some((check) =>
    normalized.some((symptom) => symptom.includes(check.toLowerCase())),
  );
}

function calculateClinicalScore(input: AnalyzeImagingInput): number {
  let score = 0;

  // Max score ~ 100 for normalization
  const strokeLike = includesAnySymptom(input.symptoms, [
    "slurred speech", "facial droop", "one-sided weakness", "sudden confusion"
  ]);
  const respLike = includesAnySymptom(input.symptoms, [
    "shortness of breath", "wheezing", "chest tightness", "persistent cough"
  ]);

  if (strokeLike) score += 40;
  if (respLike) score += 30;

  const spo2Raw = input.vitals?.spo2;
  const spo2 = typeof spo2Raw === "number" ? spo2Raw : (typeof spo2Raw === "string" ? Number(spo2Raw) : NaN);
  if (!Number.isNaN(spo2) && spo2 < 92) score += 30;

  if (input.triage_level === "RED") score += 20;
  
  return Math.min(score, 100);
}

export async function runRealInference(input: AnalyzeImagingInput, imagePath: string): Promise<AiAnalysisOutput> {
  const maxClinicalScore = 100;
  const rawClinical = calculateClinicalScore(input);
  const clinical_norm = rawClinical / maxClinicalScore; 

  // Initialize image analysis base defaults
  let contrast = 0.5;
  let variance = 0.5;

  try {
    const image = await Jimp.read(imagePath);
    let minBrightness = 255;
    let maxBrightness = 0;
    let totalBrightness = 0;
    const pixelCount = image.bitmap.width * image.bitmap.height;

    // Simplistic heuristic pixel analysis simulation
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x: number, y: number, idx: number) => {
      const red = image.bitmap.data[idx];
      const green = image.bitmap.data[idx + 1];
      const blue = image.bitmap.data[idx + 2];
      const brightness = (red + green + blue) / 3;
      
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
      totalBrightness += brightness;
    });

    const averageBrightness = totalBrightness / (pixelCount || 1);
    contrast = (maxBrightness - minBrightness) / 255;
    
    // Simplistic variance proxy: normalize brightness shift
    variance = Math.abs(averageBrightness - 128) / 128; 
  } catch (err) {
    console.error("Failed to parse image pixels with Jimp, using fallback weights", err);
  }

  // Image score ranges from 0-1
  const image_norm = Math.min((contrast * 0.6) + (variance * 0.4), 1.0);

  // Exact fusion logic requested by architect:
  const confidence = (clinical_norm * 0.7) + (image_norm * 0.3);

  // Deriving explainability
  const image_influence = image_norm > 0.6 ? "strong" : (image_norm > 0.3 ? "moderate" : "weak");
  const abnormality_detected = confidence > 0.45;

  return {
    abnormality_detected,
    possible_condition: abnormality_detected 
        ? "pattern inconsistent with normal baseline — requires further evaluation" 
        : "no distinct acute abnormality pattern detected — correlate clinically",
    confidence,
    explanation: {
      clinical_weight: 0.7,
      image_weight: 0.3,
      image_influence,
    },
    image_metrics: {
      contrast,
      variance,
    }
  };
}
