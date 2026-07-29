import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { env } from "../../config/env.js";
import { handlePayUCallback, initiatePayUPayment } from "./payments.service.js";

const initiateSchema = z.object({
  entityType: z.enum(["booking", "order", "consultation"]),
  entityId: z.string().min(1),
  amount: z.number().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
});

export const postInitiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const input = initiateSchema.parse(req.body);
  const checkout = await initiatePayUPayment(input);
  sendSuccess(res, checkout);
});

export const postPayUCallback = asyncHandler(async (req: Request, res: Response) => {
  const clientUrl = env.CLIENT_URL.replace(/\/$/, "");
  try {
    const result = await handlePayUCallback(req.body);
    const query = new URLSearchParams({
      status: result.succeeded ? "success" : "failed",
      entityType: result.entityType ?? "",
      entityId: result.entityId ?? "",
    });
    res.redirect(302, `${clientUrl}/payment/result?${query.toString()}`);
  } catch {
    res.redirect(302, `${clientUrl}/payment/result?status=error`);
  }
});
