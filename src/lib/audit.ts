import type { Request } from "express";
import { AuditLogModel } from "../models/audit-log.model.js";
import type { AdminAuthContext } from "../middlewares/admin-auth.js";

export async function recordAuditLog(
  req: Request,
  admin: AdminAuthContext,
  entry: {
    action: string;
    entityType: string;
    entityId?: string;
    description: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await AuditLogModel.create({
    admin: admin.id,
    adminName: admin.name,
    ip: req.ip,
    ...entry,
  });
}
