import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getConsultations, getConsultation, patchConsultation } from "./admin-consultations.controller.js";

export const adminConsultationsRouter = Router();

adminConsultationsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CONSULTATIONS_MANAGE));

adminConsultationsRouter.get("/", getConsultations);
adminConsultationsRouter.get("/:id", getConsultation);
adminConsultationsRouter.patch("/:id", patchConsultation);
