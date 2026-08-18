import { Router } from "express";
import { requireWebsiteApiKey } from "../../middlewares/website-api-auth.js";
import { deletePanditBooking, getAvailability, getConfirmedBookings, getPandits, postPanditBooking, putBooking } from "./crm.controller.js";

export const crmRouter = Router();

crmRouter.use(requireWebsiteApiKey);

crmRouter.get("/pandits", getPandits);
crmRouter.get("/pandits/availability", getAvailability);
crmRouter.post("/pandits/:id/bookings", postPanditBooking);
crmRouter.delete("/pandits/:id/bookings/:bookingRef", deletePanditBooking);
crmRouter.get("/bookings", getConfirmedBookings);
crmRouter.put("/bookings/:websiteBookingId", putBooking);
