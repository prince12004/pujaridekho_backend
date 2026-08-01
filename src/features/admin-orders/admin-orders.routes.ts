import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS, WILDCARD_PERMISSION } from "../../lib/permissions.js";
import { getOrders, getOrder, patchOrderStatus, removeOrder } from "./admin-orders.controller.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.ECOMMERCE_MANAGE));

adminOrdersRouter.get("/", getOrders);
adminOrdersRouter.get("/:id", getOrder);
adminOrdersRouter.patch("/:id/status", patchOrderStatus);
// Deleting an order is irreversible and destroys financial records, so it's restricted to Super Admin (wildcard permission) only.
adminOrdersRouter.delete("/:id", requirePermission(WILDCARD_PERMISSION), removeOrder);
