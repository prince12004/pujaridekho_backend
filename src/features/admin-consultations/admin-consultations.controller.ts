import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { getConsultationById, listConsultations, updateConsultation } from "./admin-consultations.service.js";

export const getConsultations = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  sendSuccess(res, await listConsultations(status));
});

const updateSchema = z.object({
  status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid"]).optional(),
  pandit: z.string().optional(),
  adminNotes: z.string().optional(),
});

export const patchConsultation = asyncHandler(async (req: Request, res: Response) => {
  const input = updateSchema.parse(req.body);
  const consultation = await updateConsultation(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Consultation",
    entityId: consultation._id.toString(),
    description: `Updated consultation request from "${consultation.name}"`,
  });
  sendSuccess(res, consultation, "Consultation updated");
});

export const getConsultation = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getConsultationById(req.params.id));
});
