import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  createProductCategory,
  deleteProductCategory,
  getProductCategoryById,
  listProductCategories,
  updateProductCategory,
} from "./admin-product-categories.service.js";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  sortOrder: z.number().optional(),
});

export const getProductCategories = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listProductCategories());
});

export const getProductCategory = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getProductCategoryById(req.params.id));
});

export const postProductCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.parse(req.body);
  const category = await createProductCategory(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "ProductCategory",
    entityId: category._id.toString(),
    description: `Created product category "${category.name}"`,
  });
  sendSuccess(res, category, "Category created", 201);
});

export const patchProductCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.partial().parse(req.body);
  const category = await updateProductCategory(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "ProductCategory",
    entityId: category._id.toString(),
    description: `Updated product category "${category.name}"`,
  });
  sendSuccess(res, category, "Category updated");
});

export const removeProductCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await getProductCategoryById(req.params.id);
  await deleteProductCategory(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "ProductCategory",
    entityId: req.params.id,
    description: `Deleted product category "${category.name}"`,
  });
  sendSuccess(res, null, "Category deleted");
});
