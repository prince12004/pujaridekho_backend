import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { BookingModel } from "../../models/booking.model.js";
import { CustomerModel } from "../../models/customer.model.js";
import { PanditModel } from "../../models/pandit.model.js";
import { PanditApplicationModel } from "../../models/pandit-application.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { AuditLogModel } from "../../models/audit-log.model.js";

const ACTIVE_BOOKING_STATUSES = [
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
  "pandit_accepted",
  "pandit_on_the_way",
  "pooja_started",
];

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalBookings,
    activeBookings,
    completedBookings,
    totalCustomers,
    totalPandits,
    verifiedPandits,
    pendingApplications,
    PublishedPoojas,
    revenueAgg,
    recentBookings,
    recentAuditLogs,
  ] = await Promise.all([
    BookingModel.countDocuments(),
    BookingModel.countDocuments({ status: { $in: ACTIVE_BOOKING_STATUSES } }),
    BookingModel.countDocuments({ status: { $in: ["pooja_completed", "closed"] } }),
    CustomerModel.countDocuments(),
    PanditModel.countDocuments(),
    PanditModel.countDocuments({ verificationStatus: "verified" }),
    PanditApplicationModel.countDocuments({ status: "pending" }),
    PoojaModel.countDocuments({ status: "Published" }),
    BookingModel.aggregate([
      { $unwind: "$payments" },
      { $match: { "payments.status": "success" } },
      { $group: { _id: null, total: { $sum: "$payments.amount" } } },
    ]),
    BookingModel.find().sort({ createdAt: -1 }).limit(8).populate("pooja", "name").populate("festival", "name"),
    AuditLogModel.find().sort({ createdAt: -1 }).limit(8),
  ]);

  sendSuccess(res, {
    stats: {
      totalBookings,
      activeBookings,
      completedBookings,
      totalCustomers,
      totalPandits,
      verifiedPandits,
      pendingApplications,
      PublishedPoojas,
      totalRevenue: revenueAgg[0]?.total ?? 0,
    },
    recentBookings,
    recentAuditLogs,
  });
});
