import { ApiError } from "../../lib/api-error.js";
import { OrderModel } from "../../models/order.model.js";

export async function listMyOrders(customerId: string, tab: string | undefined, page: number, limit: number) {
  const filter: Record<string, unknown> = { customer: customerId };
  if (tab && tab !== "all") filter.status = tab;

  const [items, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    OrderModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMyOrderById(customerId: string, orderId: string) {
  const order = await OrderModel.findById(orderId).populate("items.product", "marketPrice images");
  if (!order) throw ApiError.notFound("Order not found");
  if (order.customer.toString() !== customerId) {
    throw ApiError.forbidden("You do not have access to this order");
  }
  return order;
}
