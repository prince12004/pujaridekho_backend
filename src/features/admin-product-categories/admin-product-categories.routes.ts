import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getProductCategories,
  getProductCategory,
  postProductCategory,
  patchProductCategory,
  removeProductCategory,
} from "./admin-product-categories.controller.js";

export const adminProductCategoriesRouter = Router();

adminProductCategoriesRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.ECOMMERCE_MANAGE));

adminProductCategoriesRouter.get("/", getProductCategories);
adminProductCategoriesRouter.get("/:id", getProductCategory);
adminProductCategoriesRouter.post("/", postProductCategory);
adminProductCategoriesRouter.patch("/:id", patchProductCategory);
adminProductCategoriesRouter.delete("/:id", removeProductCategory);
