import { Router } from "express";
import { postInitiatePayment, postPayUCallback } from "./payments.controller.js";

export const paymentsRouter = Router();

paymentsRouter.post("/payu/initiate", postInitiatePayment);
paymentsRouter.post("/payu/callback", postPayUCallback);
