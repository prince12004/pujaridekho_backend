import { ApiError } from "../../lib/api-error.js";
import { createNotification } from "../../lib/notify.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { BookingModel } from "../../models/booking.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { FestivalModel } from "../../models/festival.model.js";
import { MuhuratModel } from "../../models/muhurat.model.js";
import type { SamagriTemplateDocument } from "../../models/samagri-template.model.js";

async function generateBookingId() {
  const year = new Date().getFullYear();
  const prefix = `PD-${year}-`;
  const count = await BookingModel.countDocuments({ bookingId: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

export interface CreatePublicBookingInput {
  customer: { name: string; mobile: string; email?: string };
  serviceType?: "pooja" | "festival";
  poojaSlug: string;
  city: string;
  address: string;
  poojaDate: Date;
  poojaTime?: string;
  muhuratSlotId?: string;
  selectedSamagri?: { name: string }[];
}

function formatSlotTimeRange(startTime: string, endTime: string): string {
  const format = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };
  return `${format(startTime)} - ${format(endTime)}`;
}

// Reserves the requested Muhurat slot atomically — the `bookedCount` filter
// is re-checked by MongoDB against the live document at update time, so two
// concurrent bookings for the last open spot can't both succeed.
async function reserveMuhuratSlot(poojaId: unknown, poojaDate: Date, slotId: string) {
  const dayStart = new Date(poojaDate);
  dayStart.setHours(0, 0, 0, 0);

  const muhurat = await MuhuratModel.findOne({ pooja: poojaId, date: dayStart, isActive: true });
  if (!muhurat) throw ApiError.badRequest("No Muhurat schedule is available for this pooja on this date");

  const slot = muhurat.slots.find((s) => s._id?.toString() === slotId);
  if (!slot || !slot.isActive) throw ApiError.badRequest("This Muhurat slot is not available");

  // $elemMatch ensures the _id and capacity checks apply to the SAME array
  // element — two separate top-level "slots.x" dot-paths would each match
  // against any element independently, letting an unrelated open slot's
  // bookedCount satisfy the capacity check for a full one.
  const elemMatch: Record<string, unknown> = { _id: slot._id };
  if (slot.capacity != null) elemMatch.bookedCount = { $lt: slot.capacity };

  const result = await MuhuratModel.updateOne(
    { _id: muhurat._id, slots: { $elemMatch: elemMatch } },
    { $inc: { "slots.$[slot].bookedCount": 1 } },
    { arrayFilters: [{ "slot._id": slot._id }] },
  );
  if (result.modifiedCount === 0) throw ApiError.badRequest("This Muhurat slot is fully booked. Please choose another slot.");

  return { muhuratId: muhurat._id, slotId: slot._id, timeRange: formatSlotTimeRange(slot.startTime, slot.endTime) };
}

export async function createPublicBooking(input: CreatePublicBookingInput, customerId: string) {
  const serviceType = input.serviceType ?? "pooja";

  // Festivals and poojas are separate collections that both offer optional
  // samagri add-ons — look the service up in the right one based on serviceType
  // rather than always assuming "pooja" (a festival slug was previously being
  // looked up in the Pooja collection and always failing).
  const service =
    serviceType === "festival"
      ? await FestivalModel.findOne({ slug: input.poojaSlug, status: "published" })
      : await PoojaModel.findOne({ slug: input.poojaSlug, status: "published" }).populate<{
          samagriTemplate: SamagriTemplateDocument | null;
        }>("samagriTemplate");
  if (!service) throw ApiError.badRequest(`Selected ${serviceType} is not available`);

  // Recompute samagri pricing server-side from the service's own catalogue —
  // never trust a price sent by the client. Festivals still carry their own
  // embedded `samagri` array; Poojas price from their linked SamagriTemplate
  // (only `includedItems` are ever selectable/priced — `customerArrangeItems`
  // are informational-only and never contribute to price).
  const samagriCatalogue: { name: string; price: number }[] =
    serviceType === "festival"
      ? (service as { samagri: { name: string; price: number }[] }).samagri.map((item) => ({
          name: item.name,
          price: item.price,
        }))
      : ((service as { samagriTemplate: SamagriTemplateDocument | null }).samagriTemplate?.includedItems ?? []).map(
          (item) => ({ name: item.itemName, price: item.estimatedPrice }),
        );

  const requestedNames = new Set((input.selectedSamagri ?? []).map((item) => item.name));
  const selectedSamagri = samagriCatalogue.filter((item) => requestedNames.has(item.name));
  const samagriCharges = selectedSamagri.reduce((sum, item) => sum + item.price, 0);
  const finalAmount = service.startingPrice + samagriCharges;

  let poojaTime = input.poojaTime;
  let muhuratSlot: { muhurat: unknown; slotId: unknown } | undefined;
  if (serviceType === "pooja" && input.muhuratSlotId) {
    const reserved = await reserveMuhuratSlot(service._id, input.poojaDate, input.muhuratSlotId);
    poojaTime = reserved.timeRange;
    muhuratSlot = { muhurat: reserved.muhuratId, slotId: reserved.slotId };
  }

  const bookingId = await generateBookingId();

  const booking = await BookingModel.create({
    bookingId,
    customer: customerId,
    customerSnapshot: { name: input.customer.name, mobile: input.customer.mobile, email: input.customer.email },
    serviceType,
    pooja: serviceType === "pooja" ? service._id : undefined,
    festival: serviceType === "festival" ? service._id : undefined,
    city: input.city,
    address: input.address,
    poojaDate: input.poojaDate,
    poojaTime,
    muhuratSlot,
    status: "pending_payment",
    selectedSamagri,
    pricing: { packagePrice: service.startingPrice, marketPrice: service.marketPrice, samagriCharges, finalAmount },
    paymentStatus: "unpaid",
    bookingChannel: "online",
    bookingSource: "website",
    timeline: [{ status: "pending_payment", note: "Booking created by customer on website" }],
  });

  await createNotification({
    type: "booking",
    title: "New booking created",
    message: `${input.customer.name} booked "${service.name}" for ₹${finalAmount.toLocaleString("en-IN")}`,
    link: `/admin/bookings/${booking._id}`,
  });

  await notifyCustomer({
    customer: customerId,
    type: "booking",
    title: "Booking created",
    message: `Your booking for "${service.name}" (${booking.bookingId}) has been created. Complete payment to confirm.`,
    link: `/account/bookings/${booking._id}`,
  });

  return booking;
}
