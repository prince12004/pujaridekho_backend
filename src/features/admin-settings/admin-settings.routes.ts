import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getAdminSettings, patchAdminSettings } from "./admin-settings.controller.js";

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.SETTINGS_MANAGE));

adminSettingsRouter.get("/", getAdminSettings);
adminSettingsRouter.patch("/", patchAdminSettings);
