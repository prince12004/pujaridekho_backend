import mongoose from "mongoose";
import { ApiError } from "../../lib/api-error.js";
import { toCrmBookingPayload, type CrmBookingPayload } from "../../lib/crm-booking-payload.js";
import { PanditModel } from "../../models/pandit.model.js";
import { BookingModel } from "../../models/booking.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { FestivalModel } from "../../models/festival.model.js";
import { CRM_FIXED_SLOTS, PanditSlotReservationModel } from "../../models/pandit-slot-reservation.model.js";
import { getPanditById } from "../admin-pandits/admin-pandits.service.js";

export type CrmSlot = (typeof CRM_FIXED_SLOTS)[number];

const SLOT_TIME_RANGES: Record<CrmSlot, string> = {
  "8-11": "08:00 - 11:00",
  "12-3": "12:00 - 15:00",
  "4-8": "16:00 - 20:00",
};

export interface CrmPanditListItem {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

export async function listCrmPandits(): Promise<CrmPanditListItem[]> {
  const pandits = await PanditModel.find({}).select("fullName mobile accountStatus");
  return pandits.map((p) => ({
    id: p._id.toString(),
    name: p.fullName,
    phone: p.mobile,
    active: p.accountStatus === "active",
  }));
}

export interface CrmSlotStatus {
  slot: CrmSlot;
  status: "free" | "booked";
  bookingRef: string | null;
}

export interface CrmPanditAvailability {
  panditId: string;
  date: string;
  slots: CrmSlotStatus[];
}

export async function getCrmAvailability(date: string): Promise<CrmPanditAvailability[]> {
  const [pandits, reservations] = await Promise.all([
    PanditModel.find({}).select("_id"),
    PanditSlotReservationModel.find({ date }).select("pandit slot bookingRef"),
  ]);

  const reservedBySlot = new Map<string, string>();
  for (const r of reservations) {
    reservedBySlot.set(`${r.pandit.toString()}:${r.slot}`, r.bookingRef);
  }

  return pandits.map((pandit) => {
    const panditId = pandit._id.toString();
    return {
      panditId,
      date,
      slots: CRM_FIXED_SLOTS.map((slot) => {
        const bookingRef = reservedBySlot.get(`${panditId}:${slot}`) ?? null;
        return { slot, status: bookingRef ? ("booked" as const) : ("free" as const), bookingRef };
      }),
    };
  });
}

export interface ReserveSlotInput {
  panditId: string;
  date: string;
  slot: CrmSlot;
  ref: string;
  websiteBookingId?: string;
}

export async function reservePanditSlot(input: ReserveSlotInput) {
  await getPanditById(input.panditId); // throws 404 if the pandit doesn't exist

  const existingForRef = await PanditSlotReservationModel.findOne({
    pandit: input.panditId,
    date: input.date,
    slot: input.slot,
  });
  if (existingForRef && existingForRef.bookingRef !== input.ref) {
    throw ApiError.conflict("This pandit is already booked for this date and slot");
  }

  const linkedBooking = await BookingModel.findOne({ bookingId: input.websiteBookingId ?? input.ref });
  if (linkedBooking) {
    linkedBooking.pandit = input.panditId as never;
    linkedBooking.poojaDate = new Date(input.date);
    linkedBooking.poojaTime = SLOT_TIME_RANGES[input.slot];
    if (linkedBooking.status === "booking_confirmed" || linkedBooking.status === "pandit_assignment_pending") {
      linkedBooking.status = "pandit_assigned";
    }
    linkedBooking.timeline.push({
      status: linkedBooking.status,
      note: `Pandit assigned via CRM (slot ${input.slot}, ref ${input.ref})`,
      changedAt: new Date(),
    });
    await linkedBooking.save();
  }

  if (existingForRef) {
    if (linkedBooking && !existingForRef.booking) {
      existingForRef.booking = linkedBooking._id;
      await existingForRef.save();
    }
    return existingForRef;
  }

  try {
    const reservation = await PanditSlotReservationModel.create({
      pandit: input.panditId,
      date: input.date,
      slot: input.slot,
      bookingRef: input.ref,
      booking: linkedBooking?._id ?? null,
    });
    return reservation;
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      throw ApiError.conflict("This pandit is already booked for this date and slot");
    }
    throw err;
  }
}

export async function releasePanditSlot(panditId: string, bookingRef: string) {
  await getPanditById(panditId);

  const reservation = await PanditSlotReservationModel.findOne({ pandit: panditId, bookingRef });
  if (!reservation) throw ApiError.notFound("No reservation found for this pandit and booking reference");

  if (reservation.booking) {
    const booking = await BookingModel.findById(reservation.booking);
    if (booking) {
      booking.pandit = null;
      if (booking.status === "pandit_assigned") booking.status = "pandit_assignment_pending";
      booking.timeline.push({
        status: booking.status,
        note: `Pandit assignment released via CRM (ref ${bookingRef})`,
        changedAt: new Date(),
      });
      await booking.save();
    }
  }

  await reservation.deleteOne();
}

