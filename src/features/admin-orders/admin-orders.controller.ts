import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { ORDER_STATUSES } from "../../models/order.model.js";
import { deleteOrder, getOrderById, listOrders, updateOrderStatus } from "./admin-orders.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  sendSuccess(res, await listOrders(query));
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getOrderById(req.params.id));
});

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES), note: z.string().optional() });

export const patchOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = statusSchema.parse(req.body);
  const order = await updateOrderStatus(req.params.id, status, note);
  await recordAuditLog(req, req.admin!, {
    action: "status_change",
    entityType: "Order",
    entityId: order._id.toString(),
    description: `Order ${order.orderId} status changed to ${status}`,
  });
  sendSuccess(res, order, "Order updated");
});

export const removeOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await getOrderById(req.params.id);
  await deleteOrder(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Order",
    entityId: req.params.id,
    description: `Deleted order ${order.orderId}`,
  });
  sendSuccess(res, null, "Order deleted");
});
