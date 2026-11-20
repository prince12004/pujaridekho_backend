import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getSiteStats } from "./stats.service.js";

export const statsRouter = Router();

statsRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await getSiteStats());
  }),
);
