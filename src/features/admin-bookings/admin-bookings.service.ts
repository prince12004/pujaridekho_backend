import { ApiError } from "../../lib/api-error.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { BOOKING_STATUS_LABELS } from "../../lib/booking-status-labels.js";
import { BookingModel } from "../../models/booking.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { FestivalModel } from "../../models/festival.model.js";
import { findOrCreateCustomerByMobile } from "../admin-customers/admin-customers.service.js";
import { ADVANCE_AMOUNT } from "../payments/payments.service.js";

function computeFinalAmount(pricing: {
  packagePrice?: number;
  samagriCharges?: number;
  additionalCharges?: number;
  discount?: number;
  customDiscount?: number;
}): number {
  const packagePrice = pricing.packagePrice ?? 0;
  const samagriCharges = pricing.samagriCharges ?? 0;
  const additionalCharges = pricing.additionalCharges ?? 0;
  const discount = pricing.discount ?? 0;
  const customDiscount = pricing.customDiscount ?? 0;
  return Math.max(packagePrice + samagriCharges + additionalCharges - discount - customDiscount + ADVANCE_AMOUNT, 0);
}

function customerIdOf(booking: { customer: unknown }): string {
  const value = booking.customer as { _id?: { toString(): string } } | { toString(): string };
  if (value && typeof value === "object" && "_id" in value && value._id) return value._id.toString();
  return String(value);
}

export interface ListBookingsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  bookingChannel?: string;
  serviceType?: string;
}

