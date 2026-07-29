import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { ALL_PERMISSIONS, WILDCARD_PERMISSION } from "../../lib/permissions.js";
import {
  createAdminUser,
  createRole,
  deleteRole,
  listAdminUsers,
  listRoles,
  updateAdminUserStatus,
  updateRole,
} from "./admin-roles.service.js";

const permissionValue = z.union([z.literal(WILDCARD_PERMISSION), z.enum(ALL_PERMISSIONS as [string, ...string[]])]);

export const getPermissionCatalog = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { permissions: ALL_PERMISSIONS, wildcard: WILDCARD_PERMISSION });
});

export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listRoles());
});

const roleSchema = z.object({ name: z.string().min(1), permissions: z.array(permissionValue) });

export const postRole = asyncHandler(async (req: Request, res: Response) => {
  const input = roleSchema.parse(req.body);
  const role = await createRole(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Role",
    entityId: role._id.toString(),
    description: `Created role "${role.name}"`,
    after: role,
  });
  sendSuccess(res, role, "Role created", 201);
});

export const patchRole = asyncHandler(async (req: Request, res: Response) => {
  const input = roleSchema.partial().parse(req.body);
  const role = await updateRole(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Role",
    entityId: role._id.toString(),
    description: `Updated role "${role.name}"`,
    after: role,
  });
  sendSuccess(res, role, "Role updated");
});

export const removeRole = asyncHandler(async (req: Request, res: Response) => {
  await deleteRole(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Role",
    entityId: req.params.id,
    description: "Deleted role",
  });
  sendSuccess(res, null, "Role deleted");
});

export const getAdminUsers = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listAdminUsers());
});

const adminUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().min(1),
});

export const postAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const input = adminUserSchema.parse(req.body);
  const user = await createAdminUser(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "AdminUser",
    entityId: user._id.toString(),
    description: `Created admin user "${user.name}" (${user.email})`,
  });
  sendSuccess(res, { id: user._id, name: user.name, email: user.email }, "Admin user created", 201);
});

const statusSchema = z.object({ status: z.enum(["active", "suspended"]) });

export const patchAdminUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = statusSchema.parse(req.body);
  const user = await updateAdminUserStatus(req.params.id, status);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "AdminUser",
    entityId: user._id.toString(),
    description: `Set admin user "${user.name}" status to ${status}`,
  });
  sendSuccess(res, user, "Admin user status updated");
});
