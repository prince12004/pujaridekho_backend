import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getHomeLeads } from "./admin-leads.controller.js";

export const adminLeadsRouter = Router();

adminLeadsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CONSULTATIONS_MANAGE));

adminLeadsRouter.get("/", getHomeLeads);
