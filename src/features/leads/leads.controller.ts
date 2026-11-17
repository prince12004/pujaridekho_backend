import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { captureCheckoutLead, sendHomeBookingLead } from "./leads.service.js";
import { mobileSchema } from "../../lib/validators.js";

const homeBookingLeadSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  pooja: z.string().min(1),
  date: z.string().min(1),
});

export const postHomeBookingLead = asyncHandler(async (req: Request, res: Response) => {
  const input = homeBookingLeadSchema.parse(req.body);
  await sendHomeBookingLead(input);
  sendSuccess(res, null, "Enquiry received", 201);
});

const checkoutLeadSchema = z.object({
  name: z.string().trim().min(1),
  mobile: mobileSchema,
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  date: z.string().min(1),
  pooja: z.string().trim().min(1),
  poojaSlug: z.string().trim().min(1),
  serviceType: z.enum(["pooja", "festival"]).default("pooja"),
  packageName: z.string().optional(),
  estimatedAmount: z.number().nonnegative().optional(),
});

export const postCheckoutLead = asyncHandler(async (req: Request, res: Response) => {
  const input = checkoutLeadSchema.parse(req.body);
  const lead = await captureCheckoutLead(input);
  sendSuccess(res, { _id: lead._id }, "Checkout details saved", 201);
});
