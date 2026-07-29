import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { PanditModel } from "../../models/pandit.model.js";
import { ProductModel } from "../../models/product.model.js";
import { BlogModel } from "../../models/blog.model.js";
import { BookingModel } from "../../models/booking.model.js";
import { CustomerModel } from "../../models/customer.model.js";

const RESULT_LIMIT = 5;

export const getAdminSearch = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    sendSuccess(res, []);
    return;
  }

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [poojas, pandits, products, blogs, bookings, customers] = await Promise.all([
    PoojaModel.find({ name: regex }).limit(RESULT_LIMIT).select("name slug"),
    PanditModel.find({ fullName: regex }).limit(RESULT_LIMIT).select("fullName"),
    ProductModel.find({ name: regex }).limit(RESULT_LIMIT).select("name slug"),
    BlogModel.find({ title: regex }).limit(RESULT_LIMIT).select("title slug"),
    BookingModel.find({ bookingId: regex }).limit(RESULT_LIMIT).select("bookingId"),
    CustomerModel.find({ $or: [{ name: regex }, { mobile: regex }] }).limit(RESULT_LIMIT).select("name mobile"),
  ]);

  const results = [
    ...poojas.map((p) => ({ type: "Pooja", label: p.name, href: `/admin/poojas/${p._id}` })),
    ...pandits.map((p) => ({ type: "Pandit", label: p.fullName, href: `/admin/pandits/${p._id}` })),
    ...products.map((p) => ({ type: "Product", label: p.name, href: `/admin/products/${p._id}` })),
    ...blogs.map((b) => ({ type: "Blog", label: b.title, href: `/admin/blogs/${b._id}` })),
    ...bookings.map((b) => ({ type: "Booking", label: b.bookingId, href: `/admin/bookings/${b._id}` })),
    ...customers.map((c) => ({ type: "Customer", label: `${c.name} · ${c.mobile}`, href: `/admin/customers` })),
  ];

  sendSuccess(res, results);
});
