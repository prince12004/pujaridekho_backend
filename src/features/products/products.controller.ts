import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getPublicProductBySlug, listPublicProductCategories, listPublicProducts } from "./products.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

export const getPublicProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await listPublicProducts(query);
  sendSuccess(res, result);
});

export const getPublicProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await getPublicProductBySlug(req.params.slug);
  sendSuccess(res, product);
});

export const getPublicProductCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listPublicProductCategories();
  sendSuccess(res, categories);
});
