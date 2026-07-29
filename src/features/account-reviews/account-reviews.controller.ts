import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listMyReviews, submitReview } from "./account-reviews.service.js";

const reviewSchema = z.object({
  entityType: z.enum(["pooja", "pandit", "product", "consultation"]),
  entityId: z.string().min(1).optional(),
  bookingId: z.string().optional(),
  orderId: z.string().optional(),
  consultationId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  photos: z.array(z.string()).optional(),
});

export const postMyReview = asyncHandler(async (req: Request, res: Response) => {
  const input = reviewSchema.parse(req.body);
  const review = await submitReview(req.customer!.id, { ...input, entityId: input.entityId ?? input.consultationId ?? "" });
  sendSuccess(res, review, "Review submitted — it will appear once approved", 201);
});

export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listMyReviews(req.customer!.id));
});
