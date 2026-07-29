import { ApiError } from "../../lib/api-error.js";
import { NotificationModel } from "../../models/notification.model.js";

export async function listNotifications(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total, unreadCount] = await Promise.all([
    NotificationModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    NotificationModel.countDocuments(),
    NotificationModel.countDocuments({ read: false }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount };
}

export async function markNotificationRead(id: string) {
  const notification = await NotificationModel.findById(id);
  if (!notification) throw ApiError.notFound("Notification not found");
  notification.read = true;
  await notification.save();
  return notification;
}

export async function markAllNotificationsRead() {
  await NotificationModel.updateMany({ read: false }, { read: true });
}
