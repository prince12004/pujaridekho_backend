import { Router } from "express";
import { requireAdminAuth } from "../../middlewares/admin-auth.js";
import { getAdminSearch } from "./admin-search.controller.js";

export const adminSearchRouter = Router();

adminSearchRouter.use(requireAdminAuth);
adminSearchRouter.get("/", getAdminSearch);
