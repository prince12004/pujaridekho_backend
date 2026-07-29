import { ApiError } from "../../lib/api-error.js";
import { CustomerNotificationModel } from "../../models/customer-notification.model.js";

export async function listMyNotifications(customerId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const filter = { customer: customerId };
  const [items, total, unreadCount] = await Promise.all([
    CustomerNotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CustomerNotificationModel.countDocuments(filter),
    CustomerNotificationModel.countDocuments({ ...filter, read: false }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount };
}

export async function markMyNotificationRead(customerId: string, id: string) {
  const notification = await CustomerNotificationModel.findById(id);
  if (!notification || notification.customer.toString() !== customerId) {
    throw ApiError.notFound("Notification not found");
  }
  notification.read = true;
  await notification.save();
  return notification;
}

export async function markAllMyNotificationsRead(customerId: string) {
  await CustomerNotificationModel.updateMany({ customer: customerId, read: false }, { read: true });
}
