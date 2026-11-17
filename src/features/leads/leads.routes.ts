import { Router } from "express";
import { postCheckoutLead, postHomeBookingLead } from "./leads.controller.js";

export const leadsRouter = Router();

leadsRouter.post("/home-booking", postHomeBookingLead);
leadsRouter.post("/checkout", postCheckoutLead);
