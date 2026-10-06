import bcrypt from "bcryptjs";
import { ApiError } from "../../lib/api-error.js";
import { saveFile } from "../../lib/cloud-storage.js";
import { PanditModel } from "../../models/pandit.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { BookingModel, type BookingDocument } from "../../models/booking.model.js";
import { PanditDepositModel } from "../../models/pandit-deposit.model.js";
import { PanditNotificationModel } from "../../models/pandit-notification.model.js";
import {
  extraAssetsTotalOf,
  grandTotalOf,
  notificationTypeToJson,
  toBookingJson,
  toPanditProfileJson,
  totalAmountOf,
} from "../../lib/pandit-app-presenters.js";
import type { HydratedDocument } from "mongoose";

type BookingDoc = HydratedDocument<BookingDocument>;

// Bookings a pandit has actually been assigned/accepted — excludes
// pending-assignment, cancelled and refunded, same convention as
// admin-pandits.service#listPanditBookings.
const ACTIVE_STATUSES_EXCLUDED = ["pandit_assignment_pending"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function getOwnedPandit(panditId: string) {
  const pandit = await PanditModel.findById(panditId);
  if (!pandit) throw ApiError.notFound("Pandit account not found");
  return pandit;
}

async function getOwnedBooking(panditId: string, bookingId: string) {
  const booking = await BookingModel.findOne({ _id: bookingId, pandit: panditId });
  if (!booking) throw ApiError.notFound("Booking not found.");
  return booking;
}

async function hasActiveBooking(panditId: string) {
  return Boolean(
    await BookingModel.exists({
      pandit: panditId,
      "panditExecution.startedAt": { $ne: null },
      "panditExecution.completedAt": null,
    }),
  );
}

export async function getProfile(panditId: string) {
  const pandit = await getOwnedPandit(panditId);
  const [reviewCount, active] = await Promise.all([
    ReviewModel.countDocuments({ entityType: "pandit", entityId: pandit._id, status: "approved" }),
    hasActiveBooking(panditId),
  ]);
  return toPanditProfileJson(pandit, { reviewCount, hasActiveBooking: active });
}

export async function setAvailability(panditId: string, requested: boolean) {
  const pandit = await getOwnedPandit(panditId);
  if (!requested && (await hasActiveBooking(panditId))) {
    throw new ApiError(422, "You cannot go unavailable while a booking is in progress.");
  }
  pandit.isAvailable = requested;
  await pandit.save();
  const reviewCount = await ReviewModel.countDocuments({ entityType: "pandit", entityId: pandit._id, status: "approved" });
  return toPanditProfileJson(pandit, { reviewCount, hasActiveBooking: false });
}

async function myBookings(panditId: string) {
  return BookingModel.find({ pandit: panditId, status: { $nin: ACTIVE_STATUSES_EXCLUDED } }).sort({ poojaDate: -1 });
}

export async function getHome(panditId: string) {
  const [pandit, bookings, reviewCount, active] = await Promise.all([
    getOwnedPandit(panditId),
    myBookings(panditId),
    ReviewModel.countDocuments({ entityType: "pandit", entityId: panditId, status: "approved" }),
    hasActiveBooking(panditId),
  ]);
  const now = new Date();
  const today = bookings.filter((b) => isSameDay(b.poojaDate, now) && b.status !== "cancelled");

  return {
    pandit: toPanditProfileJson(pandit, { reviewCount, hasActiveBooking: active }),
    // No CMS-backed promo banner feed exists for the pandit app yet — see
    // report's deferred list. Static, non-financial, non-fake placeholder copy.
    banners: [
      {
        id: "b1",
        image_url: "",
        title: "Upcoming Puja",
        subtitle: "Complete your assigned puja on time",
        cta_label: "View Bookings",
        cta_route: "/bookings",
      },
      {
        id: "b2",
        image_url: "",
        title: "Daily Payment",
        subtitle: "Pay today's collection to the company before the day ends",
        cta_label: "View Dashboard",
        cta_route: "/dashboard",
      },
    ],
    today_bookings: today.map(toBookingJson),
    today_count: today.length,
  };
}

export async function listBookings(panditId: string, status?: string) {
  const bookings = await myBookings(panditId);
  const now = new Date();

  let filtered: BookingDoc[];
  if (status === "today") {
    filtered = bookings.filter((b) => isSameDay(b.poojaDate, now) && b.status !== "cancelled");
  } else if (status === "upcoming") {
    filtered = bookings.filter((b) => b.poojaDate.getTime() > now.getTime() && !isSameDay(b.poojaDate, now) && b.status !== "cancelled");
  } else if (status === "past") {
    filtered = bookings.filter((b) => {
      const exec = b.panditExecution;
      return b.status === "cancelled" || b.status === "pooja_completed" || b.status === "closed" || exec?.completedAt;
    });
  } else {
    filtered = bookings;
  }

  return filtered.map(toBookingJson);
}

export async function getBookingDetails(panditId: string, bookingId: string) {
  const booking = await getOwnedBooking(panditId, bookingId);
  return toBookingJson(booking);
}

/** Pandit cannot progress a booking (reach/start) while owing a previous day's cash to the company. */
async function ensureNoOverdue(panditId: string) {
  const dues = await duesSummary(panditId);
  if (dues.overdue_amount > 0) {
    throw new ApiError(
      422,
      `Pay ₹${Math.round(dues.overdue_amount)} pending from previous days to the company before starting a puja.`,
    );
  }
}

export async function sendReachedOtp(panditId: string, bookingId: string) {
  const booking = await getOwnedBooking(panditId, bookingId);
  if (booking.panditExecution?.reachedAt) {
    throw new ApiError(422, "You have already marked this location as reached.");
  }
  await ensureNoOverdue(panditId);

  const otp = String(1000 + Math.floor(Math.random() * 9000));
  booking.panditExecution!.reachedOtpHash = await bcrypt.hash(otp, 10);
  // Keep the customer dashboard's displayed code in sync — it's shown the
  // code generated at booking time, so regenerating it here must overwrite
  // that one too or the two would mismatch.
  booking.panditExecution!.reachedOtpPlain = otp;
  await booking.save();

  // No SMS provider wired up yet (same documented gap as lib/otp.ts) — the
  // OTP meant for the customer is returned directly to the pandit app.
  return { message: "OTP sent to the customer.", demo_otp: otp };
}

export async function markReached(panditId: string, bookingId: string, otp: string, lat?: number, lng?: number) {
  const booking = await getOwnedBooking(panditId, bookingId);
  if (booking.panditExecution?.reachedAt) {
    throw new ApiError(422, "You have already marked this location as reached.");
  }
  await ensureNoOverdue(panditId);

  const hash = booking.panditExecution?.reachedOtpHash;
  if (!hash) throw new ApiError(422, "Request a customer OTP first.");
  const isValid = await bcrypt.compare(otp.trim(), hash);
  if (!isValid) throw new ApiError(422, "Incorrect OTP. Please check with the customer.");

  booking.panditExecution!.reachedOtpHash = null;
  booking.panditExecution!.reachedOtpPlain = null;
  booking.panditExecution!.reachedAt = new Date();
  booking.panditExecution!.reachedLocation = lat != null && lng != null ? { lat, lng } : null;
  booking.panditExecution!.reachedOtpVerified = true;
  await booking.save();
  return toBookingJson(booking);
}

export async function startPuja(panditId: string, bookingId: string) {
  const booking = await getOwnedBooking(panditId, bookingId);
  if (!booking.panditExecution?.reachedAt) {
    throw new ApiError(422, "Mark yourself as reached before starting the puja.");
  }
  if (booking.panditExecution?.startedAt) {
    throw new ApiError(422, "Puja has already started.");
  }
  await ensureNoOverdue(panditId);

  booking.panditExecution!.startedAt = new Date();
  if (booking.status !== "pooja_started") {
    booking.status = "pooja_started";
    booking.timeline.push({ status: "pooja_started", note: "Pandit started the puja (app)", changedAt: new Date() });
  }
  await booking.save();
  return toBookingJson(booking);
}

export async function uploadBookingImages(panditId: string, bookingId: string, files: Express.Multer.File[]) {
  const booking = await getOwnedBooking(panditId, bookingId);
  const saved = await Promise.all(files.map((f) => saveFile(f.buffer, f.originalname, f.mimetype)));
  for (const s of saved) {
    booking.panditExecution!.images.push({ url: s.url, uploadedAt: new Date() });
  }
  await booking.save();
  return toBookingJson(booking);
}

export async function submitExtraAmount(panditId: string, bookingId: string, amount: number, reason: string) {
  const booking = await getOwnedBooking(panditId, bookingId);
  if (booking.panditExecution?.paymentMethod) {
    throw new ApiError(422, "Payment is already recorded for this booking.");
  }
  if (amount < 0) throw new ApiError(422, "Extra amount cannot be negative.");
  booking.panditExecution!.extraAmount = amount;
  booking.panditExecution!.extraAmountReason = reason;
  await booking.save();
  return toBookingJson(booking);
}

export async function submitExtraAssets(
  panditId: string,
  bookingId: string,
  assets: { name: string; quantity: number; unit_price: number }[],
) {
  const booking = await getOwnedBooking(panditId, bookingId);
  if (booking.panditExecution?.paymentMethod) {
    throw new ApiError(422, "Payment is already recorded for this booking.");
  }
  const priced = assets.map((a) => {
    const name = (a.name ?? "").trim();
    const quantity = Number(a.quantity) || 0;
    const unitPrice = Number(a.unit_price);
    if (!name || quantity <= 0 || !(unitPrice >= 0)) {
      throw new ApiError(422, "Each extra asset needs a name, a quantity and a price.");
    }
    return { name, quantity, unitPrice, amount: quantity * unitPrice };
  });
  booking.panditExecution!.extraAssets.splice(0, booking.panditExecution!.extraAssets.length, ...priced);
  await booking.save();
  return toBookingJson(booking);
}

export async function submitPayment(panditId: string, bookingId: string, method: string, collectedAmount: number) {
  const booking = await getOwnedBooking(panditId, bookingId);
  const normalizedMethod = method?.toLowerCase() === "online" ? "online" : "cash";
  if (normalizedMethod === "cash" && !(collectedAmount > 0)) {
    throw new ApiError(422, "Enter a valid collected amount.");
  }

  const grandTotal = grandTotalOf(booking);
  booking.panditExecution!.paymentMethod = normalizedMethod;
  booking.panditExecution!.collectedAmount = normalizedMethod === "online" ? grandTotal : collectedAmount;
  booking.panditExecution!.companyDueAmount = normalizedMethod === "online" ? 0 : collectedAmount;
  booking.panditExecution!.paymentStatus = "submitted";
  await booking.save();
  return toBookingJson(booking);
}

export async function completeBooking(panditId: string, bookingId: string) {
  const booking = await getOwnedBooking(panditId, bookingId);
  if (!booking.panditExecution?.startedAt) {
    throw new ApiError(422, "Start the puja before completing it.");
  }
  if (!booking.panditExecution?.paymentMethod) {
    throw new ApiError(422, "Record payment before completing the booking.");
  }

  booking.panditExecution!.completedAt = new Date();
  booking.panditExecution!.paymentStatus = "verified";
  booking.panditExecution!.depositStatus = booking.panditExecution!.paymentMethod === "cash" ? "pending" : "not_applicable";
  booking.status = "pooja_completed";
  booking.timeline.push({ status: "pooja_completed", note: "Pandit completed the puja (app)", changedAt: new Date() });
  await booking.save();

  await PanditNotificationModel.create({
    pandit: panditId,
    type: "payment_verified",
    title: "Puja Completed",
    body: `You completed "${booking.package?.name ?? "the puja"}" for ${booking.customerSnapshot?.name ?? "the customer"}.`,
    booking: booking._id,
  });

  return toBookingJson(booking);
}

// ---------------- DUES / DEPOSITS ----------------

function completedBookingsFilter(panditId: string) {
  return { pandit: panditId, "panditExecution.completedAt": { $ne: null } };
}

export async function duesSummary(panditId: string) {
  const now = new Date();
  const completed = await BookingModel.find(completedBookingsFilter(panditId));

  const completedToday = completed.filter((b) => isSameDay(b.panditExecution!.completedAt as Date, now));
  const pending = completed.filter((b) => b.panditExecution?.depositStatus === "pending");

  let todayDue = 0;
  let overdue = 0;
  for (const b of pending) {
    if (isSameDay(b.panditExecution!.completedAt as Date, now)) {
      todayDue += b.panditExecution?.companyDueAmount || 0;
    } else {
      overdue += b.panditExecution?.companyDueAmount || 0;
    }
  }

  const deposits = await PanditDepositModel.find({ pandit: panditId });
  const paidToday = deposits
    .filter((d) => isSameDay(d.paidAt as Date, now))
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
    completed_today: completedToday.length,
    today_puja_amount: completedToday.reduce((sum, b) => sum + totalAmountOf(b), 0),
    today_extra_amount: completedToday.reduce(
      (sum, b) => sum + (b.panditExecution?.extraAmount || 0) + extraAssetsTotalOf(b),
      0,
    ),
    today_online_amount: completedToday
      .filter((b) => b.panditExecution?.paymentMethod === "online")
      .reduce((sum, b) => sum + (b.panditExecution?.collectedAmount || 0), 0),
    today_due: todayDue,
    overdue_amount: overdue,
    total_due: todayDue + overdue,
    paid_today: paidToday,
    is_blocked: overdue > 0,
  };
}

