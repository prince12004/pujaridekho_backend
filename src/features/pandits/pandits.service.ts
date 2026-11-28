import { ApiError } from "../../lib/api-error.js";
import { BookingModel } from "../../models/booking.model.js";
import { PanditModel } from "../../models/pandit.model.js";
import { ReviewModel } from "../../models/review.model.js";

export interface PublicListPanditsQuery {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    sort?: "rating" | "newest";
}

// Only these fields are public. Contact details, commission, certificates and
// account flags stay private (they were previously returned to anyone).
const PUBLIC_FIELDS = "fullName photo bio experienceYears languages qualifications specializations cities serviceAreas featured createdAt";
const PUBLIC_FILTER = { accountStatus: "active", verificationStatus: "verified" };
// Bookings are rarely moved to "completed" after the puja, so a puja counts as
// done when it was assigned to this pandit, its date has passed and it wasn't
// cancelled or refunded.
const NOT_DONE_STATUSES = ["cancelled", "refund_requested", "refunded", "pending_payment"];

export function panditSlug(fullName: string) {
    return fullName
        .toLowerCase()
        .replace(/^pandit\s+/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** Real numbers for the public profile: completed bookings and approved reviews. */
async function attachStats<T extends { _id: unknown; fullName: string; toObject(): Record<string, unknown> }>(pandits: T[]) {
    const ids = pandits.map((p) => p._id);
    const [completed, reviews] = await Promise.all([
        BookingModel.aggregate([
            { $match: { pandit: { $in: ids }, status: { $nin: NOT_DONE_STATUSES }, poojaDate: { $lt: new Date() } } },
            { $group: { _id: "$pandit", count: { $sum: 1 } } },
        ]),
        ReviewModel.aggregate([
            { $match: { entityType: "pandit", entityId: { $in: ids }, status: "approved" } },
            { $group: { _id: "$entityId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]),
    ]);
    const completedById = new Map(completed.map((c) => [String(c._id), c.count as number]));
    const reviewsById = new Map(reviews.map((r) => [String(r._id), r as { avg: number; count: number }]));
    return pandits.map((p) => {
        const r = reviewsById.get(String(p._id));
        return {
            ...p.toObject(),
            slug: panditSlug(p.fullName),
            completedPoojas: completedById.get(String(p._id)) ?? 0,
            // 0 when there are no approved reviews yet — the site shows "New".
            rating: r ? Math.round(r.avg * 10) / 10 : 0,
            reviewCount: r?.count ?? 0,
        };
    });
}

export async function listPublicPandits(query: PublicListPanditsQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const filter: Record<string, unknown> = { ...PUBLIC_FILTER };
    if (query.search) filter.fullName = { $regex: query.search, $options: "i" };
    if (query.city) filter.cities = query.city;

    const [docs, total] = await Promise.all([
        PanditModel.find(filter).select(PUBLIC_FIELDS).sort({ featured: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        PanditModel.countDocuments(filter),
    ]);
    let items = await attachStats(docs);
    if (query.sort === "rating") items = items.sort((a, b) => b.rating - a.rating || b.completedPoojas - a.completedPoojas);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Looks a pandit up by id or by profile slug (e.g. "yadunandan-mishra"). */
export async function getPublicPanditById(idOrSlug: string) {
    let pandit = /^[a-f0-9]{24}$/i.test(idOrSlug) ? await PanditModel.findOne({ _id: idOrSlug, ...PUBLIC_FILTER }).select(PUBLIC_FIELDS) : null;
    if (!pandit) {
        const all = await PanditModel.find(PUBLIC_FILTER).select(PUBLIC_FIELDS);
        pandit = all.find((p) => panditSlug(p.fullName) === idOrSlug.toLowerCase()) ?? null;
    }
    if (!pandit) throw ApiError.notFound("Pandit not found");
    const [withStats] = await attachStats([pandit]);
    return withStats;
}
