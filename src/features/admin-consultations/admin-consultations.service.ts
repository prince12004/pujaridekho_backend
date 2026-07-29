import { ApiError } from "../../lib/api-error.js";
import { ConsultationModel } from "../../models/consultation.model.js";

export async function listConsultations(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  return ConsultationModel.find(filter).populate("pandit", "fullName mobile").sort({ createdAt: -1 });
}

export async function getConsultationById(id: string) {
  const consultation = await ConsultationModel.findById(id).populate("pandit", "fullName mobile");
  if (!consultation) throw ApiError.notFound("Consultation not found");
  return consultation;
}

export async function updateConsultation(id: string, input: Record<string, unknown>) {
  const consultation = await getConsultationById(id);
  Object.assign(consultation, input);
  await consultation.save();
  return consultation;
}
