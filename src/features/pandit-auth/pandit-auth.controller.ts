import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { mobileSchema as mobileFieldSchema } from "../../lib/validators.js";
import {
  changePanditPassword,
  loginPandit,
  requestPanditPasswordReset,
  resetPanditPassword,
} from "./pandit-auth.service.js";

const loginSchema = z.object({ mobile_number: mobileFieldSchema, password: z.string().min(1) });

export const postLogin = asyncHandler(async (req: Request, res: Response) => {
  const { mobile_number, password } = loginSchema.parse(req.body);
  const result = await loginPandit(mobile_number, password);
  sendSuccess(res, result, "Login successful");
});

export const postLogout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWTs — logout is a client-side token discard, same documented
  // scope limit as customer-auth.
  sendSuccess(res, null, "Logged out");
});

const forgotPasswordSchema = z.object({ mobile_number: mobileFieldSchema });

export const postForgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { mobile_number } = forgotPasswordSchema.parse(req.body);
  await requestPanditPasswordReset(mobile_number);
  // Matches the current pujaripandit_app forgot-password screen, which only
  // shows a "check your phone" confirmation and has no OTP-entry step yet —
  // see report's deferred list for the follow-up reset-password screen.
  sendSuccess(res, null, "OTP sent to registered mobile number");
});

const resetPasswordSchema = z.object({
  mobile_number: mobileFieldSchema,
  otp: z.string().min(4).max(6),
  new_password: z.string().min(4),
});

// Not yet wired into the Flutter app (no OTP-entry UI exists there today) —
// added so the forgot-password flow has a real, working completion once
// that screen is built. See report.
export const postResetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { mobile_number, otp, new_password } = resetPasswordSchema.parse(req.body);
  await resetPanditPassword(mobile_number, otp, new_password);
  sendSuccess(res, null, "Password reset successfully");
});

const changePasswordSchema = z.object({ current_password: z.string().min(1), new_password: z.string().min(4) });

export const postChangePassword = asyncHandler(async (req: Request, res: Response) => {
  const { current_password, new_password } = changePasswordSchema.parse(req.body);
  await changePanditPassword(req.pandit!.id, current_password, new_password);
  sendSuccess(res, null, "Password updated successfully.");
});
