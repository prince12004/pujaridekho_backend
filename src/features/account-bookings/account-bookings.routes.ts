import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyBooking, getMyBookings, postCancelRequest, postRescheduleRequest } from "./account-bookings.controller.js";

export const accountBookingsRouter = Router();

accountBookingsRouter.use(requireCustomerAuth);
accountBookingsRouter.get("/", getMyBookings);
accountBookingsRouter.get("/:id", getMyBooking);
accountBookingsRouter.post("/:id/reschedule-request", postRescheduleRequest);
accountBookingsRouter.post("/:id/cancel-request", postCancelRequest);
