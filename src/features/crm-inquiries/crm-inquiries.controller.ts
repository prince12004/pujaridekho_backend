import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { ApiError } from "../../lib/api-error.js";
import {
  assignPandit,
  assignPanditToEvent,
  bulkSync,
  createInquiry,
  deleteInquiry,
  getInquiry,
  getStats,
  listInquiries,
  syncWebsiteBookings,
  updateInquiry,
  getCrmAvailability,
  listCrmPandits,
} from "./crm-inquiries.service.js";

export const getInquiriesList = asyncHandler(async (req: Request, res: Response) => {
  const result = await listInquiries(req);
  sendSuccess(res, result);
});

export const getInquiryById = asyncHandler(async (req: Request, res: Response) => {
  const result = await getInquiry(req, req.params.id);
  sendSuccess(res, result);
});

export const postInquiry = asyncHandler(async (req: Request, res: Response) => {
  const result = await createInquiry(req, req.body as Record<string, unknown>);
  sendSuccess(res, result, undefined, 201);
});

export const putInquiry = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateInquiry(req, req.params.id, req.body as Record<string, unknown>);
  sendSuccess(res, result);
});

export const deleteInquiryById = asyncHandler(async (req: Request, res: Response) => {
  await deleteInquiry(req.params.id);
  sendSuccess(res, { deleted: true });
});

const assignPanditSchema = z.object({
  panditId: z.string().min(1, "panditId is required"),
  panditName: z.string().min(1, "panditName is required"),
  slot: z.string().min(1, "slot is required"),
});

export const postAssignPandit = asyncHandler(async (req: Request, res: Response) => {
  const input = assignPanditSchema.parse(req.body);
  try {
    const result = await assignPandit(req, req.params.id, input);
    sendSuccess(res, result);
  } catch (err) {
    if ((err as { code?: string }).code === "SLOT_TAKEN" || (err instanceof ApiError && err.statusCode === 409)) {
      throw ApiError.conflict("That slot was just booked — pick another");
    }
    throw err;
  }
});

export const postAssignPanditToEvent = asyncHandler(async (req: Request, res: Response) => {
  const input = assignPanditSchema.parse(req.body);
  try {
    const result = await assignPanditToEvent(req, req.params.id, req.params.eventId, input);
    sendSuccess(res, result);
  } catch (err) {
    if ((err as { code?: string }).code === "SLOT_TAKEN" || (err instanceof ApiError && err.statusCode === 409)) {
      throw ApiError.conflict("That slot was just booked — pick another");
    }
    throw err;
  }
});

export const getStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getStats(req);
  sendSuccess(res, result);
});

export const postBulkSync = asyncHandler(async (req: Request, res: Response) => {
  if (!Array.isArray(req.body)) throw ApiError.badRequest("Expected array");
  const result = await bulkSync(req, req.body as Array<Record<string, unknown>>);
  sendSuccess(res, result);
});

export const getWebsiteBookingsSync = asyncHandler(async (req: Request, res: Response) => {
  const result = await syncWebsiteBookings(req.query.since ? String(req.query.since) : undefined);
  sendSuccess(res, result);
});

export const getInquiryPandits = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listCrmPandits());
});

const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export const getInquiryPanditAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date } = dateQuerySchema.parse(req.query);
  sendSuccess(res, await getCrmAvailability(date));
});
