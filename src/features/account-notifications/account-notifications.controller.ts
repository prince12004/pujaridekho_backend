import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listMyNotifications, markAllMyNotificationsRead, markMyNotificationRead } from "./account-notifications.service.js";

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  sendSuccess(res, await listMyNotifications(req.customer!.id, page, limit));
});

export const patchMyNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await markMyNotificationRead(req.customer!.id, req.params.id));
});

export const patchAllMyNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await markAllMyNotificationsRead(req.customer!.id);
  sendSuccess(res, null, "All notifications marked as read");
});
