import { ApiError } from "../../lib/api-error.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { BookingModel } from "../../models/booking.model.js";

const UPCOMING_STATUSES = [
  "pending_payment",
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
  "pandit_accepted",
  "pandit_on_the_way",
  "pooja_started",
];
const COMPLETED_STATUSES = ["pooja_completed", "closed"];
const CANCELLED_STATUSES = ["cancelled", "refund_requested", "refunded"];

export async function listMyBookings(customerId: string, tab: string | undefined, page: number, limit: number) {
  const filter: Record<string, unknown> = { customer: customerId };
  if (tab === "upcoming") filter.status = { $in: UPCOMING_STATUSES };
  else if (tab === "completed") filter.status = { $in: COMPLETED_STATUSES };
  else if (tab === "cancelled") filter.status = { $in: CANCELLED_STATUSES };

  const [items, total] = await Promise.all([
    BookingModel.find(filter)
      .populate("pooja", "name slug featuredImage")
      .populate("festival", "name slug featuredImage")
      .populate("pandit", "fullName mobile photo verificationStatus")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    BookingModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMyBookingById(customerId: string, bookingId: string) {
  const booking = await BookingModel.findById(bookingId)
    .populate("pooja", "name slug featuredImage packages samagri")
    .populate("festival", "name slug featuredImage packages samagri")
    .populate("pandit", "fullName mobile photo verificationStatus experienceYears languages specializations rating");
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.customer.toString() !== customerId) {
    throw ApiError.forbidden("You do not have access to this booking");
  }
  return booking;
}

const ELIGIBLE_FOR_REQUEST_STATUSES = [
  "pending_payment",
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
];

export async function requestReschedule(
  customerId: string,
  bookingId: string,
  input: { requestedDate: Date; requestedTime?: string; reason?: string },
) {
  const booking = await getMyBookingById(customerId, bookingId);
  if (!ELIGIBLE_FOR_REQUEST_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest("This booking is not eligible for a reschedule request at its current stage");
  }

  booking.rescheduleRequest = {
    requestedDate: input.requestedDate,
    requestedTime: input.requestedTime,
    reason: input.reason,
    status: "requested",
    requestedAt: new Date(),
  } as never;
  await booking.save();

  await notifyCustomer({
    customer: customerId,
    type: "booking",
    title: "Reschedule request submitted",
    message: `Your reschedule request for booking ${booking.bookingId} has been sent to our team for review.`,
    link: `/account/bookings/${booking._id}`,
  });

  return booking;
}

export async function requestCancellation(customerId: string, bookingId: string, input: { reason: string; notes?: string }) {
  const booking = await getMyBookingById(customerId, bookingId);
  if (!ELIGIBLE_FOR_REQUEST_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest("This booking is not eligible for cancellation at its current stage");
  }

  booking.cancelRequest = {
    reason: input.reason,
    notes: input.notes,
    status: "requested",
    requestedAt: new Date(),
  } as never;
  await booking.save();

  await notifyCustomer({
    customer: customerId,
    type: "booking",
    title: "Cancellation request submitted",
    message: `Your cancellation request for booking ${booking.bookingId} has been sent to our team for review.`,
    link: `/account/bookings/${booking._id}`,
  });

  return booking;
}
