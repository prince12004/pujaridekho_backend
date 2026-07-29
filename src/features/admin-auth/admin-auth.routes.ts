import { Router } from "express";
import { getAdminMe, postAdminLogin } from "./admin-auth.controller.js";
import { requireAdminAuth } from "../../middlewares/admin-auth.js";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", postAdminLogin);
adminAuthRouter.get("/me", requireAdminAuth, getAdminMe);
