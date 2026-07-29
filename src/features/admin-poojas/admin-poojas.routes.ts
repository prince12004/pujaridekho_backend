import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getPoojas, getPooja, postPooja, patchPooja, removePooja } from "./admin-poojas.controller.js";

export const adminPoojasRouter = Router();

adminPoojasRouter.use(requireAdminAuth);

adminPoojasRouter.get("/", requirePermission(PERMISSIONS.POOJAS_VIEW), getPoojas);
adminPoojasRouter.get("/:id", requirePermission(PERMISSIONS.POOJAS_VIEW), getPooja);
adminPoojasRouter.post("/", requirePermission(PERMISSIONS.POOJAS_MANAGE), postPooja);
adminPoojasRouter.patch("/:id", requirePermission(PERMISSIONS.POOJAS_MANAGE), patchPooja);
adminPoojasRouter.delete("/:id", requirePermission(PERMISSIONS.POOJAS_MANAGE), removePooja);
