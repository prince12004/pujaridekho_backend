import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getReviews, patchReviewStatus, removeReview } from "./admin-reviews.controller.js";

export const adminReviewsRouter = Router();

adminReviewsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.REVIEWS_MANAGE));

adminReviewsRouter.get("/", getReviews);
adminReviewsRouter.patch("/:id", patchReviewStatus);
adminReviewsRouter.delete("/:id", removeReview);
