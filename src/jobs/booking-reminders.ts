import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { formatPoojaDate } from "../lib/booking-events.js";
import { notifyCustomer } from "../lib/notify-customer.js";
import { BookingModel } from "../models/booking.model.js";
import { FestivalModel } from "../models/festival.model.js";
import { PoojaModel } from "../models/pooja.model.js";

// Booking reminders (in-app + push), checked every 15 minutes:
//   day before   — from 6:00 PM IST the day before the puja (confirmed bookings)
//   2 hours      — 2 h before the start time, when a time/muhurat is set
//   payment      — 24 h after creation if the booking is still unpaid
// Each one is "claimed" atomically by setting its sent-flag before sending,
// so it goes out once even if two API instances run the job. Windows are
// bounded so a first deploy doesn't remind every old booking at once.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const CONFIRMED_STATUSES = ["payment_received", "booking_confirmed", "pandit_assignment_pending", "pandit_assigned", "pandit_accepted"];

/** The puja's calendar date (stored as UTC midnight of the chosen day) at hh:mm IST, as a real instant. */
export function istInstant(poojaDate: Date, hours: number, minutes: number) {
  const d = new Date(poojaDate);
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return new Date(utcMidnight + hours * HOUR + minutes * 60 * 1000 - IST_OFFSET_MS);
}

/** Start time from "10:00 AM", "10:00 AM - 11:30 AM", "18:30" … (null if none). */
export function parseStartTime(poojaTime?: string | null) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(poojaTime ?? "");
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ampm = m[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { h, min, label: m[3] ? `${m[1]}:${m[2]} ${ampm}` : `${m[1]}:${m[2]}` };
}

const nameCache = new Map<string, string>();
async function poojaNameOf(b: { pooja?: unknown; festival?: unknown; package?: { name?: string | null } | null }) {
  const id = b.pooja ? String(b.pooja) : b.festival ? `f:${String(b.festival)}` : null;
  if (id && nameCache.has(id)) return nameCache.get(id)!;
  let name: string | undefined;
  if (b.pooja) name = (await PoojaModel.findById(b.pooja).select("name").lean())?.name;
  else if (b.festival) name = (await FestivalModel.findById(b.festival).select("name").lean())?.name;
  const result = name || b.package?.name || "puja";
  if (id) nameCache.set(id, result);
  return result;
}

type ReminderKind = "dayBeforeSentAt" | "twoHourSentAt" | "paymentSentAt";

/** Atomically marks a reminder as sent; true only for the instance that won. */
async function claim(bookingId: unknown, kind: ReminderKind) {
  const res = await BookingModel.updateOne(
    { _id: bookingId, $or: [{ [`reminders.${kind}`]: null }, { [`reminders.${kind}`]: { $exists: false } }] },
    { $set: { [`reminders.${kind}`]: new Date() } },
  );
  return res.modifiedCount === 1;
}

export async function runBookingReminders(now = new Date()) {
  const stats = { dayBefore: 0, twoHour: 0, payment: 0 };

  // ---- Day before (from 6 PM IST the previous day until the puja day begins)
  const windowStart = new Date(now.getTime() - DAY);
  const windowEnd = new Date(now.getTime() + 2 * DAY);
  const upcoming = await BookingModel.find({
    status: { $in: CONFIRMED_STATUSES },
    poojaDate: { $gte: windowStart, $lte: windowEnd },
    "reminders.dayBeforeSentAt": { $in: [null, undefined] },
  })
    .select("_id bookingId customer pooja festival package poojaDate poojaTime")
    .lean();
  for (const b of upcoming) {
    const sendFrom = new Date(istInstant(b.poojaDate, 18, 0).getTime() - DAY); // 6 PM IST the day before
    const pujaDayStart = istInstant(b.poojaDate, 0, 0);
    if (now < sendFrom || now >= pujaDayStart) continue;
    if (!(await claim(b._id, "dayBeforeSentAt"))) continue;
    const time = parseStartTime(b.poojaTime);
    await notifyCustomer({
      customer: String(b.customer),
      type: "booking_reminder",
      title: "Puja tomorrow",
      message: `Your ${await poojaNameOf(b)} is tomorrow${time ? ` at ${time.label}` : ""}.`,
      link: `/account/bookings/${String(b._id)}`,
      data: { event: "reminder_day_before", bookingId: b.bookingId, id: String(b._id) },
    });
    stats.dayBefore++;
  }

  // ---- 2 hours before (only when a start time is known)
  const today = await BookingModel.find({
    status: { $in: CONFIRMED_STATUSES },
    poojaDate: { $gte: new Date(now.getTime() - 2 * DAY), $lte: new Date(now.getTime() + DAY) },
    poojaTime: { $nin: [null, ""] },
    "reminders.twoHourSentAt": { $in: [null, undefined] },
  })
    .select("_id bookingId customer pooja festival package poojaDate poojaTime")
    .lean();
  for (const b of today) {
    const time = parseStartTime(b.poojaTime);
    if (!time) continue;
    const start = istInstant(b.poojaDate, time.h, time.min);
    if (now < new Date(start.getTime() - 2 * HOUR) || now >= start) continue;
    if (!(await claim(b._id, "twoHourSentAt"))) continue;
    await notifyCustomer({
      customer: String(b.customer),
      type: "booking_reminder",
      title: "Puja in 2 hours",
      message: `Your ${await poojaNameOf(b)} starts at ${time.label}. Pandit ji will reach on time.`,
      link: `/account/bookings/${String(b._id)}`,
      data: { event: "reminder_two_hours", bookingId: b.bookingId, id: String(b._id) },
    });
    stats.twoHour++;
  }

  // ---- Payment pending (24–48 h after creation, still unpaid)
  const unpaid = await BookingModel.find({
    status: "pending_payment",
    paymentStatus: "unpaid",
    createdAt: { $gte: new Date(now.getTime() - 2 * DAY), $lte: new Date(now.getTime() - DAY) },
    "reminders.paymentSentAt": { $in: [null, undefined] },
  })
    .select("_id bookingId customer pooja festival package poojaDate")
    .lean();
  for (const b of unpaid) {
    // No point asking for payment for a puja date that has already passed.
    if (b.poojaDate && istInstant(b.poojaDate, 23, 59) < now) continue;
    if (!(await claim(b._id, "paymentSentAt"))) continue;
    await notifyCustomer({
      customer: String(b.customer),
      type: "booking_reminder",
      title: "Complete your payment",
      message: `Complete payment to confirm your ${await poojaNameOf(b)}${b.poojaDate ? ` on ${formatPoojaDate(b.poojaDate)}` : ""}.`,
      link: `/account/bookings/${String(b._id)}`,
      data: { event: "reminder_payment", bookingId: b.bookingId, id: String(b._id) },
    });
    stats.payment++;
  }

  nameCache.clear();
  return stats;
}

export function startBookingReminderJob() {
  if (env.REMINDERS_ENABLED !== "true") {
    logger.info("Booking reminders disabled on this instance (REMINDERS_ENABLED=false)");
    return;
  }
  let running = false;
  cron.schedule("*/15 * * * *", async () => {
    if (running) return;
    running = true;
    try {
      const stats = await runBookingReminders();
      if (stats.dayBefore || stats.twoHour || stats.payment) logger.info("Booking reminders sent", stats);
    } catch (err) {
      logger.error("Booking reminder job failed", { message: err instanceof Error ? err.message : String(err) });
    } finally {
      running = false;
    }
  });
  logger.info("Booking reminder job scheduled (every 15 minutes)");
}
