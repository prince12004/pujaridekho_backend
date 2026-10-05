import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../lib/api-error.js";
import { AdminUserModel } from "../models/admin-user.model.js";
import { RoleModel } from "../models/role.model.js";
import { PERMISSIONS, roleHasPermission } from "../lib/permissions.js";

// Ported from pujaridekhocrm/backend/server.js's requireAuth/requireAdmin/
// requireFullAccess/ownFilter + the global "super admin is read-only" guard.
// Every CRM caller (salesperson or admin/superadmin) authenticates with the
// same JWT, minted by POST /crm-auth/login — carries { role, salesPersonId?,
// name }, which the per-route data scoping below relies on.

export type CrmRole = "admin" | "superadmin" | "salesperson";

export interface CrmAuthContext {
  role: CrmRole;
  name: string;
  salesPersonId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      crmUser?: CrmAuthContext;
    }
  }
}

export function signCrmToken(payload: CrmAuthContext): string {
  return jwt.sign(payload, env.CRM_JWT_SECRET, { expiresIn: "30d" });
}

export async function requireCrmAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Unauthorized"));
  }
  const token = auth.slice("Bearer ".length);

  try {
    req.crmUser = jwt.verify(token, env.CRM_JWT_SECRET) as CrmAuthContext;
    return next();
  } catch {
    // Not a CRM token — fall through and try it as a regular admin-panel
    // session below, rather than failing outright.
  }

  // Adapter: lets an admin-panel user who is ALREADY logged into the main
  // admin panel (regular ADMIN_JWT_SECRET session) call CRM endpoints too,
  // without a separate CRM login — this is the same admin panel managing
  // bookings/pandits/etc, so requiring a second login for CRM would be
  // jarring. Gated on the admin's role actually having a crm:* permission
  // (see lib/permissions.ts), so this never grants CRM access to an admin
  // who wasn't given it. Mapped onto the existing CRM role model: an admin
  // with crm:manage behaves like CRM role "admin" (full read/write); one
  // with only crm:view behaves like CRM role "superadmin" (full read,
  // blocked from mutations by blockSuperadminMutations below) — this does
  // NOT touch or weaken salesperson login, which still only ever works via
  // the CRM_JWT_SECRET token minted by POST /crm-auth/login.
  try {
    const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as { sub: string };
    const user = await AdminUserModel.findById(payload.sub);
    if (!user || user.status !== "active") {
      return next(ApiError.unauthorized("Invalid or expired token"));
    }
    const role = await RoleModel.findById(user.role);
    if (!role) {
      return next(ApiError.unauthorized("Invalid or expired token"));
    }
    const hasManage = roleHasPermission(role.permissions, PERMISSIONS.CRM_MANAGE);
    const hasView = roleHasPermission(role.permissions, PERMISSIONS.CRM_VIEW);
    if (!hasManage && !hasView) {
      return next(ApiError.forbidden("Missing required permission: crm:view"));
    }
    req.crmUser = { role: hasManage ? "admin" : "superadmin", name: user.name };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired token"));
  }
}

// Admin-only routes (salesperson account management, deletes) layer this on
// top of requireCrmAuth.
export function requireCrmAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.crmUser?.role !== "admin") {
    return next(ApiError.forbidden("Admin only"));
  }
  next();
}

// Routes admin AND the read-only super admin (owner) may both call.
export function requireCrmFullAccess(req: Request, _res: Response, next: NextFunction) {
  if (req.crmUser?.role !== "admin" && req.crmUser?.role !== "superadmin") {
    return next(ApiError.forbidden("Admin only"));
  }
  next();
}

export function isCrmAdmin(req: Request): boolean {
  return req.crmUser?.role === "admin";
}
export function crmHasFullAccess(req: Request): boolean {
  return req.crmUser?.role === "admin" || req.crmUser?.role === "superadmin";
}
// Admin/superadmin see/touch everything; a salesperson only ever reaches
// records currently assigned to them.
export function crmOwnFilter(req: Request): Record<string, unknown> {
  return crmHasFullAccess(req) ? {} : { assignedTo: req.crmUser?.salesPersonId };
}

// POST routes that are actually reads (a long id list doesn't fit a query
// string) — exempted from the mutation block below. Matched against the
// request's full URL suffix so this works regardless of which feature
// router it's mounted on.
const READ_ONLY_POST_URL_SUFFIXES = ["/activity-logs/bulk"];

// Single choke point for "super admin is read-only": reject any mutation
// attempt from that role before it reaches a route handler, rather than
// auditing every POST/PUT/DELETE route by hand. Mount on every CRM feature
// router. Decodes the token itself (best-effort, mirrors the original
// server.js global middleware) rather than relying on req.crmUser, so it
// also runs correctly regardless of ordering relative to requireCrmAuth.
export function blockSuperadminMutations(req: Request, _res: Response, next: NextFunction) {
  // Mounted after requireCrmAuth, which already decoded either the CRM
  // token or (via the admin-session adapter above) the admin token into
  // req.crmUser — prefer that rather than re-decoding against
  // CRM_JWT_SECRET only, since an admin-mapped caller's token never
  // verifies against that secret.
  let role = req.crmUser?.role;
  if (!role) {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      try {
        role = (jwt.verify(auth.slice("Bearer ".length), env.CRM_JWT_SECRET) as CrmAuthContext).role;
      } catch {
        // Invalid/expired token — let requireCrmAuth on the actual route handle it.
      }
    }
  }

  const isReadOnlyPost = READ_ONLY_POST_URL_SUFFIXES.some((s) => req.originalUrl.endsWith(s));
  if (role === "superadmin" && ["POST", "PUT", "DELETE", "PATCH"].includes(req.method) && !isReadOnlyPost) {
    return next(ApiError.forbidden("Super admin is read-only"));
  }
  next();
}
