import { Router } from "express";
import { requirePanditAuth } from "../../middlewares/pandit-auth.js";
import { upload } from "../../lib/upload.js";
import {
  getBookingDetails,
  getBookings,
  getDashboard,
  getDeposits,
  getDues,
  getEarnings,
  getHome,
  getNotifications,
  getProfile,
  getRatings,
  postAvailability,
  postBookingComplete,
  postBookingExtraAmount,
  postBookingExtraAssets,
  postBookingImages,
  postBookingPayment,
  postBookingReached,
  postBookingReachedOtp,
  postBookingStart,
  postPayDues,
} from "./pandit-app.controller.js";

export const panditAppRouter = Router();

panditAppRouter.use(requirePanditAuth);

panditAppRouter.get("/profile", getProfile);
panditAppRouter.post("/availability", postAvailability);

panditAppRouter.get("/home", getHome);

panditAppRouter.get("/bookings", getBookings);
panditAppRouter.get("/bookings/:id", getBookingDetails);
panditAppRouter.post("/bookings/:id/reached/otp", postBookingReachedOtp);
panditAppRouter.post("/bookings/:id/reached", postBookingReached);
panditAppRouter.post("/bookings/:id/start", postBookingStart);
panditAppRouter.post("/bookings/:id/images", upload.array("images", 10), postBookingImages);
panditAppRouter.post("/bookings/:id/extra-amount", postBookingExtraAmount);
panditAppRouter.post("/bookings/:id/extra-assets", postBookingExtraAssets);
panditAppRouter.post("/bookings/:id/payment", postBookingPayment);
panditAppRouter.post("/bookings/:id/complete", postBookingComplete);

panditAppRouter.get("/dashboard", getDashboard);
panditAppRouter.get("/earnings", getEarnings);
panditAppRouter.get("/dues", getDues);
panditAppRouter.post("/dues/pay", postPayDues);
panditAppRouter.get("/deposits", getDeposits);

panditAppRouter.get("/notifications", getNotifications);
panditAppRouter.get("/ratings", getRatings);
