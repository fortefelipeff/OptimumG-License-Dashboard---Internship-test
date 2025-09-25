import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { z } from "zod";

import { licenseService, LicenseOperationError } from "../backend";

const activationSchema = z.object({
  machineId: z.string().min(1, "machineId is required"),
  activatedBy: z.string().min(1, "activatedBy is required").optional(),
});

const deactivateSchema = z.object({
  machineId: z.string().min(1, "machineId is required"),
});

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/licenses", (_req, res) => {
    const licenses = licenseService.listLicenses();
    res.json({ data: licenses });
  });

  app.get("/api/licenses/:key", (req, res) => {
    const license = licenseService.getLicense(req.params.key);
    if (!license) {
      return res.status(404).json({ error: "License not found" });
    }
    return res.json({ data: license });
  });

  app.post("/api/licenses/:key/activate", (req, res, next) => {
    const parse = activationSchema.safeParse(req.body);
    if (!parse.success) {
      const messages = parse.error.issues.map((issue) => issue.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    const { machineId, activatedBy = "unknown" } = parse.data;

    try {
      const updated = licenseService.activate(req.params.key, machineId, activatedBy);
      return res.json({ data: updated });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/licenses/:key/deactivate", (req, res, next) => {
    const parse = deactivateSchema.safeParse(req.body);
    if (!parse.success) {
      const messages = parse.error.issues.map((issue) => issue.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    try {
      const updated = licenseService.deactivate(req.params.key, parse.data.machineId);
      return res.json({ data: updated });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/licenses/:key/status", (req, res) => {
    const status = licenseService.getStatus(req.params.key);
    res.json({ data: status });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof LicenseOperationError) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Unhandled error", error);
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
