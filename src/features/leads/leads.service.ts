import { isValidObjectId } from "mongoose";
import { sendMail } from "../../lib/mailer.js";
import { createNotification } from "../../lib/notify.js";
import { renderHomeLeadEmail } from "../../lib/email-templates.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import { HomeLeadModel } from "../../models/home-lead.model.js";

export interface HomeBookingLeadInput {
  name: string;
  mobile: string;
  city: string;
  address: string;
  pooja: string;
  date: string;
}

export async function sendHomeBookingLead(input: HomeBookingLeadInput) {
  const html = renderHomeLeadEmail(input);

  await HomeLeadModel.create(input);

  await createNotification({
    type: "support",
    title: "New Puja enquiry (homepage)",
    message: `${input.name} (${input.mobile}) wants "${input.pooja}" in ${input.city} on ${input.date}`,
    link: "/admin/leads",
  });

  // Fire-and-forget — the lead is already saved and the admin already
  // notified in-app above, so this must never hold up the HTTP response.
  // A blocked/slow SMTP host (common on cheap VPS providers) would otherwise
  // hang the request for as long as the connection takes to time out.
  sendMail({
    to: env.LEAD_NOTIFICATION_EMAIL,
    subject: `New Puja Enquiry — ${input.name} (${input.pooja})`,
    html,
  }).catch((err) => {
    logger.error("Failed to email homepage lead", { message: err instanceof Error ? err.message : err });
  });
}

export interface CheckoutLeadInput {
  name: string;
  mobile: string;
  city: string;
  address: string;
  date: string;
  pooja: string;
  poojaSlug: string;
  serviceType: "pooja" | "festival";
  packageName?: string;
  estimatedAmount?: number;
}

// Repeated "Book Now" clicks (e.g. closing and reopening the OTP modal)
// update the same open capture instead of piling up duplicates.
const CHECKOUT_LEAD_DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;

/** Saves the checkout form the moment "Book Now" is pressed — before OTP login
 * and before the booking exists — so customers who drop off are still seen
 * by the admin team. */
export async function captureCheckoutLead(input: CheckoutLeadInput) {
  const existing = await HomeLeadModel.findOne({
    source: "checkout",
    status: "open",
    mobile: input.mobile,
    poojaSlug: input.poojaSlug,
    updatedAt: { $gte: new Date(Date.now() - CHECKOUT_LEAD_DEDUPE_WINDOW_MS) },
  }).sort({ updatedAt: -1 });

  if (existing) {
    existing.set({ ...input });
    await existing.save();
    return existing;
  }

  return HomeLeadModel.create({ ...input, source: "checkout", status: "open" });
}

export async function markCheckoutLeadConverted(leadId: string, booking: { _id: unknown; bookingId: string }) {
  if (!isValidObjectId(leadId)) return;
  await HomeLeadModel.updateOne(
    { _id: leadId, source: "checkout" },
    { $set: { status: "converted", booking: booking._id, bookingRef: booking.bookingId, convertedAt: new Date() } },
  );
}
