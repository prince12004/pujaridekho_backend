import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  copyMuhurat,
  createMuhurat,
  deleteMuhurat,
  getAdminMuhuratById,
  listAdminMuhurats,
  updateMuhurat,
} from "./admin-muhurats.service.js";

const slotSchema = z.object({
  _id: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  capacity: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const createSchema = z.object({
  pooja: z.string().min(1),
  date: z.string().min(1),
  slots: z.array(slotSchema).min(1, "Add at least one Muhurat time slot"),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const listQuerySchema = z.object({
  poojaId: z.string().optional(),
  date: z.string().optional(),
  search: z.string().optional(),
});

export const getMuhurats = asyncHandler(async (req: Request, res: Response) => {
  const filters = listQuerySchema.parse(req.query);
  sendSuccess(res, await listAdminMuhurats(filters));
});

export const getMuhurat = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getAdminMuhuratById(req.params.id));
});

export const postMuhurat = asyncHandler(async (req: Request, res: Response) => {
  const input = createSchema.parse(req.body);
  const muhurat = await createMuhurat(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Muhurat",
    entityId: muhurat._id.toString(),
    description: `Created Muhurat schedule for pooja on ${input.date}`,
  });
  sendSuccess(res, muhurat, "Muhurat schedule created", 201);
});

export const patchMuhurat = asyncHandler(async (req: Request, res: Response) => {
  const input = createSchema.partial().parse(req.body);
  const muhurat = await updateMuhurat(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Muhurat",
    entityId: muhurat._id.toString(),
    description: "Updated Muhurat schedule",
  });
  sendSuccess(res, muhurat, "Muhurat schedule updated");
});

export const removeMuhurat = asyncHandler(async (req: Request, res: Response) => {
  await deleteMuhurat(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Muhurat",
    entityId: req.params.id,
    description: "Deleted Muhurat schedule",
  });
  sendSuccess(res, null, "Muhurat schedule deleted");
});

const copySchema = z.object({ targetDates: z.array(z.string()).min(1) });

export const postCopyMuhurat = asyncHandler(async (req: Request, res: Response) => {
  const { targetDates } = copySchema.parse(req.body);
  const created = await copyMuhurat(req.params.id, targetDates);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Muhurat",
    entityId: req.params.id,
    description: `Copied Muhurat schedule to ${created.length} date(s)`,
  });
  sendSuccess(res, created, `Copied to ${created.length} date(s)`);
});
