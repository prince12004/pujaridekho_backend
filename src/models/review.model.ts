import { Schema, model, type InferSchemaType } from "mongoose";

export const REVIEW_ENTITY_TYPES = ["pooja", "pandit", "product", "consultation", "festival"] as const;

const reviewSchema = new Schema(
  {
    entityType: { type: String, enum: REVIEW_ENTITY_TYPES, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    photos: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true },
);

reviewSchema.index({ entityType: 1, entityId: 1, status: 1 });
reviewSchema.index({ customer: 1 });

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;
export const ReviewModel = model("Review", reviewSchema);
