import { ReviewModel } from "../../models/review.model.js";

export async function listPublicReviews(entityType: string, entityId: string) {
  return ReviewModel.find({ entityType, entityId, status: "approved" }).sort({ createdAt: -1 });
}
