import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getAuditLogs } from "./admin-audit-log.controller.js";

export const adminAuditLogRouter = Router();

adminAuditLogRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.AUDIT_VIEW));

adminAuditLogRouter.get("/", getAuditLogs);
