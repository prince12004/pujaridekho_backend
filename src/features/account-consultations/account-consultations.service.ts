import { ApiError } from "../../lib/api-error.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { ConsultationModel } from "../../models/consultation.model.js";

const UPCOMING_STATUSES = ["new", "contacted", "scheduled"];
const COMPLETED_STATUSES = ["completed"];
const CANCELLED_STATUSES = ["cancelled"];

export async function listMyConsultations(customerId: string, tab: string | undefined, page: number, limit: number) {
  const filter: Record<string, unknown> = { customer: customerId };
  if (tab === "upcoming") filter.status = { $in: UPCOMING_STATUSES };
  else if (tab === "completed") filter.status = { $in: COMPLETED_STATUSES };
  else if (tab === "cancelled") filter.status = { $in: CANCELLED_STATUSES };

  const [items, total] = await Promise.all([
    ConsultationModel.find(filter)
      .populate("pandit", "fullName mobile photo specializations verificationStatus")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ConsultationModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMyConsultationById(customerId: string, id: string) {
  const consultation = await ConsultationModel.findById(id).populate(
    "pandit",
    "fullName mobile photo specializations verificationStatus experienceYears languages rating",
  );
  if (!consultation) throw ApiError.notFound("Consultation not found");
  if (!consultation.customer || consultation.customer.toString() !== customerId) {
    throw ApiError.forbidden("You do not have access to this consultation");
  }
  return consultation;
}

const ELIGIBLE_STATUSES = ["new", "contacted", "scheduled"];

export async function requestConsultationReschedule(
  customerId: string,
  id: string,
  input: { requestedDate?: Date; requestedTime?: string; reason?: string },
) {
  const consultation = await getMyConsultationById(customerId, id);
  if (!ELIGIBLE_STATUSES.includes(consultation.status)) {
    throw ApiError.badRequest("This consultation is not eligible for a reschedule request");
  }
  consultation.rescheduleRequest = { ...input, status: "requested", requestedAt: new Date() } as never;
  await consultation.save();

  await notifyCustomer({
    customer: customerId,
    type: "consultation",
    title: "Reschedule request submitted",
    message: "Your consultation reschedule request has been sent to our team.",
    link: `/account/consultations/${consultation._id}`,
  });
  return consultation;
}

export async function requestConsultationCancellation(customerId: string, id: string, input: { reason: string }) {
  const consultation = await getMyConsultationById(customerId, id);
  if (!ELIGIBLE_STATUSES.includes(consultation.status)) {
    throw ApiError.badRequest("This consultation is not eligible for cancellation");
  }
  consultation.cancelRequest = { reason: input.reason, status: "requested", requestedAt: new Date() } as never;
  await consultation.save();

  await notifyCustomer({
    customer: customerId,
    type: "consultation",
    title: "Cancellation request submitted",
    message: "Your consultation cancellation request has been sent to our team.",
    link: `/account/consultations/${consultation._id}`,
  });
  return consultation;
}
