import { Schema, model, type InferSchemaType } from "mongoose";

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"] as const;
export const ORDER_PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    customerSnapshot: { name: String, mobile: String, email: String },
    items: { type: [orderItemSchema], default: [] },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    shippingCharge: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, enum: ORDER_PAYMENT_STATUSES, default: "unpaid" },
    paymentGateway: { type: String },
    gatewayTransactionId: { type: String },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    createdByAdmin: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
    timeline: [{ status: String, note: String, changedAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true },
);

orderSchema.index({ status: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const OrderModel = model("Order", orderSchema);
