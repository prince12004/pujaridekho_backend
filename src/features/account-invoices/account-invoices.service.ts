import { ApiError } from "../../lib/api-error.js";
import { BOOKING_STATUS_LABELS } from "../../lib/booking-status-labels.js";
import { BookingModel } from "../../models/booking.model.js";
import { OrderModel } from "../../models/order.model.js";
import { ConsultationModel } from "../../models/consultation.model.js";
import { MuhuratModel } from "../../models/muhurat.model.js";

// Mirrors the same workflow-stage gate used on the booking detail page —
// a Pandit's contact details aren't shown on the invoice until the booking
// has actually reached the point where contact is expected.
const PANDIT_CONTACT_VISIBLE_AT = ["pandit_accepted", "pandit_on_the_way", "pooja_started", "pooja_completed", "closed"];

async function resolveMuhuratDetails(muhuratSlot: { muhurat: unknown; slotId: unknown } | null | undefined) {
  if (!muhuratSlot) return undefined;
  const muhurat = await MuhuratModel.findById(muhuratSlot.muhurat as string);
  const slot = muhurat?.slots.find((s) => s._id?.toString() === String(muhuratSlot.slotId));
  if (!slot) return undefined;
  return { startTime: slot.startTime, endTime: slot.endTime };
}

export interface InvoiceSummary {
  invoiceNumber: string;
  type: "booking" | "order" | "consultation";
  referenceId: string;
  referenceLabel: string;
  date: Date;
  amount: number;
}

// No dedicated Invoice collection — an invoice is a formatted view over a
// Booking/Order/Consultation that has actually been paid (or partially
// paid), not a separately-generated document.
export async function listMyInvoices(customerId: string): Promise<InvoiceSummary[]> {
  const [bookings, orders, consultations] = await Promise.all([
    BookingModel.find({ customer: customerId, paymentStatus: { $ne: "unpaid" } }).select("bookingId pricing createdAt"),
    OrderModel.find({ customer: customerId, paymentStatus: { $ne: "unpaid" } }).select("orderId total createdAt"),
    ConsultationModel.find({ customer: customerId, paymentStatus: { $ne: "unpaid" } }).select("fee amountPaid createdAt"),
  ]);

  const invoices: InvoiceSummary[] = [
    ...bookings.map((b) => ({
      invoiceNumber: `INV-BK-${b.bookingId}`,
      type: "booking" as const,
      referenceId: b._id.toString(),
      referenceLabel: b.bookingId,
      date: b.get("createdAt"),
      amount: b.pricing?.finalAmount ?? 0,
    })),
    ...orders.map((o) => ({
      invoiceNumber: `INV-OR-${o.orderId}`,
      type: "order" as const,
      referenceId: o._id.toString(),
      referenceLabel: o.orderId,
      date: o.get("createdAt"),
      amount: o.total,
    })),
    ...consultations.map((c) => ({
      invoiceNumber: `INV-CN-${c._id.toString().slice(-6).toUpperCase()}`,
      type: "consultation" as const,
      referenceId: c._id.toString(),
      referenceLabel: "Consultation",
      date: c.get("createdAt"),
      amount: c.amountPaid ?? c.fee ?? 0,
    })),
  ];

  return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getMyInvoiceDetail(customerId: string, type: "booking" | "order" | "consultation", id: string) {
  if (type === "booking") {
    const booking = await BookingModel.findById(id)
      .populate("pooja", "name")
      .populate("festival", "name")
      .populate("pandit", "fullName mobile");
    if (!booking || booking.customer.toString() !== customerId) throw ApiError.notFound("Invoice not found");
    const paidAmount = booking.payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0);
    const finalAmount = booking.pricing?.finalAmount ?? 0;
    const pandit = booking.pandit as unknown as { fullName?: string; mobile?: string } | null;
    return {
      invoiceNumber: `INV-BK-${booking.bookingId}`,
      type,
      date: booking.get("createdAt"),
      customerSnapshot: booking.customerSnapshot,
      bookingId: booking.bookingId,
      status: BOOKING_STATUS_LABELS[booking.status] ?? booking.status,
      serviceName:
        (booking.pooja as unknown as { name?: string } | undefined)?.name ??
        (booking.festival as unknown as { name?: string } | undefined)?.name ??
        "Pooja Booking",
      poojaDate: booking.poojaDate,
      poojaTime: booking.poojaTime,
      venue: [booking.address, booking.city].filter(Boolean).join(", "),
      pandit:
        pandit && PANDIT_CONTACT_VISIBLE_AT.includes(booking.status)
          ? { fullName: pandit.fullName, mobile: pandit.mobile }
          : undefined,
      muhurat: await resolveMuhuratDetails(booking.muhuratSlot),
      lineItems: [
        {
          name:
            (booking.pooja as unknown as { name?: string } | undefined)?.name ??
            (booking.festival as unknown as { name?: string } | undefined)?.name ??
            "Pooja Booking",
          amount: booking.pricing?.packagePrice ?? 0,
        },
        ...(booking.pricing?.samagriCharges ? [{ name: "Samagri", amount: booking.pricing.samagriCharges }] : []),
      ],
      discount: booking.pricing?.discount ?? 0,
      paidAmount,
      balanceDue: Math.max(finalAmount - paidAmount, 0),
      total: finalAmount,
      paymentStatus: booking.paymentStatus,
    };
  }

  if (type === "order") {
    const order = await OrderModel.findById(id);
    if (!order || order.customer.toString() !== customerId) throw ApiError.notFound("Invoice not found");
    return {
      invoiceNumber: `INV-OR-${order.orderId}`,
      type,
      date: order.get("createdAt"),
      customerSnapshot: order.customerSnapshot,
      orderId: order.orderId,
      status: order.status,
      shippingAddress: order.shippingAddress,
      lineItems: [
        ...order.items.map((item) => ({ name: item.name, quantity: item.quantity, amount: item.price * item.quantity })),
        ...(order.shippingCharge ? [{ name: "Delivery Charge", amount: order.shippingCharge }] : []),
      ],
      discount: order.discount,
      paidAmount: order.paymentStatus === "paid" ? order.total : 0,
      balanceDue: order.paymentStatus === "paid" ? 0 : order.total,
      total: order.total,
      paymentStatus: order.paymentStatus,
    };
  }

  const consultation = await ConsultationModel.findById(id).populate("pandit", "fullName mobile");
  if (!consultation || !consultation.customer || consultation.customer.toString() !== customerId) {
    throw ApiError.notFound("Invoice not found");
  }
  const fee = consultation.fee ?? 0;
  const paidAmount = consultation.amountPaid ?? 0;
  const consultationPandit = consultation.pandit as unknown as { fullName?: string; mobile?: string } | null;
  return {
    invoiceNumber: `INV-CN-${consultation._id.toString().slice(-6).toUpperCase()}`,
    type,
    date: consultation.get("createdAt"),
    pandit:
      consultationPandit && ["scheduled", "completed"].includes(consultation.status)
        ? { fullName: consultationPandit.fullName, mobile: consultationPandit.mobile }
        : undefined,
    customerSnapshot: { name: consultation.name, mobile: consultation.mobile, email: consultation.email },
    status: consultation.status,
    lineItems: [{ name: "Astrology Consultation", amount: fee }],
    discount: 0,
    paidAmount,
    balanceDue: Math.max(fee - paidAmount, 0),
    total: fee,
    paymentStatus: consultation.paymentStatus,
  };
}
