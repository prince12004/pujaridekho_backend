import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyTicket, getMyTickets, postMyTicket, postMyTicketMessage } from "./account-support.controller.js";

export const accountSupportRouter = Router();

accountSupportRouter.use(requireCustomerAuth);
accountSupportRouter.get("/", getMyTickets);
accountSupportRouter.post("/", postMyTicket);
accountSupportRouter.get("/:id", getMyTicket);
accountSupportRouter.post("/:id/messages", postMyTicketMessage);
