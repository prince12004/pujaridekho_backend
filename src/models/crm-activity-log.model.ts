import { Schema, model, type InferSchemaType } from "mongoose";

// Ported 1:1 from pujaridekhocrm/backend/server.js's activityLogSchema.
// Append-only call/voice-note history for a CrmInquiry.
const crmActivityLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    inquiryId: { type: String, required: true, index: true },
    salesPersonId: { type: String, required: true },
    note: { type: String, default: "" },
    // Short per-call voice note, base64-encoded — capped client-side at ~2
    // minutes, comfortably under MongoDB's 16MB document limit.
    audioBase64: { type: String, default: null },
    createdAt: { type: String, required: true },
    isConversion: { type: Boolean, default: false },
    isReassignment: { type: Boolean, default: false },
    isRejection: { type: Boolean, default: false },
  },
  { versionKey: false },
);

export type CrmActivityLogDocument = InferSchemaType<typeof crmActivityLogSchema>;
export const CrmActivityLogModel = model("CrmActivityLog", crmActivityLogSchema);
