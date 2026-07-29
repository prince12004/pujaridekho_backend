import { Router } from "express";
import { getOrder, postOrder } from "./orders.controller.js";

export const ordersRouter = Router();

ordersRouter.post("/", postOrder);
ordersRouter.get("/:id", getOrder);
