import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import {
  refreshCustomerSession,
  requestChangeMobileOtp,
  sendLoginOtp,
  verifyChangeMobileOtp,
  verifyLoginOtp,
} from "./customer-auth.service.js";

const mobileSchema = z.object({ mobile: z.string().min(10).max(15) });
const verifySchema = z.object({ mobile: z.string().min(10).max(15), otp: z.string().min(4).max(6) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export const postSendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = mobileSchema.parse(req.body);
  const result = await sendLoginOtp(mobile);
  sendSuccess(res, result, "OTP sent");
});

export const postVerifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp } = verifySchema.parse(req.body);
  const { accessToken, refreshToken, isNewCustomer, customer } = await verifyLoginOtp(mobile, otp);
  sendSuccess(
    res,
    {
      accessToken,
      refreshToken,
      isNewCustomer,
      customer: { id: customer._id.toString(), name: customer.name, mobile: customer.mobile, email: customer.email },
    },
    "Login successful",
  );
});

export const postRefresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const tokens = await refreshCustomerSession(refreshToken);
  sendSuccess(res, tokens, "Session refreshed");
});

export const postLogout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWTs — logout is a client-side token discard. Documented as a
  // known scope limit: there is no server-side revocation list yet.
  sendSuccess(res, null, "Logged out");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { customer: req.customer });
});

const changeMobileRequestSchema = z.object({ newMobile: z.string().min(10).max(15) });
const changeMobileVerifySchema = z.object({ newMobile: z.string().min(10).max(15), otp: z.string().min(4).max(6) });

export const postChangeMobileSendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { newMobile } = changeMobileRequestSchema.parse(req.body);
  const result = await requestChangeMobileOtp(req.customer!.id, newMobile);
  sendSuccess(res, result, "OTP sent to new mobile number");
});

export const postChangeMobileVerify = asyncHandler(async (req: Request, res: Response) => {
  const { newMobile, otp } = changeMobileVerifySchema.parse(req.body);
  const customer = await verifyChangeMobileOtp(req.customer!.id, newMobile, otp);
  sendSuccess(res, { mobile: customer.mobile }, "Mobile number updated");
});
