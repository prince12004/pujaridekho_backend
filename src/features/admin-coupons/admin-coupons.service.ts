import { ApiError } from "../../lib/api-error.js";
import { CouponModel } from "../../models/coupon.model.js";

export async function listCoupons() {
  return CouponModel.find().sort({ createdAt: -1 });
}

export async function getCouponById(id: string) {
  const coupon = await CouponModel.findById(id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return coupon;
}

export async function createCoupon(input: Record<string, unknown>) {
  const code = String(input.code).toUpperCase();
  const existing = await CouponModel.findOne({ code });
  if (existing) throw ApiError.conflict("A coupon with this code already exists");
  return CouponModel.create({ ...input, code });
}

export async function updateCoupon(id: string, input: Record<string, unknown>) {
  const coupon = await getCouponById(id);
  Object.assign(coupon, input);
  if (input.code) coupon.code = String(input.code).toUpperCase();
  await coupon.save();
  return coupon;
}

export async function deleteCoupon(id: string) {
  const coupon = await getCouponById(id);
  await coupon.deleteOne();
}
