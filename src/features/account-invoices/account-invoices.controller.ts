import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { streamInvoicePdf } from "../../lib/invoice-pdf.js";
import { getMyInvoiceDetail, listMyInvoices } from "./account-invoices.service.js";

export const getMyInvoices = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listMyInvoices(req.customer!.id));
});

const paramsSchema = z.object({ type: z.enum(["booking", "order", "consultation"]), id: z.string().min(1) });

export const getMyInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = paramsSchema.parse(req.params);
  sendSuccess(res, await getMyInvoiceDetail(req.customer!.id, type, id));
});

export const getMyInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = paramsSchema.parse(req.params);
  const invoice = await getMyInvoiceDetail(req.customer!.id, type, id);
  streamInvoicePdf(res, invoice);
});
