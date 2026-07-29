import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import {
  getMyConsultation,
  getMyConsultations,
  postConsultationCancel,
  postConsultationReschedule,
} from "./account-consultations.controller.js";

export const accountConsultationsRouter = Router();

accountConsultationsRouter.use(requireCustomerAuth);
accountConsultationsRouter.get("/", getMyConsultations);
accountConsultationsRouter.get("/:id", getMyConsultation);
accountConsultationsRouter.post("/:id/reschedule-request", postConsultationReschedule);
accountConsultationsRouter.post("/:id/cancel-request", postConsultationCancel);
