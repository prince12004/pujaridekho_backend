import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { CRM_FIXED_SLOTS } from "../../models/pandit-slot-reservation.model.js";
import {
  getCrmAvailability,
  listConfirmedBookingsForCrm,
  listCrmPandits,
  releasePanditSlot,
  reservePanditSlot,
} from "./crm.service.js";

export const getPandits = asyncHandler(async (_req: Request, res: Response) => {
  const pandits = await listCrmPandits();
  sendSuccess(res, pandits);
});

const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date } = dateQuerySchema.parse(req.query);
  const availability = await getCrmAvailability(date);
  sendSuccess(res, availability);
});

const reserveBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  slot: z.enum(CRM_FIXED_SLOTS),
  ref: z.string().min(1),
});

export const postPanditBooking = asyncHandler(async (req: Request, res: Response) => {
  const body = reserveBodySchema.parse(req.body);
  const reservation = await reservePanditSlot({ panditId: req.params.id, ...body });
  sendSuccess(
    res,
    { panditId: req.params.id, date: reservation.date, slot: reservation.slot, ref: reservation.bookingRef, status: "booked" },
    "Slot reserved",
    201,
  );
});

export const deletePanditBooking = asyncHandler(async (req: Request, res: Response) => {
  await releasePanditSlot(req.params.id, req.params.bookingRef);
  sendSuccess(res, null, "Reservation released");
});

const confirmedBookingsQuerySchema = z.object({
  status: z.enum(["confirmed"]).optional(),
  since: z.string().optional(),
});

export const getConfirmedBookings = asyncHandler(async (req: Request, res: Response) => {
  const query = confirmedBookingsQuerySchema.parse(req.query);
  const bookings = await listConfirmedBookingsForCrm({ since: query.since });
  sendSuccess(res, bookings);
});
