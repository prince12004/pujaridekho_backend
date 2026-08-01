import { Router } from "express";
import { getReviews } from "./reviews.controller.js";

export const reviewsRouter = Router();

// Submitting a review is customer-authenticated and booking-verified only —
// see features/account-reviews — so this router stays read-only.
reviewsRouter.get("/", getReviews);
