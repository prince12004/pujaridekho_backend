import { ApiError } from "../../lib/api-error.js";
import { createNotification } from "../../lib/notify.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { OrderModel } from "../../models/order.model.js";
import { ProductModel } from "../../models/product.model.js";
import { computeCouponDiscount, redeemCoupon } from "../coupons/coupons.service.js";

export const FREE_DELIVERY_THRESHOLD = 0;
export const DELIVERY_CHARGE = 0;

async function generateOrderId() {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const count = await OrderModel.countDocuments({ orderId: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

export interface CreateOrderInput {
  customer: { name: string; mobile: string; email?: string };
  items: { productSlug: string; quantity: number }[];
  shippingAddress: { name: string; phone: string; address: string; city: string; pincode: string };
  couponCode?: string;
}

export async function createPublicOrder(input: CreateOrderInput, customerId: string) {
  if (input.items.length === 0) throw ApiError.badRequest("Order must contain at least one item");

  const items = [];
  let subtotal = 0;
  for (const item of input.items) {
    const product = await ProductModel.findOne({ slug: item.productSlug, status: "Published" });
    if (!product) throw ApiError.badRequest(`Product "${item.productSlug}" is not available`);
    items.push({ product: product._id, name: product.name, price: product.sellingPrice, quantity: item.quantity });
    subtotal += product.sellingPrice * item.quantity;
  }

  const discount = input.couponCode ? await computeCouponDiscount(input.couponCode, subtotal) : 0;
  const shippingCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

  const total = Math.max(subtotal - discount, 0) + shippingCharge;
  const orderId = await generateOrderId();

  const order = await OrderModel.create({
    orderId,
    customer: customerId,
    customerSnapshot: { name: input.customer.name, mobile: input.customer.mobile, email: input.customer.email },
    items,
    shippingAddress: input.shippingAddress,
    subtotal,
    discount,
    shippingCharge,
    couponCode: input.couponCode,
    total,
    status: "pending",
    timeline: [{ status: "pending", note: "Order placed by customer" }],
  });

  if (input.couponCode && discount > 0) await redeemCoupon(input.couponCode);

  await createNotification({
    type: "order",
    title: "New order placed",
    message: `${input.customer.name} placed order ${order.orderId} for ₹${total.toLocaleString("en-IN")}`,
    link: `/admin/orders`,
  });

  await notifyCustomer({
    customer: customerId,
    type: "order",
    title: "Order placed",
    message: `Your order ${order.orderId} for ₹${total.toLocaleString("en-IN")} has been placed.`,
    link: `/account/orders/${order._id}`,
  });

  return order;
}

export async function getPublicOrderById(id: string) {
  const order = await OrderModel.findById(id).populate("items.product", "marketPrice");
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}
