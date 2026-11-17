import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listHomeLeads } from "./admin-leads.service.js";

export const getHomeLeads = asyncHandler(async (req: Request, res: Response) => {
  const source = typeof req.query.source === "string" ? req.query.source : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  sendSuccess(res, await listHomeLeads({ source, status }));
});
