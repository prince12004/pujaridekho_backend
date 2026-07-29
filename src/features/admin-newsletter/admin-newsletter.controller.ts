import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { deleteSubscriber, listSubscribers } from "./admin-newsletter.service.js";

export const getSubscribers = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listSubscribers());
});

export const removeSubscriber = asyncHandler(async (req: Request, res: Response) => {
  await deleteSubscriber(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "NewsletterSubscriber",
    entityId: req.params.id,
    description: "Removed newsletter subscriber",
  });
  sendSuccess(res, null, "Subscriber removed");
});
