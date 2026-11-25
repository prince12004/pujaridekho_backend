import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getMyOrderById, listMyOrders, requestOrderCancellation } from "./account-orders.service.js";

const listQuerySchema = z.object({
  tab: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "all"]).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { tab, page, limit } = listQuerySchema.parse(req.query);
  const result = await listMyOrders(req.customer!.id, tab, page && page > 0 ? page : 1, limit && limit > 0 ? limit : 20);
  sendSuccess(res, result);
});

export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await getMyOrderById(req.customer!.id, req.params.id);
  sendSuccess(res, order);
});

const cancelSchema = z.object({
  reason: z.string().trim().min(1, "Please tell us why you'd like to cancel").max(500),
  notes: z.string().trim().max(1000).optional(),
});

export const postOrderCancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const input = cancelSchema.parse(req.body);
  const order = await requestOrderCancellation(req.customer!.id, req.params.id, input);
  sendSuccess(res, order, "Cancellation request submitted");
});
