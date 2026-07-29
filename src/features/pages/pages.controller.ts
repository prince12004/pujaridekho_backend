import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getPublishedPageBySlug } from "./pages.service.js";

export const getPublicPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await getPublishedPageBySlug(req.params.slug);
  sendSuccess(res, page);
});
