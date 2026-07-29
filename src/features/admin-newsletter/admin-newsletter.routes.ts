import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getSubscribers, removeSubscriber } from "./admin-newsletter.controller.js";

export const adminNewsletterRouter = Router();

adminNewsletterRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CONTENT_MANAGE));

adminNewsletterRouter.get("/", getSubscribers);
adminNewsletterRouter.delete("/:id", removeSubscriber);
