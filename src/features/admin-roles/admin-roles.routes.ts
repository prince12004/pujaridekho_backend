import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getPermissionCatalog,
  getRoles,
  postRole,
  patchRole,
  removeRole,
  getAdminUsers,
  postAdminUser,
  patchAdminUserStatus,
} from "./admin-roles.controller.js";

export const adminRolesRouter = Router();

adminRolesRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.USERS_MANAGE));

adminRolesRouter.get("/permissions", getPermissionCatalog);
adminRolesRouter.get("/", getRoles);
adminRolesRouter.post("/", postRole);
adminRolesRouter.patch("/:id", patchRole);
adminRolesRouter.delete("/:id", removeRole);

adminRolesRouter.get("/admin-users", getAdminUsers);
adminRolesRouter.post("/admin-users", postAdminUser);
adminRolesRouter.patch("/admin-users/:id/status", patchAdminUserStatus);
