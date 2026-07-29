import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyPayments } from "./account-payments.controller.js";

export const accountPaymentsRouter = Router();

accountPaymentsRouter.use(requireCustomerAuth);
accountPaymentsRouter.get("/", getMyPayments);
