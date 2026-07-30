import { Router } from "express";
import { getOrder, postOrder } from "./orders.controller.js";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";

export const ordersRouter = Router();

ordersRouter.post("/", requireCustomerAuth, postOrder);
ordersRouter.get("/:id", getOrder);
