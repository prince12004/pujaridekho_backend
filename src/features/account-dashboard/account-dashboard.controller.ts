import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getDashboardSummary } from "./account-dashboard.service.js";

export const getMyDashboard = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getDashboardSummary(req.customer!.id));
});


