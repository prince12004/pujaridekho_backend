import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getSamagriTemplates,
  getSamagriTemplate,
  postSamagriTemplate,
  patchSamagriTemplate,
  removeSamagriTemplate,
} from "./admin-samagri-templates.controller.js";

export const adminSamagriTemplatesRouter = Router();

adminSamagriTemplatesRouter.use(requireAdminAuth);

adminSamagriTemplatesRouter.get("/", requirePermission(PERMISSIONS.POOJAS_VIEW), getSamagriTemplates);
adminSamagriTemplatesRouter.get("/:id", requirePermission(PERMISSIONS.POOJAS_VIEW), getSamagriTemplate);
adminSamagriTemplatesRouter.post("/", requirePermission(PERMISSIONS.POOJAS_MANAGE), postSamagriTemplate);
adminSamagriTemplatesRouter.patch("/:id", requirePermission(PERMISSIONS.POOJAS_MANAGE), patchSamagriTemplate);
adminSamagriTemplatesRouter.delete("/:id", requirePermission(PERMISSIONS.POOJAS_MANAGE), removeSamagriTemplate);
