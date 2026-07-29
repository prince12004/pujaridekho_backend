import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: Record<string, string[]>,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}
