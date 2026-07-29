import { BookingModel } from "../../models/booking.model.js";
import { OrderModel } from "../../models/order.model.js";
import { ConsultationModel } from "../../models/consultation.model.js";

export interface UnifiedPaymentEntry {
  id: string;
  date: Date;
  type: "booking" | "order" | "consultation";
  referenceId: string;
  referenceLabel: string;
  amount: number;
  method: string;
  status: string;
}

// No dedicated Payment collection exists — Booking already carries a real
// payments[] ledger and Order/Consultation carry their own payment fields.
// This aggregates all three into one chronological view rather than
// duplicating that data into a new model.
export async function listMyPayments(customerId: string): Promise<UnifiedPaymentEntry[]> {
  const [bookings, orders, consultations] = await Promise.all([
    BookingModel.find({ customer: customerId, "payments.0": { $exists: true } }).select("bookingId payments"),
    OrderModel.find({ customer: customerId }).select("orderId total paymentMethod paymentStatus createdAt"),
    ConsultationModel.find({ customer: customerId, amountPaid: { $gt: 0 } }).select("fee amountPaid paymentGateway paymentStatus createdAt"),
  ]);

  const entries: UnifiedPaymentEntry[] = [];

  for (const booking of bookings) {
    booking.payments.forEach((payment, index) => {
      entries.push({
        id: `${booking._id}-${index}`,
        date: payment.recordedAt ?? booking.get("createdAt"),
        type: "booking",
        referenceId: booking._id.toString(),
        referenceLabel: booking.bookingId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status === "success" ? "successful" : payment.status,
      });
    });
  }

  for (const order of orders) {
    entries.push({
      id: order._id.toString(),
      date: order.get("createdAt"),
      type: "order",
      referenceId: order._id.toString(),
      referenceLabel: order.orderId,
      amount: order.total,
      method: order.paymentMethod,
      status: order.paymentStatus === "paid" ? "successful" : order.paymentStatus === "refunded" ? "refunded" : "pending",
    });
  }

  for (const consultation of consultations) {
    entries.push({
      id: consultation._id.toString(),
      date: consultation.get("createdAt"),
      type: "consultation",
      referenceId: consultation._id.toString(),
      referenceLabel: "Consultation",
      amount: consultation.amountPaid ?? 0,
      method: consultation.paymentGateway ?? "payu",
      status: consultation.paymentStatus === "paid" ? "successful" : "pending",
    });
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
