import type { Request, Response } from "express";
import { ApiError } from "../../lib/api-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getSeoByPath } from "./seo.service.js";

export const getPublicSeoByPath = asyncHandler(async (req: Request, res: Response) => {
  const pagePath = String(req.query.path ?? "");
  if (!pagePath) throw ApiError.badRequest("path query param is required");
  sendSuccess(res, await getSeoByPath(pagePath));
});
