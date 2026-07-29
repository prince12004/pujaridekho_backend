import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import {
  getAdjacentPublicBlogs,
  getPublicBlogBySlug,
  listPublicBlogCategories,
  listPublicBlogs,
} from "./blogs.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
});

export const getPublicBlogs = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await listPublicBlogs(query);
  sendSuccess(res, result);
});

export const getPublicBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await getPublicBlogBySlug(req.params.slug);
  const adjacent = await getAdjacentPublicBlogs(req.params.slug);
  sendSuccess(res, { blog, ...adjacent });
});

export const getPublicBlogCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listPublicBlogCategories();
  sendSuccess(res, categories);
});
