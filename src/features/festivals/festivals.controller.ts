import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getPublicFestivalBySlug, listPublicFestivals } from "./festivals.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

export const getPublicFestivals = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  sendSuccess(res, await listPublicFestivals(query));
});

export const getPublicFestival = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getPublicFestivalBySlug(req.params.slug));
});
