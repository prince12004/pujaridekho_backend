import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getProfile, patchProfile, removeAccount } from "./account-profile.controller.js";

export const accountProfileRouter = Router();

accountProfileRouter.use(requireCustomerAuth);
accountProfileRouter.get("/", getProfile);
accountProfileRouter.patch("/", patchProfile);
accountProfileRouter.delete("/", removeAccount);
