import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getSeoSetting,
  getSeoSettings,
  patchSeoSetting,
  postSeoSetting,
  removeSeoSetting,
} from "./admin-seo.controller.js";

export const adminSeoRouter = Router();

adminSeoRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.SEO_MANAGE));

adminSeoRouter.get("/", getSeoSettings);
adminSeoRouter.get("/:id", getSeoSetting);
adminSeoRouter.post("/", postSeoSetting);
adminSeoRouter.patch("/:id", patchSeoSetting);
adminSeoRouter.delete("/:id", removeSeoSetting);
