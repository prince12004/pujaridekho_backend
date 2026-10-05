import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { ApiError } from "../../lib/api-error.js";
import * as svc from "./pandit-app.service.js";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.getProfile(req.pandit!.id));
});

const availabilitySchema = z.object({ is_available: z.boolean() });
export const postAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { is_available } = availabilitySchema.parse(req.body);
  sendSuccess(res, await svc.setAvailability(req.pandit!.id, is_available));
});

export const getHome = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.getHome(req.pandit!.id));
});

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  sendSuccess(res, await svc.listBookings(req.pandit!.id, status));
});

export const getBookingDetails = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.getBookingDetails(req.pandit!.id, req.params.id));
});

export const postBookingReachedOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.sendReachedOtp(req.pandit!.id, req.params.id);
  // Flat shape (no `data` wrapper) — matches the Flutter repository, which
  // reads `response.data['demo_otp']` directly off the response root.
  res.status(200).json({ success: true, message: result.message, demo_otp: result.demo_otp });
});

const reachedSchema = z.object({ otp: z.string().min(1), latitude: z.number().optional(), longitude: z.number().optional() });
export const postBookingReached = asyncHandler(async (req: Request, res: Response) => {
  const { otp, latitude, longitude } = reachedSchema.parse(req.body);
  sendSuccess(res, await svc.markReached(req.pandit!.id, req.params.id, otp, latitude, longitude));
});

export const postBookingStart = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.startPuja(req.pandit!.id, req.params.id));
});

export const postBookingImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest("Attach at least one image.");
  sendSuccess(res, await svc.uploadBookingImages(req.pandit!.id, req.params.id, files));
});

const extraAmountSchema = z.object({ amount: z.number(), reason: z.string().optional().default("") });
export const postBookingExtraAmount = asyncHandler(async (req: Request, res: Response) => {
  const { amount, reason } = extraAmountSchema.parse(req.body);
  sendSuccess(res, await svc.submitExtraAmount(req.pandit!.id, req.params.id, amount, reason));
});

const extraAssetsSchema = z.object({
  assets: z.array(z.object({ name: z.string(), quantity: z.number(), unit_price: z.number() })),
});
export const postBookingExtraAssets = asyncHandler(async (req: Request, res: Response) => {
  const { assets } = extraAssetsSchema.parse(req.body);
  sendSuccess(res, await svc.submitExtraAssets(req.pandit!.id, req.params.id, assets));
});

const paymentSchema = z.object({ payment_method: z.string(), collected_amount: z.number() });
export const postBookingPayment = asyncHandler(async (req: Request, res: Response) => {
  const { payment_method, collected_amount } = paymentSchema.parse(req.body);
  sendSuccess(res, await svc.submitPayment(req.pandit!.id, req.params.id, payment_method, collected_amount));
});

export const postBookingComplete = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.completeBooking(req.pandit!.id, req.params.id));
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.getDashboard(req.pandit!.id));
});

export const getEarnings = asyncHandler(async (req: Request, res: Response) => {
  const range = typeof req.query.range === "string" ? req.query.range : undefined;
  sendSuccess(res, await svc.getEarnings(req.pandit!.id, range));
});

export const getDues = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.duesSummary(req.pandit!.id));
});

const payDuesSchema = z.object({ amount: z.number(), method: z.string().optional(), gateway_ref: z.string().optional() });
export const postPayDues = asyncHandler(async (req: Request, res: Response) => {
  const { amount, method, gateway_ref } = payDuesSchema.parse(req.body);
  const result = await svc.payDues(req.pandit!.id, amount, method ?? "upi", gateway_ref);
  res.status(200).json({ success: true, message: result.message, data: result.deposit, dues: result.dues });
});

export const getDeposits = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.listDeposits(req.pandit!.id));
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.listNotifications(req.pandit!.id));
});

export const getRatings = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.getRatings(req.pandit!.id));
});
