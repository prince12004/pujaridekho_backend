import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { deleteReview, listReviews, updateReviewStatus } from "./admin-reviews.service.js";

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  sendSuccess(res, await listReviews(status));
});

const statusSchema = z.object({ status: z.enum(["pending", "approved", "rejected"]) });

export const patchReviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = statusSchema.parse(req.body);
  const review = await updateReviewStatus(req.params.id, status);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Review",
    entityId: review._id.toString(),
    description: `Set review status to ${status}`,
  });
  sendSuccess(res, review, "Review updated");
});

export const removeReview = asyncHandler(async (req: Request, res: Response) => {
  await deleteReview(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Review",
    entityId: req.params.id,
    description: "Deleted review",
  });
  sendSuccess(res, null, "Review deleted");
});
