import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getPage, getPages, patchPage, postPage, removePage } from "./admin-pages.controller.js";

export const adminPagesRouter = Router();

adminPagesRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CMS_MANAGE));

adminPagesRouter.get("/", getPages);
adminPagesRouter.get("/:id", getPage);
adminPagesRouter.post("/", postPage);
adminPagesRouter.patch("/:id", patchPage);
adminPagesRouter.delete("/:id", removePage);
