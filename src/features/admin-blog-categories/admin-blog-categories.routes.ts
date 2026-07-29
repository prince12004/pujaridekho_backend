import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getBlogCategories,
  getBlogCategory,
  postBlogCategory,
  patchBlogCategory,
  removeBlogCategory,
} from "./admin-blog-categories.controller.js";

export const adminBlogCategoriesRouter = Router();

adminBlogCategoriesRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CONTENT_MANAGE));

adminBlogCategoriesRouter.get("/", getBlogCategories);
adminBlogCategoriesRouter.get("/:id", getBlogCategory);
adminBlogCategoriesRouter.post("/", postBlogCategory);
adminBlogCategoriesRouter.patch("/:id", patchBlogCategory);
adminBlogCategoriesRouter.delete("/:id", removeBlogCategory);
