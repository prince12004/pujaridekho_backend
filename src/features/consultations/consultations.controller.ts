import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { createConsultation } from "./consultations.service.js";

const consultationSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  type: z.enum(["call", "chat", "video"]).optional(),
  topic: z.string().optional(),
  message: z.string().optional(),
  preferredDate: z.coerce.date().optional(),
  preferredTime: z.string().optional(),
});

export const postConsultation = asyncHandler(async (req: Request, res: Response) => {
  const input = consultationSchema.parse(req.body);
  const consultation = await createConsultation(input);
  sendSuccess(res, consultation, "Consultation request received", 201);
});
