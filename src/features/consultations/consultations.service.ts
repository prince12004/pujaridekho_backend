import { createNotification } from "../../lib/notify.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { ConsultationModel, CONSULTATION_FEE } from "../../models/consultation.model.js";
import { findOrCreateCustomerByMobile } from "../admin-customers/admin-customers.service.js";

export interface CreateConsultationInput {
  name: string;
  mobile: string;
  email?: string;
  type?: "call" | "chat" | "video";
  topic?: string;
  message?: string;
  preferredDate?: Date;
  preferredTime?: string;
}

export async function createConsultation(input: CreateConsultationInput) {
  const customer = await findOrCreateCustomerByMobile({ name: input.name, mobile: input.mobile, email: input.email });

  const consultation = await ConsultationModel.create({
    ...input,
    customer: customer._id,
    fee: CONSULTATION_FEE,
    timeline: [{ status: "new", note: "Consultation requested by customer" }],
  });
  await createNotification({
    type: "consultation",
    title: "New consultation request",
    message: `${input.name} requested a consultation${input.topic ? ` about "${input.topic}"` : ""}`,
    link: `/admin/consultations`,
  });

  await notifyCustomer({
    customer: customer._id.toString(),
    type: "consultation",
    title: "Consultation request received",
    message: "Our team will confirm your consultation slot shortly.",
    link: `/account/consultations/${consultation._id}`,
  });

  return consultation;
}
