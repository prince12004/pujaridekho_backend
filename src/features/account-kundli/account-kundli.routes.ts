import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyKundli, getMyKundlis, postMyKundli } from "./account-kundli.controller.js";

export const accountKundliRouter = Router();

accountKundliRouter.use(requireCustomerAuth);
accountKundliRouter.get("/", getMyKundlis);
accountKundliRouter.post("/", postMyKundli);
accountKundliRouter.get("/:id", getMyKundli);
