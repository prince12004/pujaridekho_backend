import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import {
  getMyConsultationById,
  listMyConsultations,
  requestConsultationCancellation,
  requestConsultationReschedule,
} from "./account-consultations.service.js";

const listQuerySchema = z.object({
  tab: z.enum(["upcoming", "completed", "cancelled", "all"]).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const getMyConsultations = asyncHandler(async (req: Request, res: Response) => {
  const { tab, page, limit } = listQuerySchema.parse(req.query);
  const result = await listMyConsultations(req.customer!.id, tab, page && page > 0 ? page : 1, limit && limit > 0 ? limit : 20);
  sendSuccess(res, result);
});

export const getMyConsultation = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getMyConsultationById(req.customer!.id, req.params.id));
});

const rescheduleSchema = z.object({
  requestedDate: z.coerce.date().optional(),
  requestedTime: z.string().optional(),
  reason: z.string().optional(),
});

export const postConsultationReschedule = asyncHandler(async (req: Request, res: Response) => {
  const input = rescheduleSchema.parse(req.body);
  sendSuccess(res, await requestConsultationReschedule(req.customer!.id, req.params.id, input), "Reschedule request submitted");
});

const cancelSchema = z.object({ reason: z.string().min(1) });

export const postConsultationCancel = asyncHandler(async (req: Request, res: Response) => {
  const input = cancelSchema.parse(req.body);
  sendSuccess(res, await requestConsultationCancellation(req.customer!.id, req.params.id, input), "Cancellation request submitted");
});
