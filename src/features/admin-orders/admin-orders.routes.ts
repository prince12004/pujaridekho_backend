import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getOrders, getOrder, patchOrderStatus } from "./admin-orders.controller.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.ECOMMERCE_MANAGE));

adminOrdersRouter.get("/", getOrders);
adminOrdersRouter.get("/:id", getOrder);
adminOrdersRouter.patch("/:id/status", patchOrderStatus);
