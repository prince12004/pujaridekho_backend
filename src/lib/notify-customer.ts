import { CustomerNotificationModel } from "../models/customer-notification.model.js";
import type { CUSTOMER_NOTIFICATION_TYPES } from "../models/customer-notification.model.js";
import { logger } from "../config/logger.js";
import { sendPushToCustomer } from "./push.js";

/**
 * The one place customer notifications are created:
 *   1) saved as an in-app notification (app + website "Notifications")
 *   2) pushed to every device the customer has registered (FCM)
 * A push failure never fails the caller — it is sent in the background and
 * only logged.
 */
export async function notifyCustomer(entry: {
  customer: string;
  type: (typeof CUSTOMER_NOTIFICATION_TYPES)[number];
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
  /** Skip the push (in-app only). */
  push?: boolean;
}) {
  const { data, push = true, ...record } = entry;
  await CustomerNotificationModel.create(record);
  if (!push) return;
  void sendPushToCustomer(String(entry.customer), {
    type: entry.type,
    title: entry.title,
    message: entry.message,
    link: entry.link,
    data,
  }).catch((err) => logger.error("Push failed", { message: err instanceof Error ? err.message : String(err) }));
}
