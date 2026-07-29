import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getReportsOverview } from "./admin-reports.service.js";

export const getReportsOverviewHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getReportsOverview());
});