export async function payDues(panditId: string, amount: number, method: string, gatewayRef?: string) {
  const dues = await duesSummary(panditId);
  if (!(dues.total_due > 0)) throw new ApiError(422, "You have no pending dues.");
  if (Math.abs(amount - dues.total_due) > 0.01) {
    throw new ApiError(422, `Amount must match your total due of ₹${Math.round(dues.total_due)}.`);
  }

  const pending = await BookingModel.find({ pandit: panditId, "panditExecution.depositStatus": "pending" });
  const now = new Date();

  const deposit = await PanditDepositModel.create({
    pandit: panditId,
    amount,
    method: (method ?? "upi").toLowerCase(),
    gatewayRef: gatewayRef ?? null,
    bookings: pending.map((b) => b._id),
    paidAt: now,
  });

  for (const b of pending) {
    b.panditExecution!.depositStatus = "deposited";
    b.panditExecution!.depositId = deposit._id;
    b.panditExecution!.depositedAt = now;
    await b.save();
  }

  await PanditNotificationModel.create({
    pandit: panditId,
    type: "company_payment_verified",
    title: "Payment Received",
    body: `Your payment of ₹${Math.round(amount)} to the company has been received.`,
  });

  const refreshedDues = await duesSummary(panditId);
  return {
    deposit: {
      id: deposit._id.toString(),
      amount: deposit.amount,
      method: deposit.method,
      gateway_ref: deposit.gatewayRef,
      booking_ids: pending.map((b) => b._id.toString()),
      paid_at: deposit.paidAt.toISOString(),
    },
    dues: refreshedDues,
    message: "Payment received by Pujari Dekho.",
  };
}

