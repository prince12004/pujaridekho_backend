import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getBlogs, getBlog, postBlog, patchBlog, removeBlog } from "./admin-blogs.controller.js";

export const adminBlogsRouter = Router();

adminBlogsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CONTENT_MANAGE));

adminBlogsRouter.get("/", getBlogs);
adminBlogsRouter.get("/:id", getBlog);
adminBlogsRouter.post("/", postBlog);
adminBlogsRouter.patch("/:id", patchBlog);
adminBlogsRouter.delete("/:id", removeBlog);
