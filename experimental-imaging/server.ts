import cors from "cors";
import express from "express";
import path from "path";
import { imagingRouter } from "./src/api/imagingRoutes";

const app = express();
const port = Number(process.env.IMAGING_PORT || 4010);

app.use(cors());
app.use(express.json());
app.use("/mock-storage", express.static(path.resolve(process.cwd(), "mock-storage")));
app.use("/", imagingRouter);

app.get("/", (_req, res) => {
  res.json({
    module: "experimental-imaging",
    status: "running",
    message: "Experimental imaging module is API-only. Use POST /analyze-imaging for analysis.",
    endpoints: {
      health: "GET /health",
      analyzeImaging: "POST /analyze-imaging",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    module: "experimental-imaging",
    timestamp: new Date().toISOString(),
  });
});

function startServer(targetPort: number, allowFallback: boolean): void {
  const server = app.listen(targetPort);

  server.on("listening", () => {
    console.log(`Experimental imaging module running on http://localhost:${targetPort}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && allowFallback) {
      const fallbackPort = targetPort + 1;
      console.warn(
        `Port ${targetPort} is already in use. Falling back to http://localhost:${fallbackPort}`,
      );
      startServer(fallbackPort, false);
      return;
    }

    console.error("Failed to start experimental imaging module:", error.message);
    process.exit(1);
  });
}

startServer(port, true);