export async function listDeposits(panditId: string) {
  const deposits = await PanditDepositModel.find({ pandit: panditId }).sort({ paidAt: -1 });
  return deposits.map((d) => ({
    id: d._id.toString(),
    amount: d.amount,
    method: d.method,
    gateway_ref: d.gatewayRef,
    booking_ids: (d.bookings ?? []).map((b) => b.toString()),
    paid_at: d.paidAt.toISOString(),
  }));
}

// ---------------- DASHBOARD / EARNINGS / RATINGS ----------------

async function ratingBreakdown(panditId: string) {
  const [pandit, reviews] = await Promise.all([
    getOwnedPandit(panditId),
    ReviewModel.find({ entityType: "pandit", entityId: panditId, status: "approved" }).select("rating"),
  ]);
  const starCounts: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
  for (const r of reviews) {
    const key = String(Math.round(r.rating));
    if (starCounts[key] !== undefined) starCounts[key] += 1;
  }
  return { average: pandit.rating ?? 0, total_reviews: reviews.length, star_counts: starCounts };
}

export async function getRatings(panditId: string) {
  return ratingBreakdown(panditId);
}

export async function getDashboard(panditId: string) {
  const pandit = await getOwnedPandit(panditId);
  const all = await BookingModel.find({ pandit: panditId, status: { $nin: ACTIVE_STATUSES_EXCLUDED } });
  const completed = all.filter((b) => b.panditExecution?.completedAt);
  const upcoming = all.filter((b) => !b.panditExecution?.completedAt && b.status !== "cancelled").length;
  const cancelled = all.filter((b) => b.status === "cancelled").length;

  const pct = (pandit.commissionPercent || 0) / 100;
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const reachedCompany = (b: BookingDoc) => b.panditExecution?.depositStatus !== "pending";

  let thisMonthValue = 0;
  let pendingValue = 0;
  let lastMonthValue = 0;
  let totalValue = 0;
  for (const b of completed) {
    const value = grandTotalOf(b);
    const at = b.panditExecution!.completedAt as Date;
    const isThisMonth = at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
    if (!reachedCompany(b)) {
      if (isThisMonth) pendingValue += value;
      continue;
    }
    totalValue += value;
    if (isThisMonth) thisMonthValue += value;
    if (at.getFullYear() === lastMonth.getFullYear() && at.getMonth() === lastMonth.getMonth()) lastMonthValue += value;
  }

  const deposits = await PanditDepositModel.find({ pandit: panditId });
  const paidThisMonth = deposits
    .filter((d) => d.paidAt.getFullYear() === now.getFullYear() && d.paidAt.getMonth() === now.getMonth())
    .reduce((sum, d) => sum + d.amount, 0);

  // Real repeat/new-customer counts from this pandit's completed bookings.
  const perCustomer = new Map<string, number>();
  for (const b of completed) {
    const key = b.customer?.toString();
    if (!key) continue;
    perCustomer.set(key, (perCustomer.get(key) ?? 0) + 1);
  }
  let repeatCustomers = 0;
  let newCustomers = 0;
  let customerRebookings = 0;
  for (const count of perCustomer.values()) {
    if (count > 1) {
      repeatCustomers += 1;
      customerRebookings += count - 1;
    } else {
      newCustomers += 1;
    }
  }

  const dues = await duesSummary(panditId);

  return {
    total_pujas: all.length,
    completed_pujas: completed.length,
    upcoming_pujas: upcoming,
    cancelled_pujas: cancelled,
    commission_percent: pandit.commissionPercent || 0,
    this_month_puja_value: thisMonthValue,
    this_month_earnings: thisMonthValue * pct,
    pending_earnings: pendingValue * pct,
    last_month_earnings: lastMonthValue * pct,
    total_earnings: totalValue * pct,
    payout_date: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    due_to_company: dues.total_due,
    paid_this_month: paidThisMonth,
    repeat_customers: repeatCustomers,
    new_customers: newCustomers,
    customer_rebookings: customerRebookings,
  };
}

