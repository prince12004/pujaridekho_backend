import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import {
  getMyNotifications,
  patchAllMyNotificationsRead,
  patchMyNotificationRead,
} from "./account-notifications.controller.js";

export const accountNotificationsRouter = Router();

accountNotificationsRouter.use(requireCustomerAuth);
accountNotificationsRouter.get("/", getMyNotifications);
accountNotificationsRouter.patch("/read-all", patchAllMyNotificationsRead);
accountNotificationsRouter.patch("/:id/read", patchMyNotificationRead);
