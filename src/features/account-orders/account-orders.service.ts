import { ApiError } from "../../lib/api-error.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { ORDER_CANCEL_ELIGIBLE_STATUSES, OrderModel } from "../../models/order.model.js";

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

/** Customer asks to cancel an order that hasn't shipped yet; our team approves or rejects it. */
export async function requestOrderCancellation(customerId: string, orderId: string, input: { reason: string; notes?: string }) {
  const order = await getMyOrderById(customerId, orderId);
  if (!(ORDER_CANCEL_ELIGIBLE_STATUSES as readonly string[]).includes(order.status)) {
    throw ApiError.badRequest("This order can no longer be cancelled — it has already been shipped or closed");
  }
  if (order.cancelRequest?.status === "requested") {
    throw ApiError.badRequest("A cancellation request for this order is already under review");
  }

  order.cancelRequest = { reason: input.reason, notes: input.notes, status: "requested", requestedAt: new Date() } as never;
  order.timeline.push({ status: order.status, note: "Cancellation requested by customer", changedAt: new Date() });
  await order.save();

  await notifyCustomer({
    customer: customerId,
    type: "order",
    title: "Cancellation request submitted",
    message: `Your cancellation request for order ${order.orderId} has been sent to our team for review.`,
    link: `/account/orders/${order._id}`,
    data: { event: "cancel_requested", orderId: order.orderId, id: String(order._id) },
  });

  return order;
}
