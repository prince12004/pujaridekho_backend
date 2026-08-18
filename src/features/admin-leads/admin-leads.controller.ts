import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listHomeLeads } from "./admin-leads.service.js";

export const getHomeLeads = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listHomeLeads());
});
