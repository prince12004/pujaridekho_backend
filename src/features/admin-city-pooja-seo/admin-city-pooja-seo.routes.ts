import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getCityPoojaSeoList,
  getCityPoojaSeoOne,
  patchCityPoojaSeo,
  postCityPoojaSeo,
  removeCityPoojaSeo,
} from "./admin-city-pooja-seo.controller.js";

export const adminCityPoojaSeoRouter = Router();

adminCityPoojaSeoRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.SEO_MANAGE));

adminCityPoojaSeoRouter.get("/", getCityPoojaSeoList);
adminCityPoojaSeoRouter.get("/:id", getCityPoojaSeoOne);
adminCityPoojaSeoRouter.post("/", postCityPoojaSeo);
adminCityPoojaSeoRouter.patch("/:id", patchCityPoojaSeo);
adminCityPoojaSeoRouter.delete("/:id", removeCityPoojaSeo);
