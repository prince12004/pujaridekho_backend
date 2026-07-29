import { Router } from "express";
import { postValidateCoupon } from "./coupons.controller.js";

export const couponsRouter = Router();

couponsRouter.post("/validate", postValidateCoupon);
