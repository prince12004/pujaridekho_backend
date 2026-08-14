import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../lib/api-error.js";

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Auth for the external CRM app's calls into this API — a static shared key,
// deliberately separate from admin JWT auth (that's for the admin dashboard
// only). CRM sends `Authorization: Bearer <WEBSITE_API_KEY>`.
export function requireWebsiteApiKey(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing website API key"));
  }

  const token = header.slice("Bearer ".length);
  if (!timingSafeEqual(token, env.WEBSITE_API_KEY)) {
    return next(ApiError.unauthorized("Invalid website API key"));
  }

  next();
}
