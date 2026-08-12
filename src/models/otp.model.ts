import { Schema, model, type InferSchemaType } from "mongoose";

export const OTP_PURPOSES = ["login", "change_mobile"] as const;

const otpSchema = new Schema(
  {
    mobile: { type: String, required: true, index: true },
    purpose: { type: String, enum: OTP_PURPOSES, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ mobile: 1, purpose: 1, createdAt: -1 });

export type OtpDocument = InferSchemaType<typeof otpSchema>;
export const OtpModel = model("Otp", otpSchema);
