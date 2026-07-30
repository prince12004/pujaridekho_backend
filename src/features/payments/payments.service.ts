import { ApiError } from "../../lib/api-error.js";
import { generatePayURequestHash, generateTxnId, PAYU_BASE_URL, verifyPayUResponseHash } from "../../lib/payu.js";
import { notifyCustomer } from "../../lib/notify-customer.js";
import { env } from "../../config/env.js";
import { BookingModel } from "../../models/booking.model.js";
import { OrderModel } from "../../models/order.model.js";
import { ConsultationModel, CONSULTATION_FEE } from "../../models/consultation.model.js";

// Customers may pay either this fixed token/advance amount now (balance
// collected later) or the full amount up front — enforced server-side so a
// client can never request an arbitrary charge.
export const ADVANCE_AMOUNT = 99;

export type PaymentEntityType = "booking" | "order" | "consultation";

export interface InitiatePaymentInput {
  entityType: PaymentEntityType;
  entityId: string;
  amount: number;
  name: string;
  email: string;
  phone: string;
}

async function assertValidAmount(entityType: PaymentEntityType, entityId: string, amount: number) {
  let fullAmount: number;

  if (entityType === "booking") {
    const booking = await BookingModel.findById(entityId);
    if (!booking) throw ApiError.notFound("booking not found");
    // The checkout summary itemizes a fixed ₹{ADVANCE_AMOUNT} platform fee on
    // top of the pooja/samagri price — the "full amount" a customer can pay
    // upfront is that total, not just booking.pricing.finalAmount.
    fullAmount = (booking.pricing?.finalAmount ?? 0) + ADVANCE_AMOUNT;
  } else if (entityType === "order") {
    const order = await OrderModel.findById(entityId);
    if (!order) throw ApiError.notFound("order not found");
    fullAmount = order.total;
  } else {
    const consultation = await ConsultationModel.findById(entityId);
    if (!consultation) throw ApiError.notFound("consultation not found");
    fullAmount = consultation.fee ?? CONSULTATION_FEE;
  }

  const isAdvance = Math.abs(amount - ADVANCE_AMOUNT) < 0.01;
  const isFull = Math.abs(amount - fullAmount) < 0.01;
  if (!isAdvance && !isFull) {
    throw ApiError.badRequest(`Amount must be either the ₹${ADVANCE_AMOUNT} advance or the full ₹${fullAmount}`);
  }
}

export async function initiatePayUPayment(input: InitiatePaymentInput) {
  await assertValidAmount(input.entityType, input.entityId, input.amount);

  const txnid = generateTxnId();
  const amount = input.amount.toFixed(2);
  const productinfo =
    input.entityType === "booking"
      ? "PujariDekho Booking"
      : input.entityType === "consultation"
        ? "PujariDekho Consultation"
        : "PujariDekho Order";

  const hash = generatePayURequestHash({
    txnid,
    amount,
    productinfo,
    firstname: input.name,
    email: input.email,
    udf1: input.entityType,
    udf2: input.entityId,
  });

  return {
    action: PAYU_BASE_URL,
    fields: {
      key: env.PAYU_MERCHANT_KEY,
      txnid,
      amount,
      productinfo,
      firstname: input.name,
      email: input.email,
      phone: input.phone,
      surl: `${env.API_PUBLIC_URL.replace(/\/$/, "")}/api/${env.API_VERSION}/payments/payu/callback`,
      furl: `${env.API_PUBLIC_URL.replace(/\/$/, "")}/api/${env.API_VERSION}/payments/payu/callback`,
      udf1: input.entityType,
      udf2: input.entityId,
      hash,
    },
  };
}

interface PayUCallbackBody {
  status: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  hash: string;
  mihpayid?: string;
}

export async function handlePayUCallback(body: PayUCallbackBody) {
  const isValid = verifyPayUResponseHash(body);
  if (!isValid) throw ApiError.badRequest("Payment signature verification failed");

  const entityType = body.udf1 as PaymentEntityType | undefined;
  const entityId = body.udf2;
  const succeeded = body.status === "success";

  if (entityType === "booking" && entityId) {
    const booking = await BookingModel.findById(entityId);
    if (booking) {
      booking.payments.push({
        amount: Number(body.amount),
        method: "payu",
        status: succeeded ? "success" : "failed",
        transactionRef: body.mihpayid ?? body.txnid,
        notes: "PayU gateway payment",
        recordedAt: new Date(),
      });
      if (succeeded) {
        const totalPaid = booking.payments.filter((p) => p.status !== "failed").reduce((sum, p) => sum + p.amount, 0);
        const finalAmount = booking.pricing?.finalAmount ?? 0;
        booking.paymentStatus = totalPaid >= finalAmount && finalAmount > 0 ? "paid" : "partially_paid";
        if (booking.status === "pending_payment") booking.status = "payment_received";
      }
      await booking.save();

      if (succeeded && booking.customer) {
        await notifyCustomer({
          customer: booking.customer.toString(),
          type: "payment",
          title: "Payment successful",
          message: `₹${Number(body.amount).toLocaleString("en-IN")} received for booking ${booking.bookingId}.`,
          link: `/account/bookings/${booking._id}`,
        });
      }
    }
  } else if (entityType === "order" && entityId) {
    const order = await OrderModel.findById(entityId);
    if (order) {
      order.paymentGateway = "payu";
      order.gatewayTransactionId = body.mihpayid ?? body.txnid;
      if (succeeded) {
        order.paymentStatus = "paid";
        if (order.status === "pending") order.status = "confirmed";
      }
      order.timeline.push({ status: order.status, note: `PayU payment ${succeeded ? "succeeded" : "failed"}`, changedAt: new Date() });
      await order.save();

      if (succeeded && order.customer) {
        await notifyCustomer({
          customer: order.customer.toString(),
          type: "payment",
          title: "Payment successful",
          message: `₹${Number(body.amount).toLocaleString("en-IN")} received for order ${order.orderId}.`,
          link: `/account/orders/${order._id}`,
        });
      }
    }
  } else if (entityType === "consultation" && entityId) {
    const consultation = await ConsultationModel.findById(entityId);
    if (consultation) {
      consultation.paymentGateway = "payu";
      consultation.gatewayTransactionId = body.mihpayid ?? body.txnid;
      if (succeeded) {
        const amountPaid = (consultation.amountPaid ?? 0) + Number(body.amount);
        consultation.amountPaid = amountPaid;
        const fee = consultation.fee ?? CONSULTATION_FEE;
        consultation.paymentStatus = amountPaid >= fee ? "paid" : "partially_paid";
      }
      await consultation.save();

      if (succeeded && consultation.customer) {
        await notifyCustomer({
          customer: consultation.customer.toString(),
          type: "payment",
          title: "Payment successful",
          message: `₹${Number(body.amount).toLocaleString("en-IN")} received for your consultation request.`,
          link: `/account/consultations/${consultation._id}`,
        });
      }
    }
  }

  return { succeeded, entityType, entityId };
}
