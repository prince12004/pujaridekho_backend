import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { createPublicOrder, getPublicOrderById } from "./orders.service.js";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    mobile: z.string().min(10),
    email: z.string().email().optional().or(z.literal("")),
  }),
  items: z.array(z.object({ productSlug: z.string().min(1), quantity: z.number().min(1) })).min(1),
  shippingAddress: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    address: z.string().min(1),
    city: z.string().min(1),
    pincode: z.string().min(1),
  }),
  couponCode: z.string().optional(),
});

export const postOrder = asyncHandler(async (req: Request, res: Response) => {
  const input = orderSchema.parse(req.body);
  const order = await createPublicOrder(input);
  sendSuccess(res, order, "Order placed", 201);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await getPublicOrderById(req.params.id);
  sendSuccess(res, order);
});
