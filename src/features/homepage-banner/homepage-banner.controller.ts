import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getOrCreateBanner } from "./homepage-banner.service.js";

export const getPublicHomepageBanner = asyncHandler(async (_req: Request, res: Response) => {
  const banner = await getOrCreateBanner();
  sendSuccess(res, banner);
});
