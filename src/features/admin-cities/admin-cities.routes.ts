import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getCities, postCity, patchCity, removeCity } from "./admin-cities.controller.js";

export const adminCitiesRouter = Router();

adminCitiesRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.SETTINGS_MANAGE));

adminCitiesRouter.get("/", getCities);
adminCitiesRouter.post("/", postCity);
adminCitiesRouter.patch("/:id", patchCity);
adminCitiesRouter.delete("/:id", removeCity);
