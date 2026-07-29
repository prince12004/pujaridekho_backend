import { Schema, model, type InferSchemaType } from "mongoose";

// Customer-facing notifications — distinct from models/notification.model.ts,
// which notifies ADMINS of new customer activity. This is the reverse
// direction: system events notifying a specific customer.
export const CUSTOMER_NOTIFICATION_TYPES = [
  "booking",
  "payment",
  "pandit_assignment",
  "booking_reminder",
  "order",
  "consultation",
  "offer",
  "system",
] as const;

const customerNotificationSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    type: { type: String, enum: CUSTOMER_NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

customerNotificationSchema.index({ customer: 1, createdAt: -1 });

export type CustomerNotificationDocument = InferSchemaType<typeof customerNotificationSchema>;
export const CustomerNotificationModel = model("CustomerNotification", customerNotificationSchema);
