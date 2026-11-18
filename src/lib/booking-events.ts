import { logger } from "../config/logger.js";
import { FestivalModel } from "../models/festival.model.js";
import { PanditModel } from "../models/pandit.model.js";
import { PoojaModel } from "../models/pooja.model.js";
import { notifyCustomer } from "./notify-customer.js";

// Customer notifications (in-app + push) for every booking and order event,
// with the wording agreed with the app team. Links use website paths; the app
// maps them to its own screens. Never throws — a notification problem must
// not fail the booking / order operation that triggered it.

export type BookingEvent =
  | "created"
  | "payment_received"
  | "payment_failed"
  | "confirmed"
  | "pandit_assigned"
  | "pandit_on_the_way"
  | "pooja_started"
  | "pooja_completed"
  | "cancel_approved"
  | "cancel_rejected"
  | "reschedule_approved"
  | "reschedule_rejected"
  | "cancelled_by_admin";

interface BookingLike {
  _id: unknown;
  bookingId: string;
  customer: unknown;
  pooja?: unknown;
  festival?: unknown;
  pandit?: unknown;
  package?: { name?: string | null } | null;
  poojaDate?: Date | null;
  poojaTime?: string | null;
  paymentStatus?: string | null;
}

function refId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) return String((value as { _id: unknown })._id);
  return String(value);
}

function populatedName(value: unknown, key: "name" | "fullName") {
  if (value && typeof value === "object" && key in (value as Record<string, unknown>)) {
    return (value as Record<string, string>)[key];
  }
  return undefined;
}

export function formatPoojaDate(date?: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

async function poojaName(booking: BookingLike) {
  const fromRef = populatedName(booking.pooja, "name") ?? populatedName(booking.festival, "name");
  if (fromRef) return fromRef;
  const poojaId = refId(booking.pooja);
  if (poojaId) {
    const p = await PoojaModel.findById(poojaId).select("name").lean();
    if (p?.name) return p.name;
  }
  const festivalId = refId(booking.festival);
  if (festivalId) {
    const f = await FestivalModel.findById(festivalId).select("name").lean();
    if (f?.name) return f.name;
  }
  return booking.package?.name || "puja";
}

async function panditName(booking: BookingLike) {
  const populated = populatedName(booking.pandit, "fullName");
  if (populated) return populated;
  const id = refId(booking.pandit);
  if (!id) return "Your pandit ji";
  const p = await PanditModel.findById(id).select("fullName").lean();
  return p?.fullName ? `Pandit ${p.fullName.replace(/^pandit\s+/i, "")}` : "Your pandit ji";
}

function refundNote(booking: BookingLike) {
  return booking.paymentStatus === "paid" || booking.paymentStatus === "partially_paid"
    ? "Any refund due will be processed by our team."
    : "";
}

export async function notifyBookingEvent(
  booking: BookingLike,
  event: BookingEvent,
  extra: { amount?: number; newDate?: Date | null } = {},
) {
  try {
    const customer = refId(booking.customer);
    if (!customer) return;
    const pooja = await poojaName(booking);
    const date = formatPoojaDate(booking.poojaDate);
    const id = booking.bookingId;
    let title = "";
    let message = "";

    switch (event) {
      case "created":
        title = "Booking created";
        message = `Complete payment to confirm your ${pooja} (${id}).`;
        break;
      case "payment_received":
        title = "Payment received";
        message = `₹${(extra.amount ?? 0).toLocaleString("en-IN")} received. Your ${pooja}${date ? ` on ${date}` : ""} is confirmed.`;
        break;
      case "payment_failed":
        title = "Payment failed";
        message = `Payment for ${id} didn't go through. Tap to try again.`;
        break;
      case "confirmed":
        title = "Booking confirmed";
        message = `Your ${pooja}${date ? ` on ${date}` : ""} is confirmed.`;
        break;
      case "pandit_assigned":
        title = "Pandit assigned";
        message = `${await panditName(booking)} will perform your ${pooja}.`;
        break;
      case "pandit_on_the_way":
        title = "Pandit ji is on the way";
        message = `${await panditName(booking)} is on the way for your ${pooja}.`;
        break;
      case "pooja_started":
        title = "Puja started";
        message = `Your ${pooja} has started. 🙏`;
        break;
      case "pooja_completed":
        title = "Puja completed";
        message = "Thank you! Tap to rate your experience.";
        break;
      case "cancel_approved":
        title = "Booking cancelled";
        message = `Your booking ${id} is cancelled. ${refundNote(booking)}`.trim();
        break;
      case "cancel_rejected":
        title = "Cancellation not approved";
        message = `Our team will call you about ${id}.`;
        break;
      case "reschedule_approved":
        title = "Booking rescheduled";
        message = `Your ${pooja} is moved to ${formatPoojaDate(extra.newDate ?? booking.poojaDate)}.`;
        break;
      case "reschedule_rejected":
        title = "Reschedule not approved";
        message = `Your ${pooja} stays on ${date}.`;
        break;
      case "cancelled_by_admin":
        title = "Booking cancelled";
        message = `${id} was cancelled. ${refundNote(booking)}`.trim();
        break;
    }

    await notifyCustomer({
      customer,
      type: "booking",
      title,
      message,
      link: `/account/bookings/${String(booking._id)}`,
      data: { event, bookingId: id, id: String(booking._id) },
    });
  } catch (err) {
    logger.error("Booking notification failed", { event, bookingId: booking.bookingId, message: err instanceof Error ? err.message : String(err) });
  }
}

/** Status changes made by admin, CRM or the pandit app → the matching notification. */
const STATUS_EVENTS: Partial<Record<string, BookingEvent>> = {
  booking_confirmed: "confirmed",
  pandit_assigned: "pandit_assigned",
  pandit_on_the_way: "pandit_on_the_way",
  pooja_started: "pooja_started",
  pooja_completed: "pooja_completed",
  cancelled: "cancelled_by_admin",
};

export function hasStatusNotification(status: string) {
  return status in STATUS_EVENTS;
}

export async function onBookingStatusChange(booking: BookingLike, from: string | null | undefined, to: string) {
  if (from === to) return;
  const event = STATUS_EVENTS[to];
  if (event) await notifyBookingEvent(booking, event);
}

// ---------------------------------------------------------------- Orders

export type OrderEvent = "confirmed" | "shipped" | "delivered";

export async function notifyOrderEvent(order: { _id: unknown; orderId: string; customer?: unknown }, event: OrderEvent) {
  try {
    const customer = refId(order.customer);
    if (!customer) return;
    const copy = {
      confirmed: { title: "Order confirmed", message: `Order ${order.orderId} is confirmed.` },
      shipped: { title: "Order shipped", message: `Your samagri order ${order.orderId} is on the way.` },
      delivered: { title: "Order delivered", message: `Order ${order.orderId} was delivered.` },
    }[event];
    await notifyCustomer({
      customer,
      type: "order",
      ...copy,
      link: `/account/orders/${String(order._id)}`,
      data: { event, orderId: order.orderId, id: String(order._id) },
    });
  } catch (err) {
    logger.error("Order notification failed", { event, orderId: order.orderId, message: err instanceof Error ? err.message : String(err) });
  }
}

const ORDER_STATUS_EVENTS: Partial<Record<string, OrderEvent>> = {
  confirmed: "confirmed",
  shipped: "shipped",
  delivered: "delivered",
};

export async function onOrderStatusChange(order: { _id: unknown; orderId: string; customer?: unknown }, from: string | null | undefined, to: string) {
  if (from === to) return;
  const event = ORDER_STATUS_EVENTS[to];
  if (event) await notifyOrderEvent(order, event);
}
