import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getOrCreateSettings } from "./settings.service.js";

export const getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getOrCreateSettings());
});
