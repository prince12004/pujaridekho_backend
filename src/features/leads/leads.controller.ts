import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { sendHomeBookingLead } from "./leads.service.js";

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
