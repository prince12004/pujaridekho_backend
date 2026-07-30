import { Router } from "express";
import { postBooking } from "./bookings.controller.js";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";

export const bookingsRouter = Router();

bookingsRouter.post("/", requireCustomerAuth, postBooking);
