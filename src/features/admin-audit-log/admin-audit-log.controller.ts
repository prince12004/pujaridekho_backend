import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { AuditLogModel } from "../../models/audit-log.model.js";

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 50;

  const filter: Record<string, unknown> = {};
  if (query.entityType) filter.entityType = query.entityType;
  if (query.action) filter.action = query.action;

  const [items, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLogModel.countDocuments(filter),
  ]);

  sendSuccess(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
});
