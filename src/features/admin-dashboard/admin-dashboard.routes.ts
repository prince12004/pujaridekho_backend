import { Router } from "express";
import { requireAdminAuth } from "../../middlewares/admin-auth.js";
import { getDashboardStats } from "./admin-dashboard.controller.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAdminAuth);
adminDashboardRouter.get("/stats", getDashboardStats);
