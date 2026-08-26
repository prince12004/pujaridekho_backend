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

  try {
    await sendMail({
      to: env.LEAD_NOTIFICATION_EMAIL,
      subject: `New Puja Enquiry — ${input.name} (${input.pooja})`,
      html,
    });
  } catch (err) {
    logger.error("Failed to email homepage lead", { message: err instanceof Error ? err.message : err });
  }
}
