import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getFestivals, getFestival, postFestival, patchFestival, removeFestival } from "./admin-festivals.controller.js";

export const adminFestivalsRouter = Router();

adminFestivalsRouter.use(requireAdminAuth);

adminFestivalsRouter.get("/", requirePermission(PERMISSIONS.FESTIVALS_MANAGE), getFestivals);
adminFestivalsRouter.get("/:id", requirePermission(PERMISSIONS.FESTIVALS_MANAGE), getFestival);
adminFestivalsRouter.post("/", requirePermission(PERMISSIONS.FESTIVALS_MANAGE), postFestival);
adminFestivalsRouter.patch("/:id", requirePermission(PERMISSIONS.FESTIVALS_MANAGE), patchFestival);
adminFestivalsRouter.delete("/:id", requirePermission(PERMISSIONS.FESTIVALS_MANAGE), removeFestival);
