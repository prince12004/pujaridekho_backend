import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  BOOKING_SERVICE_TYPES,
  BOOKING_SOURCES,
  BOOKING_STATUSES,
  PAYMENT_METHODS,
} from "../../models/booking.model.js";
import {
  addBookingNote,
  addBookingPayment,
  assignPanditToBooking,
  createOfflineBooking,
  getBookingById,
  listBookings,
  listConfirmedBookings,
  updateBookingDetails,
  updateBookingStatus,
} from "./admin-bookings.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  bookingChannel: z.string().optional(),
  serviceType: z.string().optional(),
});

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await listBookings(query);
  sendSuccess(res, result);
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await getBookingById(req.params.id);
  sendSuccess(res, booking);
});

const confirmedQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});

export const getConfirmedBookings = asyncHandler(async (req: Request, res: Response) => {
  const query = confirmedQuerySchema.parse(req.query);
  const result = await listConfirmedBookings(query);
  sendSuccess(res, result);
});

const offlineBookingSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    mobile: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
  }),
  serviceType: z.enum(BOOKING_SERVICE_TYPES),
  pooja: z.string().optional(),
  festival: z.string().optional(),
  package: z
    .object({
      name: z.string().optional(),
      price: z.number().optional(),
      salePrice: z.number().optional(),
      samagriIncluded: z.boolean().optional(),
      dakshinaIncluded: z.boolean().optional(),
    })
    .optional(),
  selectedSamagri: z.array(z.object({ name: z.string(), price: z.number().min(0) })).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  landmark: z.string().optional(),
  pincode: z.string().optional(),
  gotra: z.string().optional(),
  specialInstructions: z.string().optional(),
  poojaDate: z.coerce.date(),
  poojaTime: z.string().optional(),
  pandit: z.string().optional(),
  pricing: z
    .object({
      packagePrice: z.number().optional(),
      marketPrice: z.number().optional(),
      samagriCharges: z.number().optional(),
      additionalCharges: z.number().optional(),
      discount: z.number().optional(),
      couponCode: z.string().optional(),
      customDiscount: z.number().optional(),
      finalAmount: z.number().optional(),
      advanceAmount: z.number().optional(),
      remainingAmount: z.number().optional(),
      priceChangeReason: z.string().optional(),
    })
    .optional(),
  payments: z
    .array(
      z.object({
        amount: z.number().min(0),
        method: z.enum(PAYMENT_METHODS),
        status: z.enum(["pending", "success", "failed"]).optional(),
        transactionRef: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  bookingSource: z.enum(BOOKING_SOURCES),
  referral: z
    .object({
      referredBy: z.string().optional(),
      referralCode: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export const postOfflineBooking = asyncHandler(async (req: Request, res: Response) => {
  const input = offlineBookingSchema.parse(req.body);
  const booking = await createOfflineBooking(input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Booking",
    entityId: booking._id.toString(),
    description: `Created offline booking ${booking.bookingId}`,
    after: booking,
  });
  sendSuccess(res, booking, "Offline booking created", 201);
});

const statusSchema = z.object({ status: z.enum(BOOKING_STATUSES), note: z.string().optional() });

export const patchBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = statusSchema.parse(req.body);
  const booking = await updateBookingStatus(req.params.id, status, note, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "status_change",
    entityType: "Booking",
    entityId: booking._id.toString(),
    description: `Booking ${booking.bookingId} status changed to ${status}`,
  });
  sendSuccess(res, booking, "Booking status updated");
});

const bookingDetailsSchema = z.object({
  poojaDate: z.coerce.date().optional(),
  poojaTime: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  landmark: z.string().optional(),
  pincode: z.string().optional(),
  gotra: z.string().optional(),
  specialInstructions: z.string().optional(),
  pricing: z
    .object({
      packagePrice: z.number().optional(),
      marketPrice: z.number().optional(),
      samagriCharges: z.number().optional(),
      additionalCharges: z.number().optional(),
      discount: z.number().optional(),
      customDiscount: z.number().optional(),
      finalAmount: z.number().optional(),
      advanceAmount: z.number().optional(),
      remainingAmount: z.number().optional(),
    })
    .optional(),
});

export const patchBookingDetails = asyncHandler(async (req: Request, res: Response) => {
  const input = bookingDetailsSchema.parse(req.body);
  const booking = await updateBookingDetails(req.params.id, input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Booking",
    entityId: booking._id.toString(),
    description: `Booking ${booking.bookingId} details updated`,
  });
  sendSuccess(res, booking, "Booking updated");
});

const assignPanditSchema = z.object({ panditId: z.string().min(1) });

export const patchAssignPandit = asyncHandler(async (req: Request, res: Response) => {
  const { panditId } = assignPanditSchema.parse(req.body);
  const booking = await assignPanditToBooking(req.params.id, panditId, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "assign_pandit",
    entityType: "Booking",
    entityId: booking._id.toString(),
    description: `Pandit assigned to booking ${booking.bookingId}`,
  });
  sendSuccess(res, booking, "Pandit assigned");
});

const paymentSchema = z.object({
  amount: z.number().min(0),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(["pending", "success", "failed"]).optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

export const postBookingPayment = asyncHandler(async (req: Request, res: Response) => {
  const input = paymentSchema.parse(req.body);
  const booking = await addBookingPayment(req.params.id, input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "record_payment",
    entityType: "Booking",
    entityId: booking._id.toString(),
    description: `Payment of ₹${input.amount} recorded for booking ${booking.bookingId}`,
  });
  sendSuccess(res, booking, "Payment recorded", 201);
});

const noteSchema = z.object({ note: z.string().min(1) });

export const postBookingNote = asyncHandler(async (req: Request, res: Response) => {
  const { note } = noteSchema.parse(req.body);
  const booking = await addBookingNote(req.params.id, note, req.admin!.id);
  sendSuccess(res, booking, "Note added", 201);
});
