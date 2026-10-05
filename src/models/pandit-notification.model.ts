import { Schema, model, type InferSchemaType } from "mongoose";

export const PANDIT_NOTIFICATION_TYPES = [
  "new_booking",
  "booking_time_changed",
  "booking_cancelled",
  "payment_verified",
  "payment_rejected",
  "company_payment_due",
  "company_payment_verified",
  "message",
  "general",
] as const;

// In-app notifications feed for pujaripandit_app. Created by pandit-app
// flows (assignment, deposit settlement, etc.) — no push-notification
// provider is wired up yet, this is purely the in-app feed.
const panditNotificationSchema = new Schema(
  {
    pandit: { type: Schema.Types.ObjectId, ref: "Pandit", required: true, index: true },
    type: { type: String, enum: PANDIT_NOTIFICATION_TYPES, default: "general" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

panditNotificationSchema.index({ pandit: 1, createdAt: -1 });

export type PanditNotificationDocument = InferSchemaType<typeof panditNotificationSchema>;
export const PanditNotificationModel = model("PanditNotification", panditNotificationSchema);
