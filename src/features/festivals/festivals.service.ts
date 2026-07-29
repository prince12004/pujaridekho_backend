import { ApiError } from "../../lib/api-error.js";
import { FestivalModel } from "../../models/festival.model.js";

export interface PublicListFestivalsQuery {
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
}

export async function listPublicFestivals(query: PublicListFestivalsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = { status: "published" };
  if (query.search) filter.name = { $regex: query.search, $options: "i" };
  if (query.featured) filter.featured = true;

  const [items, total] = await Promise.all([
    FestivalModel.find(filter)
      .sort({ festivalDate: 1, sortOrder: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FestivalModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicFestivalBySlug(slug: string) {
  const festival = await FestivalModel.findOne({ slug, status: "published" });
  if (!festival) throw ApiError.notFound("Festival not found");
  return festival;
}
