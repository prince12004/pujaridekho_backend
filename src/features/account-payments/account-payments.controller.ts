import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listMyPayments } from "./account-payments.service.js";

export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listMyPayments(req.customer!.id));
});
