import { Schema, model, type InferSchemaType } from "mongoose";

export const NOTIFICATION_TYPES = ["booking", "consultation", "order", "pandit_application", "support"] as const;

const notificationSchema = new Schema(
  {
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model("Notification", notificationSchema);
