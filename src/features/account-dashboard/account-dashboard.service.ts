import { BookingModel } from "../../models/booking.model.js";
import { OrderModel } from "../../models/order.model.js";
import { ConsultationModel } from "../../models/consultation.model.js";
import { CustomerNotificationModel } from "../../models/customer-notification.model.js";

const UPCOMING_BOOKING_STATUSES = [
  "pending_payment",
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
  "pandit_accepted",
  "pandit_on_the_way",
  "pooja_started",
];

export async function getDashboardSummary(customerId: string) {
  const [totalBookings, totalOrders, totalConsultations, nextBooking, recentBooking, recentOrder, recentConsultation, recentNotification] =
    await Promise.all([
      BookingModel.countDocuments({ customer: customerId }),
      OrderModel.countDocuments({ customer: customerId }),
      ConsultationModel.countDocuments({ customer: customerId }),
      BookingModel.findOne({ customer: customerId, status: { $in: UPCOMING_BOOKING_STATUSES } })
        .sort({ poojaDate: 1 })
        .populate("pooja", "name featuredImage")
        .populate("festival", "name featuredImage")
        .populate("pandit", "fullName verificationStatus"),
      BookingModel.findOne({ customer: customerId }).sort({ createdAt: -1 }).populate("pooja", "name").populate("festival", "name"),
      OrderModel.findOne({ customer: customerId }).sort({ createdAt: -1 }),
      ConsultationModel.findOne({ customer: customerId }).sort({ createdAt: -1 }),
      CustomerNotificationModel.findOne({ customer: customerId }).sort({ createdAt: -1 }),
    ]);

  return {
    stats: { totalBookings, totalOrders, totalConsultations },
    nextBooking,
    recentActivity: { recentBooking, recentOrder, recentConsultation, recentNotification },
  };
}
