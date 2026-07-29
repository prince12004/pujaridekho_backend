import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { addMyAddress, deleteMyAddress, listMyAddresses, updateMyAddress } from "./account-addresses.service.js";

const addressSchema = z.object({
  fullName: z.string().min(1),
  mobile: z.string().min(10),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  pincode: z.string().min(4),
  type: z.enum(["home", "office", "other"]).optional(),
  isDefault: z.boolean().optional(),
});

export const getMyAddresses = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listMyAddresses(req.customer!.id));
});

export const postMyAddress = asyncHandler(async (req: Request, res: Response) => {
  const input = addressSchema.parse(req.body);
  sendSuccess(res, await addMyAddress(req.customer!.id, input), "Address added", 201);
});

export const patchMyAddress = asyncHandler(async (req: Request, res: Response) => {
  const input = addressSchema.partial().parse(req.body);
  sendSuccess(res, await updateMyAddress(req.customer!.id, req.params.id, input), "Address updated");
});

export const removeMyAddress = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await deleteMyAddress(req.customer!.id, req.params.id), "Address removed");
});
