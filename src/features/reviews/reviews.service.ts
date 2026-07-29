import { ReviewModel } from "../../models/review.model.js";

export async function listPublicReviews(entityType: string, entityId: string) {
  return ReviewModel.find({ entityType, entityId, status: "approved" }).sort({ createdAt: -1 });
}

export async function submitReview(input: { entityType: string; entityId: string; customerName: string; rating: number; comment: string }) {
  return ReviewModel.create({ ...input, status: "pending" });
}
