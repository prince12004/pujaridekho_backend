import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getAdminHomepageBanner, patchAdminHomepageBanner } from "./admin-homepage-banner.controller.js";

export const adminHomepageBannerRouter = Router();

adminHomepageBannerRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CMS_MANAGE));

adminHomepageBannerRouter.get("/", getAdminHomepageBanner);
adminHomepageBannerRouter.patch("/", patchAdminHomepageBanner);
