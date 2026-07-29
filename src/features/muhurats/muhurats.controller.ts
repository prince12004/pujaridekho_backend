import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getAvailableMuhurats } from "./muhurats.service.js";

const querySchema = z.object({
  poojaSlug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export const getPublicMuhurats = asyncHandler(async (req: Request, res: Response) => {
  const { poojaSlug, date } = querySchema.parse(req.query);
  sendSuccess(res, await getAvailableMuhurats(poojaSlug, date));
});
