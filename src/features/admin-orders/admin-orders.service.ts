import { ApiError } from "../../lib/api-error.js";
import { notifyOrderEvent, onOrderStatusChange } from "../../lib/booking-events.js";
import { OrderModel } from "../../models/order.model.js";

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  /** "requested" → only orders with a pending customer cancellation request. */
  cancelRequest?: string;
}

export async function listOrders(query: ListOrdersQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.cancelRequest === "requested") filter["cancelRequest.status"] = "requested";
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
  const previousStatus = order.status;
  order.status = status as (typeof order)["status"];
  order.timeline.push({ status, note, changedAt: new Date() });
  if (status === "delivered") order.paymentStatus = order.paymentStatus === "unpaid" ? "paid" : order.paymentStatus;
  await order.save();
  await onOrderStatusChange(order, previousStatus, status);
  return order;
}

export async function deleteOrder(id: string) {
  const order = await getOrderById(id);
  await order.deleteOne();
}

/** Approve (cancels the order) or reject a customer's cancellation request. */
export async function resolveOrderCancelRequest(id: string, decision: "approve" | "reject", note?: string) {
  const order = await getOrderById(id);
  if (!order.cancelRequest || order.cancelRequest.status !== "requested") {
    throw ApiError.badRequest("This order has no pending cancellation request");
  }
  order.cancelRequest.status = decision === "approve" ? "approved" : "rejected";
  order.cancelRequest.resolvedAt = new Date();
  order.cancelRequest.resolutionNote = note;
  if (decision === "approve") {
    order.status = "cancelled";
    order.timeline.push({ status: "cancelled", note: note || "Cancellation request approved", changedAt: new Date() });
  } else {
    order.timeline.push({ status: order.status, note: note || "Cancellation request rejected", changedAt: new Date() });
  }
  await order.save();
  await notifyOrderEvent(order, decision === "approve" ? "cancel_approved" : "cancel_rejected", { paid: order.paymentStatus === "paid" });
  return order;
}
