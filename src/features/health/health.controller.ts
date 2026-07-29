import type { Request, Response } from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../../lib/api-response.js";

const dbStateLabels: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export function getHealth(req: Request, res: Response) {
  sendSuccess(res, {
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    database: dbStateLabels[mongoose.connection.readyState] ?? "unknown",
    timestamp: new Date().toISOString(),
  });
}
