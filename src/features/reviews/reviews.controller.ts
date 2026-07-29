import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listPublicReviews, submitReview } from "./reviews.service.js";

const listQuerySchema = z.object({
  entityType: z.enum(["pooja", "pandit", "product", "festival"]),
  entityId: z.string().min(1),
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = listQuerySchema.parse(req.query);
  sendSuccess(res, await listPublicReviews(entityType, entityId));
});

const submitSchema = z.object({
  entityType: z.enum(["pooja", "pandit", "product", "festival"]),
  entityId: z.string().min(1),
  customerName: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
});

export const postReview = asyncHandler(async (req: Request, res: Response) => {
  const input = submitSchema.parse(req.body);
  const review = await submitReview(input);
  sendSuccess(res, review, "Review submitted for moderation", 201);
});
