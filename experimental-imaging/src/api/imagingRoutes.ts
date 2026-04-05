import express, { Request } from "express";
import multer from "multer";
import path from "path";
import {
  AnalyzeImagingInput,
  AnalyzeImagingResponse,
  TriageLevel,
} from "../models/types";
import { runMockDicomPipeline } from "../pipeline/mockDicomPipeline";
import { getImagingRecommendation } from "../services/imagingRecommendationService";
import { runRealInference } from "../services/mockInferenceService";
import { generateImagingReport } from "../services/reportGeneratorService";
import { assertSupportedImage, resolveExistingImagePath } from "../services/storageService";
import { SAFETY_DISCLAIMERS } from "../utils/safety";

const moduleRoot = process.cwd();
const mockStorageDir = path.resolve(moduleRoot, "mock-storage");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mockStorageDir),
  filename: (_req, file, cb) => {
    const sanitizedName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.includes("image")) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  }
});

function parseVitals(rawVitals: unknown): AnalyzeImagingInput["vitals"] {
  if (!rawVitals) {
    return {};
  }

  if (typeof rawVitals === "string") {
    const parsed = JSON.parse(rawVitals);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as AnalyzeImagingInput["vitals"])
      : {};
  }

  return typeof rawVitals === "object" && rawVitals !== null
    ? (rawVitals as AnalyzeImagingInput["vitals"])
    : {};
}

function parseSymptoms(rawSymptoms: unknown): string[] {
  if (!rawSymptoms) {
    return [];
  }

  if (Array.isArray(rawSymptoms)) {
    return rawSymptoms.map(String);
  }

  if (typeof rawSymptoms === "string") {
    try {
      const parsed = JSON.parse(rawSymptoms);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return rawSymptoms
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function normalizeTriageLevel(rawLevel: unknown): TriageLevel {
  const normalized = String(rawLevel || "").toUpperCase();

  if (normalized !== "RED" && normalized !== "YELLOW" && normalized !== "GREEN") {
    throw new Error("triage_level must be one of RED, YELLOW, GREEN");
  }

  return normalized;
}

function extractInput(req: Request): AnalyzeImagingInput {
  return {
    triage_level: normalizeTriageLevel(req.body?.triage_level),
    vitals: parseVitals(req.body?.vitals),
    symptoms: parseSymptoms(req.body?.symptoms),
    image_path: typeof req.body?.image_path === "string" ? req.body.image_path : undefined,
  };
}

export const imagingRouter = express.Router();

imagingRouter.post(
  "/analyze-imaging",
  upload.single("image"),
  async (req, res): Promise<void> => {
    const start = Date.now();
    try {
      const input = extractInput(req);
      const recommendation = getImagingRecommendation(input);

      let resolvedImagePath = "";
      let note: string | undefined = undefined;

      if (recommendation.imaging_recommended) {
        if (req.file?.path) {
          console.log(`[UPLOAD] Image received via network: ${req.file.originalname}`);
          resolvedImagePath = req.file.path;
          assertSupportedImage(resolvedImagePath);
        } else if (input.image_path) {
          resolvedImagePath = resolveExistingImagePath(input.image_path, moduleRoot);
          console.log(`[UPLOAD] Image received via local path: ${resolvedImagePath}`);
        } else {
          note = "Imaging not yet available";
        }
      }

      console.log(`[PIPELINE] Processing started for triage: ${input.triage_level}`);
      const pipeline = recommendation.imaging_recommended ? runMockDicomPipeline() : [];
      let analysis = null;
      
      if (recommendation.imaging_recommended && resolvedImagePath) {
         analysis = await runRealInference(input, resolvedImagePath);
         console.log(`[AI] Analysis complete`);
      }
      
      const report = generateImagingReport(input, analysis);
      console.log(`[REPORT] Generated`);
      
      const processing_time_ms = Date.now() - start;

      const response: AnalyzeImagingResponse = {
        imaging_recommended: recommendation.imaging_recommended,
        reason: recommendation.reason,
        pipeline,
        analysis,
        report,
        safety_disclaimer: [...SAFETY_DISCLAIMERS],
        processing_time_ms,
        note
      };

      res.status(200).json({
        ...response,
        image_path: resolvedImagePath || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      res.status(400).json({
        error: message,
        safety_disclaimer: [...SAFETY_DISCLAIMERS],
      });
    }
  },
);
