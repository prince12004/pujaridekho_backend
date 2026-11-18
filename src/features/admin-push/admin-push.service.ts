import { isValidObjectId } from "mongoose";
import { ApiError } from "../../lib/api-error.js";
import { isPushConfigured, sendPushToTokens } from "../../lib/push.js";
import { BookingModel } from "../../models/booking.model.js";
import { CustomerModel } from "../../models/customer.model.js";
import { CustomerNotificationModel } from "../../models/customer-notification.model.js";
import { DeviceModel } from "../../models/device.model.js";
import { PushCampaignModel } from "../../models/push-campaign.model.js";

export interface PushCampaignInput {
  audience: { type: "all" | "city" | "customer"; city?: string; customerId?: string };
  title: string;
  message: string;
  link?: string;
  imageUrl?: string;
  saveInApp: boolean;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Customer ids for an audience. "city" = customers with a booking or a saved address in that city. */
async function resolveAudience(audience: PushCampaignInput["audience"]) {
  if (audience.type === "customer") {
    if (!audience.customerId || !isValidObjectId(audience.customerId)) throw ApiError.badRequest("Choose a customer");
    const customer = await CustomerModel.findById(audience.customerId).select("name mobile").lean();
    if (!customer) throw ApiError.badRequest("Customer not found");
    return { ids: [String(customer._id)], label: `${customer.name} (${customer.mobile})` };
  }
  if (audience.type === "city") {
    const city = audience.city?.trim();
    if (!city) throw ApiError.badRequest("Choose a city");
    const rx = new RegExp(`^\\s*${escapeRegex(city)}\\s*$`, "i");
    const [fromBookings, fromCustomers] = await Promise.all([
      BookingModel.distinct("customer", { city: rx }),
      CustomerModel.distinct("_id", { $or: [{ city: rx }, { "addresses.city": rx }] }),
    ]);
    const ids = [...new Set([...fromBookings, ...fromCustomers].map(String))];
    return { ids, label: `Customers in ${city}` };
  }
  const ids = (await CustomerModel.distinct("_id", { status: "active" })).map(String);
  return { ids, label: "All customers" };
}

export async function sendPushCampaign(input: PushCampaignInput, admin: { id: string; name: string }) {
  const { ids, label } = await resolveAudience(input.audience);

  if (input.saveInApp && ids.length) {
    // In batches so a large "all customers" send doesn't build one huge insert.
    for (let i = 0; i < ids.length; i += 1000) {
      await CustomerNotificationModel.insertMany(
        ids.slice(i, i + 1000).map((customer) => ({
          customer,
          type: "offer",
          title: input.title,
          message: input.message,
          link: input.link || undefined,
        })),
        { ordered: false },
      );
    }
  }

  const tokens = (await DeviceModel.find(input.audience.type === "all" ? {} : { customer: { $in: ids } }).select("token").lean()).map(
    (d) => d.token,
  );
  const result = await sendPushToTokens(tokens, {
    type: "offer",
    title: input.title,
    message: input.message,
    link: input.link,
    imageUrl: input.imageUrl,
  });

  return PushCampaignModel.create({
    audience: {
      type: input.audience.type,
      city: input.audience.city,
      customer: input.audience.type === "customer" ? input.audience.customerId : undefined,
      label,
    },
    title: input.title,
    message: input.message,
    link: input.link,
    imageUrl: input.imageUrl,
    saveInApp: input.saveInApp,
    customerCount: ids.length,
    sentCount: result.sent,
    failedCount: result.failed,
    pushConfigured: result.configured,
    sentBy: admin.id,
    sentByName: admin.name,
  });
}

export async function listPushCampaigns(page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    PushCampaignModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    PushCampaignModel.countDocuments(),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), pushConfigured: isPushConfigured() };
}

/** Customer search for the "One customer" audience (by mobile or name). */
export async function searchCustomers(q: string) {
  const term = q.trim();
  if (term.length < 3) return [];
  const digits = term.replace(/\D/g, "");
  const filter = digits.length >= 3 ? { mobile: { $regex: digits } } : { name: { $regex: escapeRegex(term), $options: "i" } };
  const customers = await CustomerModel.find(filter).select("name mobile").limit(10).lean();
  const deviceCounts = await DeviceModel.aggregate([
    { $match: { customer: { $in: customers.map((c) => c._id) } } },
    { $group: { _id: "$customer", n: { $sum: 1 } } },
  ]);
  return customers.map((c) => ({
    _id: c._id,
    name: c.name,
    mobile: c.mobile,
    devices: deviceCounts.find((d) => String(d._id) === String(c._id))?.n ?? 0,
  }));
}
