import { ApiError } from "../../lib/api-error.js";
import { ReviewModel } from "../../models/review.model.js";
import { BookingModel } from "../../models/booking.model.js";
import { OrderModel } from "../../models/order.model.js";
import { ConsultationModel } from "../../models/consultation.model.js";
import { CustomerModel } from "../../models/customer.model.js";

const COMPLETED_BOOKING_STATUSES = ["pooja_completed", "closed"];

export interface SubmitReviewInput {
  entityType: "pooja" | "pandit" | "product" | "consultation";
  entityId: string;
  bookingId?: string;
  orderId?: string;
  consultationId?: string;
  rating: number;
  comment: string;
  photos?: string[];
}

async function assertEligible(customerId: string, input: SubmitReviewInput) {
  if (input.entityType === "pooja" || input.entityType === "pandit") {
    if (!input.bookingId) throw ApiError.badRequest("A completed booking reference is required for this review");
    const booking = await BookingModel.findById(input.bookingId);
    if (!booking || booking.customer.toString() !== customerId) throw ApiError.forbidden("Booking not found for this account");
    if (!COMPLETED_BOOKING_STATUSES.includes(booking.status)) {
      throw ApiError.badRequest("You can only review a completed booking");
    }
    const target = input.entityType === "pooja" ? booking.pooja ?? booking.festival : booking.pandit;
    if (!target || target.toString() !== input.entityId) {
      throw ApiError.badRequest("This review does not match the selected booking");
    }
    const existing = await ReviewModel.findOne({ customer: customerId, booking: input.bookingId, entityType: input.entityType });
    if (existing) throw ApiError.conflict("You've already reviewed this");
    return { booking: booking._id };
  }

  if (input.entityType === "product") {
    if (!input.orderId) throw ApiError.badRequest("A delivered order reference is required for this review");
    const order = await OrderModel.findById(input.orderId);
    if (!order || order.customer.toString() !== customerId) throw ApiError.forbidden("Order not found for this account");
    if (order.status !== "delivered") throw ApiError.badRequest("You can only review products from a delivered order");
    const hasProduct = order.items.some((item) => item.product?.toString() === input.entityId);
    if (!hasProduct) throw ApiError.badRequest("This product is not part of the selected order");
    const existing = await ReviewModel.findOne({ customer: customerId, order: input.orderId, entityType: "product", entityId: input.entityId });
    if (existing) throw ApiError.conflict("You've already reviewed this product for this order");
    return { order: order._id };
  }

  // consultation
  if (!input.consultationId) throw ApiError.badRequest("A completed consultation reference is required for this review");
  const consultation = await ConsultationModel.findById(input.consultationId);
  if (!consultation || !consultation.customer || consultation.customer.toString() !== customerId) {
    throw ApiError.forbidden("Consultation not found for this account");
  }
  if (consultation.status !== "completed") throw ApiError.badRequest("You can only review a completed consultation");
  const existing = await ReviewModel.findOne({ customer: customerId, entityType: "consultation", entityId: input.consultationId });
  if (existing) throw ApiError.conflict("You've already reviewed this consultation");
  return {};
}

export async function submitReview(customerId: string, input: SubmitReviewInput) {
  const linkage = await assertEligible(customerId, input);
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");

  return ReviewModel.create({
    entityType: input.entityType,
    entityId: input.entityType === "consultation" ? input.consultationId : input.entityId,
    customer: customer._id,
    customerName: customer.name,
    rating: input.rating,
    comment: input.comment,
    photos: input.photos ?? [],
    status: "pending",
    ...linkage,
  });
}

export async function listMyReviews(customerId: string) {
  return ReviewModel.find({ customer: customerId }).sort({ createdAt: -1 });
}
