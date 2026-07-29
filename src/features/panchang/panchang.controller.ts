import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { computeDailyPanchang, DEFAULT_LOCATION } from "../../lib/astronomy/panchang.js";
import { findIndiaCity } from "../../lib/astronomy/india-cities.js";

function todayIstDateString(): string {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const year = istNow.getFullYear();
  const month = String(istNow.getMonth() + 1).padStart(2, "0");
  const day = String(istNow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  city: z.string().optional(),
});

export const getPanchang = asyncHandler(async (req: Request, res: Response) => {
  const { date, city } = querySchema.parse(req.query);
  const location = (city && findIndiaCity(city)) || DEFAULT_LOCATION;
  const result = computeDailyPanchang(date ?? todayIstDateString(), location);
  sendSuccess(res, result);
});
