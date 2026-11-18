import { Schema, model, type InferSchemaType } from "mongoose";

// A customer's phone registered for push notifications (FCM token). One
// document per token; a token moves to whichever customer registered it last.
const deviceSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    token: { type: String, required: true, unique: true, trim: true },
    platform: { type: String, enum: ["android", "ios"], required: true },
    appVersion: { type: String, trim: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

deviceSchema.index({ customer: 1 });

export type DeviceDocument = InferSchemaType<typeof deviceSchema>;
export const DeviceModel = model("Device", deviceSchema);
