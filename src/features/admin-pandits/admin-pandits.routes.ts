import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getPandits,
  getPandit,
  postPandit,
  patchPandit,
  removePandit,
  getApplications,
  getApplication,
  patchApplication,
  postConvertApplication,
} from "./admin-pandits.controller.js";

export const adminPanditsRouter = Router();

adminPanditsRouter.use(requireAdminAuth);

adminPanditsRouter.get("/applications", requirePermission(PERMISSIONS.PANDIT_APPLICATIONS_MANAGE), getApplications);
adminPanditsRouter.get("/applications/:id", requirePermission(PERMISSIONS.PANDIT_APPLICATIONS_MANAGE), getApplication);
adminPanditsRouter.patch("/applications/:id", requirePermission(PERMISSIONS.PANDIT_APPLICATIONS_MANAGE), patchApplication);
adminPanditsRouter.post(
  "/applications/:id/convert",
  requirePermission(PERMISSIONS.PANDIT_APPLICATIONS_MANAGE),
  postConvertApplication,
);

adminPanditsRouter.get("/", requirePermission(PERMISSIONS.PANDITS_VIEW), getPandits);
adminPanditsRouter.get("/:id", requirePermission(PERMISSIONS.PANDITS_VIEW), getPandit);
adminPanditsRouter.post("/", requirePermission(PERMISSIONS.PANDITS_MANAGE), postPandit);
adminPanditsRouter.patch("/:id", requirePermission(PERMISSIONS.PANDITS_MANAGE), patchPandit);
adminPanditsRouter.delete("/:id", requirePermission(PERMISSIONS.PANDITS_MANAGE), removePandit);
