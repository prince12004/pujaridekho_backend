import { Router } from "express";
import { requireAdminAuth } from "../../middlewares/admin-auth.js";
import { getNotifications, patchAllNotificationsRead, patchNotificationRead } from "./admin-notifications.controller.js";

export const adminNotificationsRouter = Router();

adminNotificationsRouter.use(requireAdminAuth);

adminNotificationsRouter.get("/", getNotifications);
adminNotificationsRouter.patch("/read-all", patchAllNotificationsRead);
adminNotificationsRouter.patch("/:id/read", patchNotificationRead);
