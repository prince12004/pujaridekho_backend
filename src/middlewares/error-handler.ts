import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../lib/api-error.js";
import { sendError } from "../lib/api-response.js";
import { logger } from "../config/logger.js";
import { isProduction } from "../config/env.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, err.errors);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, "Validation failed", err.flatten().fieldErrors as Record<string, string[]>);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {};
    for (const [field, validatorError] of Object.entries(err.errors)) {
      errors[field] = [validatorError.message];
    }
    return sendError(res, 400, "Validation failed", errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, 400, `Invalid value for field "${err.path}"`);
  }

  logger.error("Unhandled error", err);
  return sendError(
    res,
    500,
    isProduction ? "Internal server error" : err instanceof Error ? err.message : "Internal server error",
  );
}
