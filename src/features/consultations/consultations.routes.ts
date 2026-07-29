import { Router } from "express";
import { postConsultation } from "./consultations.controller.js";

export const consultationsRouter = Router();

consultationsRouter.post("/", postConsultation);
