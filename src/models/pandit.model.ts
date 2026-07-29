import { Schema, model, type InferSchemaType } from "mongoose";

const bankDetailsSchema = new Schema(
  {
    accountHolderName: String,
    accountNumber: String,
    ifsc: String,
  },
  { _id: false },
);

export const PANDIT_VERIFICATION_STATUSES = [
  "application_pending",
  "documents_pending",
  "under_verification",
  "verified",
  "rejected",
  "suspended",
  "inactive",
] as const;

const panditSchema = new Schema(
  {
    photo: { type: String },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    alternateMobile: { type: String },
    email: { type: String, lowercase: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    experienceYears: { type: Number, min: 0, default: 0 },
    bio: { type: String },
    languages: { type: [String], default: [] },
    qualifications: { type: [String], default: [] },
    specializations: { type: [String], default: [] },
    cities: { type: [String], default: [] },
    serviceAreas: { type: [String], default: [] },
    address: { type: String },
    idProofUrl: { type: String },
    certificates: { type: [String], default: [] },
    bankDetails: { type: bankDetailsSchema, default: {} },
    upiId: { type: String },
    commissionPercent: { type: Number, min: 0, max: 100, default: 0 },
    availabilityNotes: { type: String },
    verificationStatus: {
      type: String,
      enum: PANDIT_VERIFICATION_STATUSES,
      default: "application_pending",
    },
    accountStatus: { type: String, enum: ["active", "inactive"], default: "active" },
    featured: { type: Boolean, default: false },
    adminNotes: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    completedPoojas: { type: Number, default: 0 },
  },
  { timestamps: true },
);

panditSchema.index({ cities: 1, verificationStatus: 1 });

export type PanditDocument = InferSchemaType<typeof panditSchema>;
export const PanditModel = model("Pandit", panditSchema);
