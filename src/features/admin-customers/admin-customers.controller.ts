import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createCustomer, getCustomerById, listCustomers, updateCustomer } from "./admin-customers.service.js";

const addressSchema = z.object({
  fullName: z.string().min(1),
  mobile: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  pincode: z.string().min(1),
  type: z.enum(["home", "office", "other"]).optional(),
  isDefault: z.boolean().optional(),
});

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  addresses: z.array(addressSchema).optional(),
  status: z.enum(["active", "blocked"]).optional(),
  adminNotes: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await listCustomers(query);
  sendSuccess(res, result);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await getCustomerById(req.params.id);
  sendSuccess(res, customer);
});

export const postCustomer = asyncHandler(async (req: Request, res: Response) => {
  const input = customerSchema.parse(req.body);
  const customer = await createCustomer(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Customer",
    entityId: customer._id.toString(),
    description: `Created customer "${customer.name}"`,
    after: customer,
  });
  sendSuccess(res, customer, "Customer created", 201);
});

export const patchCustomer = asyncHandler(async (req: Request, res: Response) => {
  const input = customerSchema.partial().parse(req.body);
  const customer = await updateCustomer(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Customer",
    entityId: customer._id.toString(),
    description: `Updated customer "${customer.name}"`,
    after: customer,
  });
  sendSuccess(res, customer, "Customer updated");
});
