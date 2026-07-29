import { Router } from "express";
import { getReviews, postReview } from "./reviews.controller.js";

export const reviewsRouter = Router();

reviewsRouter.get("/", getReviews);
reviewsRouter.post("/", postReview);
