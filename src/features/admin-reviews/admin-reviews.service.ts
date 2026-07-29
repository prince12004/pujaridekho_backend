import { ApiError } from "../../lib/api-error.js";
import { ReviewModel } from "../../models/review.model.js";

export async function listReviews(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  return ReviewModel.find(filter).sort({ createdAt: -1 });
}

export async function updateReviewStatus(id: string, status: string) {
  const review = await ReviewModel.findById(id);
  if (!review) throw ApiError.notFound("Review not found");
  review.status = status as (typeof review)["status"];
  await review.save();
  return review;
}

export async function deleteReview(id: string) {
  const review = await ReviewModel.findById(id);
  if (!review) throw ApiError.notFound("Review not found");
  await review.deleteOne();
}
