import { Router } from "express";
import { postCrmLogin } from "./crm-auth.controller.js";

export const crmAuthRouter = Router();

// Public — no requireCrmAuth, same as the original /api/auth/login.
crmAuthRouter.post("/login", postCrmLogin);
