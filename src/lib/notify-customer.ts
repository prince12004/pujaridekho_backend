import { CustomerNotificationModel } from "../models/customer-notification.model.js";
import type { CUSTOMER_NOTIFICATION_TYPES } from "../models/customer-notification.model.js";

export async function notifyCustomer(entry: {
  customer: string;
  type: (typeof CUSTOMER_NOTIFICATION_TYPES)[number];
  title: string;
  message: string;
  link?: string;
}) {
  await CustomerNotificationModel.create(entry);
}
