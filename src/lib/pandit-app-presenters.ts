import type { PanditDocument } from "../models/pandit.model.js";
import type { BookingDocument } from "../models/booking.model.js";
import type { HydratedDocument } from "mongoose";

/**
 * JSON shapes for the pujaripandit_app mobile client (pandit-auth +
 * pandit-app features). The Flutter app's models (PanditProfileModel,
 * BookingModel, …) were written first against an in-app mock backend with a
 * fixed snake_case contract — these presenters reproduce that exact contract
 * from real Mongo documents so no Dart code has to change.
 */

type PanditDoc = HydratedDocument<PanditDocument>;
type BookingDoc = HydratedDocument<BookingDocument>;

export function panditCode(pandit: PanditDoc) {
  return `PD-${pandit._id.toString().slice(-6).toUpperCase()}`;
}

export function toPanditProfileJson(pandit: PanditDoc, opts: { reviewCount: number; hasActiveBooking: boolean }) {
  const bank = pandit.bankDetails ?? {};
  return {
    id: pandit._id.toString(),
    pandit_code: panditCode(pandit),
    name: pandit.fullName,
    profile_image_url: pandit.photo ?? null,
    mobile_number: pandit.mobile,
    experience_years: pandit.experienceYears ?? 0,
    languages: pandit.languages ?? [],
    specializations: pandit.specializations ?? [],
    rating: pandit.rating ?? 0,
    review_count: opts.reviewCount,
    is_available: pandit.isAvailable ?? true,
    has_active_booking: opts.hasActiveBooking,
    bank_account_number: bank.accountNumber ?? null,
    bank_ifsc: bank.ifsc ?? null,
    bank_account_holder_name: bank.accountHolderName ?? null,
    document_urls: [pandit.idProofUrl, ...(pandit.certificates ?? [])].filter((v): v is string => Boolean(v)),
  };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Mirrors the app-level BookingStatus enum the Flutter app's booking_enums.dart parses. */
export function deriveBookingStatus(booking: BookingDoc): string {
  const exec = booking.panditExecution ?? {};
  if (booking.status === "cancelled" || booking.status === "refunded" || booking.status === "refund_requested") {
    return "CANCELLED";
  }
  if (booking.status === "pooja_completed" || booking.status === "closed" || exec.completedAt) {
    return "COMPLETED";
  }
  if (exec.startedAt) return "IN_PROGRESS";
  if (exec.reachedAt) return "REACHED";

  const now = new Date();
  if (isSameDay(booking.poojaDate, now)) return "TODAY";
  if (booking.poojaDate.getTime() > now.getTime()) return "UPCOMING";
  return "ASSIGNED";
}

function pricedAsset(a: { name: string; quantity: number; unitPrice: number }) {
  return { name: a.name, quantity: a.quantity, unit_price: a.unitPrice, amount: a.quantity * a.unitPrice };
}

export function totalAmountOf(booking: BookingDoc) {
  return booking.pricing?.finalAmount || booking.pricing?.packagePrice || 0;
}

export function extraAssetsTotalOf(booking: BookingDoc) {
  return (booking.panditExecution?.extraAssets ?? []).reduce((sum, a) => sum + (a.amount || 0), 0);
}

export function grandTotalOf(booking: BookingDoc) {
  return totalAmountOf(booking) + (booking.panditExecution?.extraAmount || 0) + extraAssetsTotalOf(booking);
}

export function toBookingJson(booking: BookingDoc) {
  const exec = booking.panditExecution ?? {};
  const totalAmount = totalAmountOf(booking);
  const extraAssetsTotal = extraAssetsTotalOf(booking);
  const customer = booking.customerSnapshot ?? {};
  const pujaName = booking.package?.name || (booking.pooja as unknown as { name?: string })?.name || "Puja";

  return {
    id: booking._id.toString(),
    booking_ref: booking.bookingId,
    puja_name: pujaName,
    puja_type: pujaName,
    booking_date: booking.poojaDate.toISOString(),
    start_time: booking.poojaDate.toISOString(),
    expected_duration_minutes: 90,
    special_instructions: booking.specialInstructions ?? "",
    customer_name: customer.name ?? "Customer",
    // No bridge-number/call-masking infra yet — see report's deferred list.
    customer_call_number: customer.mobile ?? null,
    samagri_by_company: Boolean(booking.package?.samagriIncluded),
    samagri_list: (booking.selectedSamagri ?? []).map((s) => ({ name: s.name, quantity: "1" })),
    address: [booking.address, booking.landmark, booking.city, booking.pincode].filter(Boolean).join(", "),
    // Booking model doesn't geocode the customer address yet — see report.
    latitude: 0,
    longitude: 0,
    total_amount: totalAmount,
    collected_amount: exec.collectedAmount || 0,
    extra_amount: exec.extraAmount || 0,
    extra_amount_reason: exec.extraAmountReason ?? null,
    extra_assets: (exec.extraAssets ?? []).map((a) => pricedAsset(a)),
    extra_assets_total: extraAssetsTotal,
    grand_total: totalAmount + (exec.extraAmount || 0) + extraAssetsTotal,
    reached_at: exec.reachedAt ? exec.reachedAt.toISOString() : null,
    reached_latitude: exec.reachedLocation?.lat ?? null,
    reached_longitude: exec.reachedLocation?.lng ?? null,
    reached_otp_verified: Boolean(exec.reachedOtpVerified),
    puja_started_at: exec.startedAt ? exec.startedAt.toISOString() : null,
    puja_completed_at: exec.completedAt ? exec.completedAt.toISOString() : null,
    payment_method: exec.paymentMethod ? exec.paymentMethod.toUpperCase() : null,
    payment_status: (exec.paymentStatus ?? "pending").toUpperCase(),
    booking_status: deriveBookingStatus(booking),
    company_due_amount: exec.companyDueAmount || 0,
    deposit_status: (exec.depositStatus ?? "not_applicable").toUpperCase(),
    deposit_id: exec.depositId ? exec.depositId.toString() : null,
    deposited_at: exec.depositedAt ? exec.depositedAt.toISOString() : null,
    images: (exec.images ?? []).map((img, idx) => ({
      id: `${booking._id.toString()}-${idx}`,
      booking_id: booking._id.toString(),
      pandit_id: booking.pandit ? booking.pandit.toString() : null,
      url: img.url,
      uploaded_at: img.uploadedAt ? img.uploadedAt.toISOString() : new Date().toISOString(),
    })),
    created_at: booking.get("createdAt") ? (booking.get("createdAt") as Date).toISOString() : new Date().toISOString(),
  };
}

export function notificationTypeToJson(type: string) {
  return type.toUpperCase();
}
