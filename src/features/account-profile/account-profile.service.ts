import { ApiError } from "../../lib/api-error.js";
import { logger } from "../../config/logger.js";
import { BookingModel } from "../../models/booking.model.js";
import { CustomerModel } from "../../models/customer.model.js";
import { CustomerNotificationModel } from "../../models/customer-notification.model.js";
import { DeviceModel } from "../../models/device.model.js";
import { KundliRecordModel } from "../../models/kundli-record.model.js";
import { OrderModel } from "../../models/order.model.js";
import { WishlistModel } from "../../models/wishlist.model.js";

export async function getMyProfile(customerId: string) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");
  return customer;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  dob?: Date;
  gender?: "male" | "female" | "other";
  preferredLanguage?: string;
  city?: string;
  photo?: string;
}

export async function updateMyProfile(customerId: string, input: UpdateProfileInput) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");
  Object.assign(customer, input);
  await customer.save();
  return customer;
}

// Bookings that still need the customer (a puja yet to happen) and orders on their way.
const OPEN_BOOKING_STATUSES = [
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
  "pandit_accepted",
  "pandit_on_the_way",
  "pooja_started",
  "rescheduled",
  "refund_requested",
];
const OPEN_ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped"];

/**
 * Permanently deletes the customer's account: personal details, addresses,
 * wishlist, saved Kundlis, notifications and push devices are erased and the
 * account can no longer log in. Booking and order records are kept (with the
 * customer reference anonymised) because they are financial records. Logging
 * in again with the same number starts a brand-new, empty account.
 */
export async function deleteMyAccount(customerId: string) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer || customer.status === "deleted") throw ApiError.notFound("Account not found");

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const [openBookings, openOrders] = await Promise.all([
    BookingModel.countDocuments({ customer: customerId, status: { $in: OPEN_BOOKING_STATUSES }, poojaDate: { $gte: startOfToday } }),
    OrderModel.countDocuments({ customer: customerId, status: { $in: OPEN_ORDER_STATUSES } }),
  ]);
  if (openBookings > 0 || openOrders > 0) {
    const parts = [
      openBookings ? `${openBookings} upcoming puja booking${openBookings > 1 ? "s" : ""}` : "",
      openOrders ? `${openOrders} order${openOrders > 1 ? "s" : ""} in progress` : "",
    ].filter(Boolean);
    throw ApiError.badRequest(
      `You have ${parts.join(" and ")}. Please cancel ${openBookings + openOrders > 1 ? "them" : "it"} or wait until completed before deleting your account.`,
    );
  }

  await Promise.all([
    WishlistModel.deleteMany({ customer: customerId }),
    KundliRecordModel.deleteMany({ customer: customerId }),
    CustomerNotificationModel.deleteMany({ customer: customerId }),
    DeviceModel.deleteMany({ customer: customerId }),
  ]);

  const id = customer._id.toString();
  // Free the mobile number (unique index) so it can register again as a new account.
  customer.set({
    name: "Deleted User",
    mobile: `deleted-${id}`,
    status: "deleted",
    deletedAt: new Date(),
    addresses: [],
    adminNotes: customer.adminNotes,
  });
  for (const field of ["email", "dob", "gender", "preferredLanguage", "city", "photo", "lastLoginAt"] as const) {
    customer.set(field, undefined);
  }
  await customer.save();

  // Remove personal details from the snapshots kept on past bookings and orders.
  await Promise.all([
    BookingModel.updateMany({ customer: customerId }, { $set: { "customerSnapshot.name": "Deleted User", "customerSnapshot.mobile": "", "customerSnapshot.email": "" } }),
    OrderModel.updateMany({ customer: customerId }, { $set: { "customerSnapshot.name": "Deleted User", "customerSnapshot.mobile": "", "customerSnapshot.email": "" } }),
  ]);

  logger.info("Customer account deleted", { customerId: id });
}
