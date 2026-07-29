import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { getMyInvoice, getMyInvoicePdf, getMyInvoices } from "./account-invoices.controller.js";

export const accountInvoicesRouter = Router();

accountInvoicesRouter.use(requireCustomerAuth);
accountInvoicesRouter.get("/", getMyInvoices);
accountInvoicesRouter.get("/:type/:id/pdf", getMyInvoicePdf);
accountInvoicesRouter.get("/:type/:id", getMyInvoice);
