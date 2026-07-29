import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getMyBookingById, listMyBookings, requestCancellation, requestReschedule } from "./account-bookings.service.js";

const listQuerySchema = z.object({
  tab: z.enum(["upcoming", "completed", "cancelled", "all"]).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const { tab, page, limit } = listQuerySchema.parse(req.query);
  const result = await listMyBookings(req.customer!.id, tab, page && page > 0 ? page : 1, limit && limit > 0 ? limit : 20);
  sendSuccess(res, result);
});

export const getMyBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await getMyBookingById(req.customer!.id, req.params.id);
  sendSuccess(res, booking);
});

const rescheduleSchema = z.object({
  requestedDate: z.coerce.date(),
  requestedTime: z.string().optional(),
  reason: z.string().optional(),
});

export const postRescheduleRequest = asyncHandler(async (req: Request, res: Response) => {
  const input = rescheduleSchema.parse(req.body);
  const booking = await requestReschedule(req.customer!.id, req.params.id, input);
  sendSuccess(res, booking, "Reschedule request submitted");
});

const cancelSchema = z.object({
  reason: z.string().min(1, "Please tell us why you'd like to cancel"),
  notes: z.string().optional(),
});

export const postCancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const input = cancelSchema.parse(req.body);
  const booking = await requestCancellation(req.customer!.id, req.params.id, input);
  sendSuccess(res, booking, "Cancellation request submitted");
});
