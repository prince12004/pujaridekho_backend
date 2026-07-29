import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyReviews, postMyReview } from "./account-reviews.controller.js";

export const accountReviewsRouter = Router();

accountReviewsRouter.use(requireCustomerAuth);
accountReviewsRouter.get("/", getMyReviews);
accountReviewsRouter.post("/", postMyReview);
