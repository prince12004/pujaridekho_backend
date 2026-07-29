import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyDashboard } from "./account-dashboard.controller.js";

export const accountDashboardRouter = Router();

accountDashboardRouter.use(requireCustomerAuth);
accountDashboardRouter.get("/", getMyDashboard);
