import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { TestimonialModel } from "../../models/testimonial.model.js";

export const getPublicTestimonials = asyncHandler(async (_req: Request, res: Response) => {
  const testimonials = await TestimonialModel.find({ status: "published" }).sort({ sortOrder: 1, createdAt: -1 });
  sendSuccess(res, testimonials);
});
