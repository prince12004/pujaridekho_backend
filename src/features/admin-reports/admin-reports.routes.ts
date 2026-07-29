import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getReportsOverviewHandler } from "./admin-reports.controller.js";

export const adminReportsRouter = Router();

adminReportsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.REPORTS_VIEW));

adminReportsRouter.get("/overview", getReportsOverviewHandler);
