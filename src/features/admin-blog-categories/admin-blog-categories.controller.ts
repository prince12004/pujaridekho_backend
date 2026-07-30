import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  createBlogCategory,
  deleteBlogCategory,
  getBlogCategoryById,
  listBlogCategories,
  updateBlogCategory,
} from "./admin-blog-categories.service.js";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "Published"]).optional(),
});

export const getBlogCategories = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listBlogCategories());
});

export const getBlogCategory = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getBlogCategoryById(req.params.id));
});

export const postBlogCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.parse(req.body);
  const category = await createBlogCategory(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "BlogCategory",
    entityId: category._id.toString(),
    description: `Created blog category "${category.name}"`,
  });
  sendSuccess(res, category, "Category created", 201);
});

export const patchBlogCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.partial().parse(req.body);
  const category = await updateBlogCategory(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "BlogCategory",
    entityId: category._id.toString(),
    description: `Updated blog category "${category.name}"`,
  });
  sendSuccess(res, category, "Category updated");
});

export const removeBlogCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await getBlogCategoryById(req.params.id);
  await deleteBlogCategory(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "BlogCategory",
    entityId: req.params.id,
    description: `Deleted blog category "${category.name}"`,
  });
  sendSuccess(res, null, "Category deleted");
});
