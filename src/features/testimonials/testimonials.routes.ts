import { Router } from "express";
import { getPublicTestimonials } from "./testimonials.controller.js";

export const testimonialsRouter = Router();

testimonialsRouter.get("/", getPublicTestimonials);
