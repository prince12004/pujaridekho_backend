import { Router } from "express";
import { requirePanditAuth } from "../../middlewares/pandit-auth.js";
import { postChangePassword, postForgotPassword, postLogin, postLogout, postResetPassword } from "./pandit-auth.controller.js";

export const panditAuthRouter = Router();

panditAuthRouter.post("/login", postLogin);
panditAuthRouter.post("/logout", postLogout);
panditAuthRouter.post("/forgot-password", postForgotPassword);
panditAuthRouter.post("/reset-password", postResetPassword);
panditAuthRouter.post("/change-password", requirePanditAuth, postChangePassword);
