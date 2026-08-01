import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listPublicReviews } from "./reviews.service.js";

const listQuerySchema = z.object({
  entityType: z.enum(["pooja", "pandit", "product", "festival"]),
  entityId: z.string().min(1),
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = listQuerySchema.parse(req.query);
  sendSuccess(res, await listPublicReviews(entityType, entityId));
});
