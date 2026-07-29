import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getMuhurat,
  getMuhurats,
  patchMuhurat,
  postCopyMuhurat,
  postMuhurat,
  removeMuhurat,
} from "./admin-muhurats.controller.js";

export const adminMuhuratsRouter = Router();

adminMuhuratsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.POOJAS_MANAGE));

adminMuhuratsRouter.get("/", getMuhurats);
adminMuhuratsRouter.post("/", postMuhurat);
adminMuhuratsRouter.get("/:id", getMuhurat);
adminMuhuratsRouter.patch("/:id", patchMuhurat);
adminMuhuratsRouter.delete("/:id", removeMuhurat);
adminMuhuratsRouter.post("/:id/copy", postCopyMuhurat);
