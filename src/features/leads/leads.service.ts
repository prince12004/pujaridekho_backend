import { sendMail } from "../../lib/mailer.js";
import { createNotification } from "../../lib/notify.js";
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendHomeBookingLead(input: HomeBookingLeadInput) {
  const rows: [string, string][] = [
    ["Name", input.name],
    ["Mobile", input.mobile],
    ["City", input.city],
    ["Address", input.address],
    ["Puja", input.pooja],
    ["Date", input.date],
  ];

  const html = `
    <h2>New Puja booking enquiry from the homepage</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="font-weight:bold">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
  `;

  // Persisted so it shows up in the admin panel's "Homepage Enquiries" tab —
  // the one place that's guaranteed to work even before SMTP creds are set,
  // unlike the email below which mailer.ts no-ops until then.
  await HomeLeadModel.create(input);

  await createNotification({
    type: "support",
    title: "New Puja enquiry (homepage)",
    message: `${input.name} (${input.mobile}) wants "${input.pooja}" in ${input.city} on ${input.date}`,
    link: "/admin/leads",
  });

  await sendMail({
    to: env.LEAD_NOTIFICATION_EMAIL,
    subject: `New Puja Enquiry — ${input.name} (${input.pooja})`,
    html,
  });
}
