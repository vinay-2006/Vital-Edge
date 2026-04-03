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
import { runMockInference } from "../services/mockInferenceService";
import { generateImagingReport } from "../services/reportGeneratorService";
import { assertSupportedImage, resolveExistingImagePath } from "../services/storageService";
import { SAFETY_DISCLAIMERS } from "../utils/safety";

const moduleRoot = path.resolve(__dirname, "..", "..");
const mockStorageDir = path.resolve(moduleRoot, "mock-storage");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mockStorageDir),
  filename: (_req, file, cb) => {
    const sanitizedName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

const upload = multer({ storage });

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
  (req, res): void => {
    try {
      const input = extractInput(req);
      const recommendation = getImagingRecommendation(input);

      let resolvedImagePath = "";
      if (recommendation.imaging_recommended) {
        if (req.file?.path) {
          resolvedImagePath = req.file.path;
          assertSupportedImage(resolvedImagePath);
        } else if (input.image_path) {
          resolvedImagePath = resolveExistingImagePath(input.image_path, moduleRoot);
        } else {
          throw new Error("Provide either multipart field 'image' or JSON field 'image_path' for RED triage");
        }
      }

      const pipeline = recommendation.imaging_recommended ? runMockDicomPipeline() : [];
      const analysis = recommendation.imaging_recommended ? runMockInference(input) : null;
      const report = generateImagingReport(input, analysis);

      const response: AnalyzeImagingResponse = {
        imaging_recommended: recommendation.imaging_recommended,
        reason: recommendation.reason,
        pipeline,
        analysis,
        report,
        safety_disclaimer: [...SAFETY_DISCLAIMERS],
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
