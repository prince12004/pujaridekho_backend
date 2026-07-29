import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  updateTestimonial,
} from "./admin-testimonials.service.js";

const testimonialSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  rating: z.number().min(1).max(5),
  quote: z.string().min(1),
  photo: z.string().optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
  sortOrder: z.number().optional(),
});

export const getTestimonials = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listTestimonials());
});

export const postTestimonial = asyncHandler(async (req: Request, res: Response) => {
  const input = testimonialSchema.parse(req.body);
  const testimonial = await createTestimonial(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Testimonial",
    entityId: testimonial._id.toString(),
    description: `Created testimonial from "${testimonial.name}"`,
  });
  sendSuccess(res, testimonial, "Testimonial created", 201);
});

export const patchTestimonial = asyncHandler(async (req: Request, res: Response) => {
  const input = testimonialSchema.partial().parse(req.body);
  const testimonial = await updateTestimonial(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Testimonial",
    entityId: testimonial._id.toString(),
    description: `Updated testimonial from "${testimonial.name}"`,
  });
  sendSuccess(res, testimonial, "Testimonial updated");
});

export const removeTestimonial = asyncHandler(async (req: Request, res: Response) => {
  await deleteTestimonial(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Testimonial",
    entityId: req.params.id,
    description: "Deleted testimonial",
  });
  sendSuccess(res, null, "Testimonial deleted");
});
