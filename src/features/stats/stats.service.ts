import { BookingModel } from "../../models/booking.model.js";
import { CityModel } from "../../models/city.model.js";
import { PanditModel } from "../../models/pandit.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { TestimonialModel } from "../../models/testimonial.model.js";
import { getOrCreateSettings } from "../settings/settings.service.js";

// Public business numbers for the homepage / About page — counted live from
// the database, plus the base numbers set in Admin → Website Settings.
//
// "Completed pujas" = bookings that were confirmed (or further) and whose puja
// date has passed. Booking statuses are rarely moved all the way to
// "completed" today, so counting only that status would always show 0.
const PERFORMED_STATUSES = [
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
  "pandit_accepted",
  "pandit_on_the_way",
  "pooja_started",
  "pooja_completed",
  "closed",
  "rescheduled",
];

let cache: { at: number; data: SiteStats } | null = null;
const TTL_MS = 10 * 60 * 1000;

export interface SiteStats {
  verifiedPandits: number;
  poojasCompleted: number;
  familiesServed: number;
  poojasLast30Days: number;
  cities: number;
  rating: { value: number; count: number; source: "reviews" | "testimonials" } | null;
}

export async function getSiteStats(): Promise<SiteStats> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const now = new Date();
  const performed = {
    $or: [{ status: { $in: ["pooja_completed", "closed"] } }, { status: { $in: PERFORMED_STATUSES }, poojaDate: { $lt: now } }],
  };
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [settings, pandits, poojas, families, lastMonth, cities, reviewAgg, testimonialAgg] = await Promise.all([
    getOrCreateSettings(),
    PanditModel.countDocuments({ verificationStatus: "verified" }),
    BookingModel.countDocuments(performed),
    BookingModel.distinct("customer", performed).then((ids) => ids.length),
    BookingModel.countDocuments({ status: { $in: PERFORMED_STATUSES }, poojaDate: { $gte: monthAgo, $lt: now } }),
    CityModel.countDocuments({ status: "published" }),
    ReviewModel.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }]),
    TestimonialModel.aggregate([{ $match: { status: "published" } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }]),
  ]);
  const offsets = settings.statsOffsets ?? { verifiedPandits: 0, poojas: 0, families: 0 };

  // Real customer reviews first; published testimonials only until reviews exist.
  const ratingSource = reviewAgg[0]?.n ? { agg: reviewAgg[0], source: "reviews" as const } : testimonialAgg[0]?.n ? { agg: testimonialAgg[0], source: "testimonials" as const } : null;

  const data: SiteStats = {
    verifiedPandits: pandits + (offsets.verifiedPandits ?? 0),
    poojasCompleted: poojas + (offsets.poojas ?? 0),
    familiesServed: families + (offsets.families ?? 0),
    poojasLast30Days: lastMonth,
    cities,
    rating: ratingSource ? { value: Math.round(ratingSource.agg.avg * 10) / 10, count: ratingSource.agg.n, source: ratingSource.source } : null,
  };
  cache = { at: Date.now(), data };
  return data;
}

export function clearSiteStatsCache() {
  cache = null;
}
