import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import {
  getBookings,
  getBooking,
  postOfflineBooking,
  patchBookingStatus,
  patchBookingDetails,
  patchAssignPandit,
  postBookingPayment,
  postBookingNote,
} from "./admin-bookings.controller.js";

export const adminBookingsRouter = Router();

adminBookingsRouter.use(requireAdminAuth);

adminBookingsRouter.get("/", requirePermission(PERMISSIONS.BOOKINGS_VIEW), getBookings);
adminBookingsRouter.get("/:id", requirePermission(PERMISSIONS.BOOKINGS_VIEW), getBooking);
adminBookingsRouter.post("/offline", requirePermission(PERMISSIONS.BOOKINGS_CREATE), postOfflineBooking);
adminBookingsRouter.patch("/:id/status", requirePermission(PERMISSIONS.BOOKINGS_EDIT), patchBookingStatus);
adminBookingsRouter.patch("/:id/details", requirePermission(PERMISSIONS.BOOKINGS_EDIT), patchBookingDetails);
adminBookingsRouter.patch("/:id/assign-pandit", requirePermission(PERMISSIONS.BOOKINGS_ASSIGN_PANDIT), patchAssignPandit);
adminBookingsRouter.post("/:id/payments", requirePermission(PERMISSIONS.BOOKINGS_EDIT), postBookingPayment);
adminBookingsRouter.post("/:id/notes", requirePermission(PERMISSIONS.BOOKINGS_EDIT), postBookingNote);
