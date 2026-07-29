import { NotificationModel, type NOTIFICATION_TYPES } from "../models/notification.model.js";

export async function createNotification(entry: {
  type: (typeof NOTIFICATION_TYPES)[number];
  title: string;
  message: string;
  link?: string;
}) {
  await NotificationModel.create(entry);
}
