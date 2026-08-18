import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}
export async function sendMail(input: SendMailInput) {
  if (!transporter) {
    console.warn(`[mailer] SMTP not configured — skipping email "${input.subject}" to ${input.to}`);
    return;
  }
  await transporter.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
