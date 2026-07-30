import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { createPublicBooking } from "./bookings.service.js";
import { mobileSchema } from "../../lib/validators.js";

const bookingSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    mobile: mobileSchema,
    email: z.string().email().optional().or(z.literal("")),
  }),
  serviceType: z.enum(["pooja", "festival"]).optional(),
  poojaSlug: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(5, "Please enter your full address"),
  poojaDate: z.coerce.date(),
  poojaTime: z.string().optional(),
  muhuratSlotId: z.string().optional(),
  selectedSamagri: z.array(z.object({ name: z.string() })).optional(),
});

export const postBooking = asyncHandler(async (req: Request, res: Response) => {
  const input = bookingSchema.parse(req.body);
  const booking = await createPublicBooking(input, req.customer!.id);
  sendSuccess(res, booking, "Booking created", 201);
});
