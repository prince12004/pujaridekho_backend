import { ApiError } from "../../lib/api-error.js";
import { CouponModel } from "../../models/coupon.model.js";

/** Pure calculation — does not consume the coupon's usage count. */
export async function computeCouponDiscount(code: string, amount: number): Promise<number> {
  const coupon = await CouponModel.findOne({ code: code.toUpperCase(), status: "active" });
  if (!coupon) throw ApiError.badRequest("Invalid coupon code");

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) throw ApiError.badRequest("This coupon is not yet active");
  if (coupon.validTo && now > coupon.validTo) throw ApiError.badRequest("This coupon has expired");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw ApiError.badRequest("This coupon has reached its usage limit");
  if (amount < coupon.minOrderValue) {
    throw ApiError.badRequest(`This coupon requires a minimum amount of ₹${coupon.minOrderValue}`);
  }

  let discount = coupon.type === "percentage" ? (amount * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, amount);

  return Math.round(discount);
}

export async function validateCoupon(code: string, amount: number) {
  const discount = await computeCouponDiscount(code, amount);
  return { discount, finalAmount: Math.max(amount - discount, 0) };
}

/** Called once an order/booking using this coupon is actually confirmed. */
export async function redeemCoupon(code: string) {
  await CouponModel.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}
