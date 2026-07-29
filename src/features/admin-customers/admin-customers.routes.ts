import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getCustomers, getCustomer, postCustomer, patchCustomer } from "./admin-customers.controller.js";

export const adminCustomersRouter = Router();

adminCustomersRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CUSTOMERS_VIEW));

adminCustomersRouter.get("/", getCustomers);
adminCustomersRouter.get("/:id", getCustomer);
adminCustomersRouter.post("/", postCustomer);
adminCustomersRouter.patch("/:id", patchCustomer);
