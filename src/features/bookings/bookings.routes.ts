import { Router } from "express";
import { postBooking } from "./bookings.controller.js";

export const bookingsRouter = Router();

bookingsRouter.post("/", postBooking);
