import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyOrder, getMyOrders, postOrderCancelRequest } from "./account-orders.controller.js";

export const accountOrdersRouter = Router();

accountOrdersRouter.use(requireCustomerAuth);
accountOrdersRouter.get("/", getMyOrders);
accountOrdersRouter.get("/:id", getMyOrder);
accountOrdersRouter.post("/:id/cancel-request", postOrderCancelRequest);
