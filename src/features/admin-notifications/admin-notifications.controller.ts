import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "./admin-notifications.service.js";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  sendSuccess(res, await listNotifications(page, limit));
});

export const patchNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await markNotificationRead(req.params.id));
});

export const patchAllNotificationsRead = asyncHandler(async (_req: Request, res: Response) => {
  await markAllNotificationsRead();
  sendSuccess(res, null, "All notifications marked as read");
});
