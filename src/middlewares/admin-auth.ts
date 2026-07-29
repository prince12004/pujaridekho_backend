import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../lib/api-error.js";
import { AdminUserModel } from "../models/admin-user.model.js";
import { RoleModel } from "../models/role.model.js";
import { roleHasPermission } from "../lib/permissions.js";

export interface AdminAuthContext {
  id: string;
  name: string;
  email: string;
  roleName: string;
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminAuthContext;
    }
  }
}

interface AdminTokenPayload {
  sub: string;
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Admin authentication required");
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;

    const user = await AdminUserModel.findById(payload.sub);
    if (!user || user.status !== "active") {
      throw ApiError.unauthorized("Session is no longer valid");
    }

    const role = await RoleModel.findById(user.role);
    if (!role) {
      throw ApiError.unauthorized("Role not found for this account");
    }

    req.admin = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      roleName: role.name,
      permissions: role.permissions,
    };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired admin session"));
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(ApiError.unauthorized("Admin authentication required"));
    }
    if (!roleHasPermission(req.admin.permissions, permission)) {
      return next(ApiError.forbidden(`Missing required permission: ${permission}`));
    }
    next();
  };
}
