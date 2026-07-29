import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getTestimonials, postTestimonial, patchTestimonial, removeTestimonial } from "./admin-testimonials.controller.js";

export const adminTestimonialsRouter = Router();

adminTestimonialsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.REVIEWS_MANAGE));

adminTestimonialsRouter.get("/", getTestimonials);
adminTestimonialsRouter.post("/", postTestimonial);
adminTestimonialsRouter.patch("/:id", patchTestimonial);
adminTestimonialsRouter.delete("/:id", removeTestimonial);