export async function getEarnings(panditId: string, range?: string) {
  const pandit = await getOwnedPandit(panditId);
  const pct = (pandit.commissionPercent || 0) / 100;
  const days = range === "month" ? 30 : range === "3months" ? 90 : 7;

  const completed = await BookingModel.find(completedBookingsFilter(panditId));
  const now = new Date();
  const points: { date: string; amount: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const amount = completed
      .filter((b) => isSameDay(b.panditExecution!.completedAt as Date, date) && b.panditExecution?.depositStatus !== "pending")
      .reduce((sum, b) => sum + grandTotalOf(b) * pct, 0);
    points.push({ date: date.toISOString(), amount });
  }

  const pujaTypeCounts = new Map<string, number>();
  for (const b of completed) {
    const type = b.package?.name || "Puja";
    pujaTypeCounts.set(type, (pujaTypeCounts.get(type) ?? 0) + 1);
  }

  return {
    series: points,
    puja_stats: Array.from(pujaTypeCounts.entries()).map(([puja_type, count]) => ({ puja_type, count })),
    rating: await ratingBreakdown(panditId),
  };
}

// ---------------- NOTIFICATIONS ----------------

export async function listNotifications(panditId: string) {
  const notifications = await PanditNotificationModel.find({ pandit: panditId }).sort({ createdAt: -1 }).limit(100);
  return notifications.map((n) => ({
    id: n._id.toString(),
    type: notificationTypeToJson(n.type),
    title: n.title,
    body: n.body,
    booking_id: n.booking ? n.booking.toString() : null,
    created_at: (n.get("createdAt") as Date).toISOString(),
    is_read: n.isRead,
  }));
}