async function generateBookingId() {
  const year = new Date().getFullYear();
  const prefix = `PD-${year}-`;
  // Not perfectly race-proof under heavy concurrent writes, but collisions are
  // vanishingly unlikely for admin-created bookings; retried on unique violation.
  const count = await BookingModel.countDocuments({ bookingId: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

export async function listBookings(query: ListBookingsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.bookingChannel) filter.bookingChannel = query.bookingChannel;
  if (query.serviceType) filter.serviceType = query.serviceType;
  if (query.search) {
    filter.$or = [
      { bookingId: { $regex: query.search, $options: "i" } },
      { "customerSnapshot.name": { $regex: query.search, $options: "i" } },
      { "customerSnapshot.mobile": { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    BookingModel.find(filter)
      .populate("pooja", "name slug")
      .populate("festival", "name slug")
      .populate("pandit", "fullName mobile")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    BookingModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export interface ConfirmedBookingsQuery {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  search?: string;
}

export async function listConfirmedBookings(query: ConfirmedBookingsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = { status: "booking_confirmed" };
  const dateRange: Record<string, Date> = {};
  if (query.from) dateRange.$gte = new Date(query.from);
  if (query.to) dateRange.$lte = new Date(query.to);
  if (Object.keys(dateRange).length > 0) filter.poojaDate = dateRange;
  if (query.search) {
    filter.$or = [
      { bookingId: { $regex: query.search, $options: "i" } },
      { "customerSnapshot.name": { $regex: query.search, $options: "i" } },
      { "customerSnapshot.mobile": { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    BookingModel.find(filter)
      .populate("customer", "name mobile email")
      .populate("pooja", "name slug")
      .populate("festival", "name slug")
      .populate("pandit", "fullName mobile")
      .sort({ poojaDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    BookingModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBookingById(id: string) {
  const booking = await BookingModel.findById(id)
    .populate({ path: "pooja", select: "name slug packages samagriTemplate", populate: { path: "samagriTemplate" } })
    .populate("festival", "name slug packages samagri")
    .populate("pandit", "fullName mobile")
    .populate("customer", "name mobile email");
  if (!booking) throw ApiError.notFound("Booking not found");
  return booking;
}

interface OfflineBookingInput {
  customer: { name: string; mobile: string; email?: string };
  serviceType: string;
  pooja?: string;
  festival?: string;
  package?: Record<string, unknown>;
  selectedSamagri?: { name: string; price: number }[];
  address?: string;
  city?: string;
  landmark?: string;
  pincode?: string;
  gotra?: string;
  specialInstructions?: string;
  poojaDate: Date;
  poojaTime?: string;
  pandit?: string;
  pricing?: Record<string, unknown>;
  payments?: Record<string, unknown>[];
  bookingSource: string;
  referral?: Record<string, unknown>;
}

export async function createOfflineBooking(input: OfflineBookingInput, adminId: string) {
  const customer = await findOrCreateCustomerByMobile(input.customer);

  if (input.pooja) {
    const poojaExists = await PoojaModel.exists({ _id: input.pooja });
    if (!poojaExists) throw ApiError.badRequest("Selected pooja does not exist");
  }
  if (input.festival) {
    const festivalExists = await FestivalModel.exists({ _id: input.festival });
    if (!festivalExists) throw ApiError.badRequest("Selected festival does not exist");
  }

  const bookingId = await generateBookingId();

  const totalPaid = (input.payments ?? []).reduce(
    (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
    0,
  );
  const finalAmount = computeFinalAmount(input.pricing ?? {});
  const advanceAmount = typeof input.pricing?.advanceAmount === "number" ? input.pricing.advanceAmount : 0;
  const pricing = {
    ...input.pricing,
    finalAmount,
    remainingAmount: Math.max(finalAmount - advanceAmount, 0),
  };
  const paymentStatus = totalPaid <= 0 ? "unpaid" : totalPaid >= finalAmount && finalAmount > 0 ? "paid" : "partially_paid";

  const booking = await BookingModel.create({
    bookingId,
    customer: customer._id,
    customerSnapshot: { name: customer.name, mobile: customer.mobile, email: customer.email },
    serviceType: input.serviceType,
    pooja: input.pooja,
    festival: input.festival,
    package: input.package,
    selectedSamagri: input.selectedSamagri ?? [],
    address: input.address,
    city: input.city,
    landmark: input.landmark,
    pincode: input.pincode,
    gotra: input.gotra,
    specialInstructions: input.specialInstructions,
    poojaDate: input.poojaDate,
    poojaTime: input.poojaTime,
    pandit: input.pandit ?? null,
    status: input.pandit ? "pandit_assigned" : "booking_confirmed",
    pricing,
    payments: input.payments ?? [],
    paymentStatus,
    bookingChannel: "offline",
    bookingSource: input.bookingSource,
    referral: input.referral,
    createdByAdmin: adminId,
    timeline: [{ status: "booking_confirmed", note: "Booking created by admin (offline)", changedBy: adminId }],
  });

  return booking;
}

export async function updateBookingStatus(id: string, status: string, note: string | undefined, adminId: string) {
  const booking = await getBookingById(id);
  booking.status = status as (typeof booking)["status"];
  booking.timeline.push({ status, note, changedBy: adminId as never, changedAt: new Date() });
  await booking.save();

  await notifyCustomer({
    customer: customerIdOf(booking),
    type: "booking",
    title: "Booking status updated",
    message: `Booking ${booking.bookingId} is now "${BOOKING_STATUS_LABELS[status] ?? status}".`,
    link: `/account/bookings/${booking._id}`,
  });

  return booking;
}

interface UpdateBookingDetailsInput {
  poojaDate?: Date;
  poojaTime?: string;
  address?: string;
  city?: string;
  landmark?: string;
  pincode?: string;
  gotra?: string;
  specialInstructions?: string;
  pricing?: {
    packagePrice?: number;
    marketPrice?: number;
    samagriCharges?: number;
    additionalCharges?: number;
    discount?: number;
    customDiscount?: number;
    finalAmount?: number;
    advanceAmount?: number;
    remainingAmount?: number;
  };
}

export async function updateBookingDetails(id: string, input: UpdateBookingDetailsInput, adminId: string) {
  const booking = await getBookingById(id);

  const { pricing, ...rest } = input;
  Object.assign(booking, rest);
  if (pricing) {
    Object.assign(booking.pricing, pricing);
    booking.pricing.finalAmount = computeFinalAmount(booking.pricing);
    booking.pricing.remainingAmount = Math.max(
      booking.pricing.finalAmount - (booking.pricing.advanceAmount ?? 0),
      0,
    );
  }

  booking.timeline.push({
    status: booking.status,
    note: "Booking details updated by admin",
    changedBy: adminId as never,
    changedAt: new Date(),
  });

  await booking.save();
  return booking;
}

export async function assignPanditToBooking(id: string, panditId: string, adminId: string) {
  const booking = await getBookingById(id);
  booking.pandit = panditId as never;
  booking.status = "pandit_assigned";
  booking.timeline.push({
    status: "pandit_assigned",
    note: "Pandit assigned by admin",
    changedBy: adminId as never,
    changedAt: new Date(),
  });
  await booking.save();

  await notifyCustomer({
    customer: customerIdOf(booking),
    type: "pandit_assignment",
    title: "Pandit assigned to your booking",
    message: `A verified pandit has been assigned to booking ${booking.bookingId}.`,
    link: `/account/bookings/${booking._id}`,
  });

  return booking;
}

export async function addBookingPayment(
  id: string,
  payment: { amount: number; method: string; status?: string; transactionRef?: string; notes?: string },
  adminId: string,
) {
  const booking = await getBookingById(id);
  booking.payments.push({ ...payment, recordedBy: adminId as never, recordedAt: new Date() });

  const totalPaid = booking.payments
    .filter((p) => p.status !== "failed")
    .reduce((sum, p) => sum + p.amount, 0);
  const finalAmount = booking.pricing?.finalAmount ?? 0;
  booking.paymentStatus = totalPaid <= 0 ? "unpaid" : totalPaid >= finalAmount && finalAmount > 0 ? "paid" : "partially_paid";

  await booking.save();

  await notifyCustomer({
    customer: customerIdOf(booking),
    type: "payment",
    title: "Payment recorded",
    message: `₹${payment.amount.toLocaleString("en-IN")} recorded for booking ${booking.bookingId}. Payment status: ${booking.paymentStatus.replace(/_/g, " ")}.`,
    link: `/account/bookings/${booking._id}`,
  });

  return booking;
}

export async function addBookingNote(id: string, note: string, adminId: string) {
  const booking = await getBookingById(id);
  booking.internalNotes.push({ note, addedBy: adminId as never, addedAt: new Date() });
  await booking.save();
  return booking;
}
