import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getPoojaCategories,
  getPoojaCategory,
  postPoojaCategory,
  patchPoojaCategory,
  removePoojaCategory,
} from "./admin-pooja-categories.controller.js";

export const adminPoojaCategoriesRouter = Router();

adminPoojaCategoriesRouter.use(requireAdminAuth);

adminPoojaCategoriesRouter.get("/", requirePermission(PERMISSIONS.POOJAS_VIEW), getPoojaCategories);
adminPoojaCategoriesRouter.get("/:id", requirePermission(PERMISSIONS.POOJAS_VIEW), getPoojaCategory);
adminPoojaCategoriesRouter.post("/", requirePermission(PERMISSIONS.POOJAS_MANAGE), postPoojaCategory);
adminPoojaCategoriesRouter.patch("/:id", requirePermission(PERMISSIONS.POOJAS_MANAGE), patchPoojaCategory);
adminPoojaCategoriesRouter.delete("/:id", requirePermission(PERMISSIONS.POOJAS_MANAGE), removePoojaCategory);
