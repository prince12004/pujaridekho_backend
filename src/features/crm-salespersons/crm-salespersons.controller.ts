import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import {
  createSalesPerson,
  listSalesPeople,
  toSalesPersonJson,
  updateSalesPerson,
} from "./crm-salespersons.service.js";

export const getSalesPeople = asyncHandler(async (_req: Request, res: Response) => {
  const docs = await listSalesPeople();
  sendSuccess(res, docs.map(toSalesPersonJson));
});

const createSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "name is required"),
  phone: z.string().min(1, "phone is required"),
  password: z.string().min(1, "password is required"),
  createdAt: z.string().optional(),
});

export const postSalesPerson = asyncHandler(async (req: Request, res: Response) => {
  const input = createSchema.parse(req.body);
  const doc = await createSalesPerson(input);
  sendSuccess(res, toSalesPersonJson(doc), undefined, 201);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  active: z.boolean().optional(),
  password: z.string().min(1).optional(),
});

export const putSalesPerson = asyncHandler(async (req: Request, res: Response) => {
  const input = updateSchema.parse(req.body);
  const doc = await updateSalesPerson(req.params.id, input);
  sendSuccess(res, toSalesPersonJson(doc));
});
