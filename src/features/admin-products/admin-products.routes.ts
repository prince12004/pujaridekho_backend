import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getProducts, getProduct, postProduct, patchProduct, removeProduct } from "./admin-products.controller.js";

export const adminProductsRouter = Router();

adminProductsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.ECOMMERCE_MANAGE));

adminProductsRouter.get("/", getProducts);
adminProductsRouter.get("/:id", getProduct);
adminProductsRouter.post("/", postProduct);
adminProductsRouter.patch("/:id", patchProduct);
adminProductsRouter.delete("/:id", removeProduct);
