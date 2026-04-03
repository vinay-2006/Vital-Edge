import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

export function assertSupportedImage(filePath: string): void {
  const extension = path.extname(filePath).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Only .jpg, .jpeg, or .png files are supported in mock DICOM mode");
  }
}

export function resolveExistingImagePath(imagePath: string, moduleRoot: string): string {
  const candidate = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(moduleRoot, imagePath);

  if (!fs.existsSync(candidate)) {
    throw new Error(`Image path does not exist: ${candidate}`);
  }

  assertSupportedImage(candidate);
  return candidate;
}
