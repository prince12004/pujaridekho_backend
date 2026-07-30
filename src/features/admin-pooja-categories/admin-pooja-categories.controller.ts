import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  createPoojaCategory,
  deletePoojaCategory,
  getPoojaCategoryById,
  listPoojaCategories,
  updatePoojaCategory,
} from "./admin-pooja-categories.service.js";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.string().optional(),
  description: z.string().optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
  status: z.enum(["draft", "Published"]).optional(),
  sortOrder: z.number().optional(),
});

export const getPoojaCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listPoojaCategories();
  sendSuccess(res, categories);
});

export const getPoojaCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await getPoojaCategoryById(req.params.id);
  sendSuccess(res, category);
});

export const postPoojaCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.parse(req.body);
  const category = await createPoojaCategory(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "PoojaCategory",
    entityId: category._id.toString(),
    description: `Created pooja category "${category.name}"`,
    after: category,
  });
  sendSuccess(res, category, "Pooja category created", 201);
});

export const patchPoojaCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.partial().parse(req.body);
  const before = await getPoojaCategoryById(req.params.id);
  const beforeSnapshot = before.toObject();
  const category = await updatePoojaCategory(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "PoojaCategory",
    entityId: category._id.toString(),
    description: `Updated pooja category "${category.name}"`,
    before: beforeSnapshot,
    after: category,
  });
  sendSuccess(res, category, "Pooja category updated");
});

export const removePoojaCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await getPoojaCategoryById(req.params.id);
  await deletePoojaCategory(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "PoojaCategory",
    entityId: req.params.id,
    description: `Deleted pooja category "${category.name}"`,
    before: category,
  });
  sendSuccess(res, null, "Pooja category deleted");
});
