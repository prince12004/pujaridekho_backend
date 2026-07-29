import { Schema, model, type InferSchemaType } from "mongoose";

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    applicableTo: { type: String, enum: ["all", "poojas", "products"], default: "all" },
    validFrom: { type: Date },
    validTo: { type: Date },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export type CouponDocument = InferSchemaType<typeof couponSchema>;
export const CouponModel = model("Coupon", couponSchema);
