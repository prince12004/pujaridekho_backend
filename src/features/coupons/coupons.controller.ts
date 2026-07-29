import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { validateCoupon } from "./coupons.service.js";

const validateSchema = z.object({ code: z.string().min(1), amount: z.number().min(0) });

export const postValidateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, amount } = validateSchema.parse(req.body);
  sendSuccess(res, await validateCoupon(code, amount));
});
