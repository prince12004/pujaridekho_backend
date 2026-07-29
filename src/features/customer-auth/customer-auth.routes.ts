import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import {
  getMe,
  postChangeMobileSendOtp,
  postChangeMobileVerify,
  postLogout,
  postRefresh,
  postSendOtp,
  postVerifyOtp,
} from "./customer-auth.controller.js";

export const customerAuthRouter = Router();

customerAuthRouter.post("/send-otp", postSendOtp);
customerAuthRouter.post("/verify-otp", postVerifyOtp);
customerAuthRouter.post("/refresh", postRefresh);
customerAuthRouter.post("/logout", postLogout);
customerAuthRouter.get("/me", requireCustomerAuth, getMe);
customerAuthRouter.post("/change-mobile/send-otp", requireCustomerAuth, postChangeMobileSendOtp);
customerAuthRouter.post("/change-mobile/verify", requireCustomerAuth, postChangeMobileVerify);
