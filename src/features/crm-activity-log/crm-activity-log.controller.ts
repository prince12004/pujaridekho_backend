import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { ApiError } from "../../lib/api-error.js";
import { bulkListActivityLogs, createActivityLog, listActivityLogs } from "./crm-activity-log.service.js";

export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const inquiryId = String(req.query.inquiryId ?? "");
  if (!inquiryId) throw ApiError.badRequest("inquiryId is required");
  const result = await listActivityLogs(req, inquiryId);
  sendSuccess(res, result);
});

const bulkSchema = z.object({
  inquiryIds: z.array(z.string()).min(1, "inquiryIds must be a non-empty array"),
});

export const postBulkActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { inquiryIds } = bulkSchema.parse(req.body);
  const result = await bulkListActivityLogs(req, inquiryIds);
  sendSuccess(res, result);
});

const createSchema = z.object({
  id: z.string().min(1),
  inquiryId: z.string().min(1),
  salesPersonId: z.string().optional(),
  note: z.string().optional(),
  audioBase64: z.string().nullable().optional(),
  createdAt: z.string().min(1),
  isConversion: z.boolean().optional(),
  isReassignment: z.boolean().optional(),
  isRejection: z.boolean().optional(),
});

export const postActivityLog = asyncHandler(async (req: Request, res: Response) => {
  const input = createSchema.parse(req.body);
  const { status, body } = await createActivityLog(req, input);
  sendSuccess(res, body, undefined, status);
});
