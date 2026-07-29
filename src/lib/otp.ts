import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OtpModel, type OTP_PURPOSES } from "../models/otp.model.js";
import { ApiError } from "./api-error.js";
import { isProduction } from "../config/env.js";

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MINUTES = 30;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

function generateOtpCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function requestOtp(mobile: string, purpose: OtpPurpose) {
  const lastSent = await OtpModel.findOne({ mobile, purpose }).sort({ createdAt: -1 });
  if (lastSent) {
    const secondsSinceLastSend = (Date.now() - lastSent.createdAt.getTime()) / 1000;
    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
      throw ApiError.badRequest(`Please wait ${waitSeconds}s before requesting another OTP`);
    }
  }

  const windowStart = new Date(Date.now() - SEND_WINDOW_MINUTES * 60 * 1000);
  const recentSendCount = await OtpModel.countDocuments({ mobile, purpose, createdAt: { $gte: windowStart } });
  if (recentSendCount >= MAX_SENDS_PER_WINDOW) {
    throw ApiError.badRequest("Too many OTP requests for this number. Please try again later.");
  }

  const code = generateOtpCode();
  const otpHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OtpModel.create({ mobile, purpose, otpHash, expiresAt });

  // Real SMS delivery is a documented pending integration (see README/report) —
  // in non-production environments the OTP is returned directly so the flow
  // is fully testable without a paid SMS provider.
  return { expiresAt, devOtp: isProduction ? undefined : code };
}

export async function consumeOtp(mobile: string, purpose: OtpPurpose, code: string) {
  const record = await OtpModel.findOne({ mobile, purpose, consumed: false }).sort({ createdAt: -1 });
  if (!record) throw ApiError.badRequest("No active OTP request found — please request a new OTP");

  if (record.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest("This OTP has expired — please request a new one");
  }
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw ApiError.badRequest("Too many incorrect attempts — please request a new OTP");
  }

  const isValid = await bcrypt.compare(code, record.otpHash);
  if (!isValid) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_VERIFY_ATTEMPTS - record.attempts;
    throw ApiError.badRequest(
      remaining > 0 ? `Incorrect OTP (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)` : "Too many incorrect attempts — please request a new OTP",
    );
  }

  record.consumed = true;
  await record.save();
}
