import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../lib/api-error.js";

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

export function requireCrmAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Unauthorized"));
  }
  try {
    req.crmUser = jwt.verify(auth.slice("Bearer ".length), env.CRM_JWT_SECRET) as CrmAuthContext;
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
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
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(auth.slice("Bearer ".length), env.CRM_JWT_SECRET) as CrmAuthContext;
      const isReadOnlyPost = READ_ONLY_POST_URL_SUFFIXES.some((s) => req.originalUrl.endsWith(s));
      if (
        decoded.role === "superadmin" &&
        ["POST", "PUT", "DELETE", "PATCH"].includes(req.method) &&
        !isReadOnlyPost
      ) {
        return next(ApiError.forbidden("Super admin is read-only"));
      }
    } catch {
      // Invalid/expired token — let requireCrmAuth on the actual route handle it.
    }
  }
  next();
}
