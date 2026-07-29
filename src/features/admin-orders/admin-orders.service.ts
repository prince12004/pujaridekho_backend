import { ApiError } from "../../lib/api-error.js";
import { OrderModel } from "../../models/order.model.js";

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function listOrders(query: ListOrdersQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { orderId: { $regex: query.search, $options: "i" } },
      { "customerSnapshot.name": { $regex: query.search, $options: "i" } },
      { "customerSnapshot.mobile": { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    OrderModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getOrderById(id: string) {
  const order = await OrderModel.findById(id);
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

export async function updateOrderStatus(id: string, status: string, note?: string) {
  const order = await getOrderById(id);
  order.status = status as (typeof order)["status"];
  order.timeline.push({ status, note, changedAt: new Date() });
  if (status === "delivered") order.paymentStatus = order.paymentStatus === "unpaid" ? "paid" : order.paymentStatus;
  await order.save();
  return order;
}
