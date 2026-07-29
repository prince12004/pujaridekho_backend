import { BookingModel } from "../../models/booking.model.js";
import { OrderModel } from "../../models/order.model.js";
import { CustomerModel } from "../../models/customer.model.js";

const MONTH_FORMAT = "%Y-%m";

function monthsAgo(n: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - n);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getReportsOverview() {
  const since = monthsAgo(11);

  const [
    bookingRevenueByMonth,
    orderRevenueByMonth,
    bookingsByStatus,
    ordersByStatus,
    topPoojas,
    topProducts,
    newCustomersByMonth,
    totals,
  ] = await Promise.all([
    BookingModel.aggregate([
      { $unwind: "$payments" },
      { $match: { "payments.status": "success", "payments.recordedAt": { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: MONTH_FORMAT, date: "$payments.recordedAt" } },
          total: { $sum: "$payments.amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    OrderModel.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: MONTH_FORMAT, date: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    BookingModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    OrderModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    BookingModel.aggregate([
      { $match: { pooja: { $ne: null } } },
      { $group: { _id: "$pooja", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "poojas", localField: "_id", foreignField: "_id", as: "pooja" } },
      { $unwind: "$pooja" },
      { $project: { _id: 0, name: "$pooja.name", count: 1 } },
    ]),
    OrderModel.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.name", count: { $sum: "$items.quantity" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]),
    CustomerModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: MONTH_FORMAT, date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Promise.all([
      BookingModel.countDocuments(),
      OrderModel.countDocuments(),
      CustomerModel.countDocuments(),
    ]),
  ]);

  return {
    bookingRevenueByMonth,
    orderRevenueByMonth,
    bookingsByStatus,
    ordersByStatus,
    topPoojas,
    topProducts,
    newCustomersByMonth,
    totals: {
      totalBookings: totals[0],
      totalOrders: totals[1],
      totalCustomers: totals[2],
    },
  };
}
