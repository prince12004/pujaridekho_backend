import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createCoupon, deleteCoupon, getCouponById, listCoupons, updateCoupon } from "./admin-coupons.service.js";

const couponSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["percentage", "flat"]),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  applicableTo: z.enum(["all", "poojas", "products"]).optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  usageLimit: z.number().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const getCoupons = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listCoupons());
});

export const postCoupon = asyncHandler(async (req: Request, res: Response) => {
  const input = couponSchema.parse(req.body);
  const coupon = await createCoupon(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Coupon",
    entityId: coupon._id.toString(),
    description: `Created coupon "${coupon.code}"`,
  });
  sendSuccess(res, coupon, "Coupon created", 201);
});

export const patchCoupon = asyncHandler(async (req: Request, res: Response) => {
  const input = couponSchema.partial().parse(req.body);
  const coupon = await updateCoupon(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Coupon",
    entityId: coupon._id.toString(),
    description: `Updated coupon "${coupon.code}"`,
  });
  sendSuccess(res, coupon, "Coupon updated");
});

export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await getCouponById(req.params.id);
  await deleteCoupon(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Coupon",
    entityId: req.params.id,
    description: `Deleted coupon "${coupon.code}"`,
  });
  sendSuccess(res, null, "Coupon deleted");
});