export interface ConfirmedBookingsForCrmQuery {
  since?: string;
}

export async function listConfirmedBookingsForCrm(query: ConfirmedBookingsForCrmQuery): Promise<CrmBookingPayload[]> {
  const filter: Record<string, unknown> = { status: "booking_confirmed" };
  if (query.since) filter.createdAt = { $gte: new Date(query.since) };

  const bookings = await BookingModel.find(filter)
    .populate("pooja", "name")
    .populate("festival", "name")
    .sort({ createdAt: -1 });

  return bookings.map((b) => toCrmBookingPayload(b as never));
}

export interface CrmBookingUpdateInput {
  clientName?: string;
  phone?: string;
  pujaName?: string;
  pujaDate?: string;
  pujaTime?: string;
  packagePrice?: number;
  samagriPrice?: number;
  totalAmount?: number;
  tokenAmount?: number;
  tokenStatus?: "pending" | "received";
  totalAmountStatus?: "pending" | "received";
  transactionId?: string | null;
  samagriIncluded?: boolean;
  address?: string;
  notes?: string;
  status?: "confirmed" | "notConverted";
}

export async function updateBookingFromCrm(websiteBookingId: string, input: CrmBookingUpdateInput) {
  const booking = await BookingModel.findOne({ bookingId: websiteBookingId });
  if (!booking) throw ApiError.notFound(`No booking found with id "${websiteBookingId}"`);

  if ("clientName" in input) booking.customerSnapshot!.name = input.clientName;
  if ("phone" in input) booking.customerSnapshot!.mobile = input.phone;
  if ("address" in input) booking.address = input.address;
  if ("pujaDate" in input) booking.poojaDate = new Date(input.pujaDate!);
  if ("pujaTime" in input) booking.poojaTime = input.pujaTime;

  if ("pujaName" in input && input.pujaName) {
    const match =
      booking.serviceType === "festival"
        ? await FestivalModel.findOne({ name: new RegExp(`^${input.pujaName}$`, "i") })
        : await PoojaModel.findOne({ name: new RegExp(`^${input.pujaName}$`, "i") });
    if (match) {
      if (booking.serviceType === "festival") booking.festival = match._id as never;
      else booking.pooja = match._id as never;
    }
  }

  // packagePrice/samagriPrice: same derivation rule as the CRM inquiry side
  // (deriveTotalAmount in crm-inquiries.service.ts) — once packagePrice is
  // known (from this input or already stored on the booking), finalAmount is
  // always recomputed from it rather than trusted as a flat totalAmount.
  // Falls back to the old flat-overwrite behavior for callers that only ever
  // send totalAmount (no package/samagri split).
  const touchesPricingSplit = "packagePrice" in input || "samagriPrice" in input || "samagriIncluded" in input;
  if ("packagePrice" in input) booking.pricing!.packagePrice = input.packagePrice!;
  if ("samagriPrice" in input) booking.pricing!.samagriCharges = input.samagriPrice!;
  if ("samagriIncluded" in input) {
    booking.package = booking.package ?? ({} as never);
    booking.package!.samagriIncluded = input.samagriIncluded;
  }

  const resolvedPackagePrice = "packagePrice" in input ? input.packagePrice : booking.pricing!.packagePrice;
  if (touchesPricingSplit && typeof resolvedPackagePrice === "number") {
    const samagriIncluded = Boolean(booking.package?.samagriIncluded);
    const samagriCharges = booking.pricing!.samagriCharges ?? 0;
    booking.pricing!.finalAmount = resolvedPackagePrice + (samagriIncluded ? samagriCharges : 0);
  } else if ("totalAmount" in input) {
    booking.pricing!.finalAmount = input.totalAmount!;
  }

  if ("tokenAmount" in input) booking.pricing!.advanceAmount = input.tokenAmount!;
  if ("tokenStatus" in input) booking.pricing!.tokenStatus = input.tokenStatus!;
  if ("totalAmountStatus" in input) booking.pricing!.totalAmountStatus = input.totalAmountStatus!;
  if ("transactionId" in input) booking.pricing!.transactionId = input.transactionId;

  // Riding along with this change: remainingAmount was never recomputed here
  // at all before, so it went stale on every CRM edit independent of this
  // feature — recompute it whenever anything affecting it changed.
  if (touchesPricingSplit || "totalAmount" in input || "tokenAmount" in input) {
    booking.pricing!.remainingAmount = Math.max(
      (booking.pricing!.finalAmount ?? 0) - (booking.pricing!.advanceAmount ?? 0),
      0,
    );
  }

  if ("notes" in input && input.notes) {
    booking.internalNotes.push({ note: input.notes, addedAt: new Date() } as never);
  }

  if ("status" in input) {
    const nextStatus = input.status === "notConverted" ? "cancelled" : "booking_confirmed";
    if (booking.status !== nextStatus) {
      booking.status = nextStatus;
      booking.timeline.push({
        status: nextStatus,
        note: `Status updated via CRM (${input.status})`,
        changedAt: new Date(),
      });
    }
  }

  await booking.save();
  return booking;
}
