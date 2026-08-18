import { Router } from "express";
import { postHomeBookingLead } from "./leads.controller.js";

export const leadsRouter = Router();

leadsRouter.post("/home-booking", postHomeBookingLead);
