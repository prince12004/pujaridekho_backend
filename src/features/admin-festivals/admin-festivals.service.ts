import { ApiError } from "../../lib/api-error.js";
import { FestivalModel } from "../../models/festival.model.js";

export interface ListFestivalsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function listFestivals(query: ListFestivalsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = { $regex: query.search, $options: "i" };

  const [items, total] = await Promise.all([
    FestivalModel.find(filter)
      .sort({ festivalDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FestivalModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getFestivalById(id: string) {
  const festival = await FestivalModel.findById(id);
  if (!festival) throw ApiError.notFound("Festival not found");
  return festival;
}

export async function createFestival(input: Record<string, unknown>, adminId: string) {
  const existing = await FestivalModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A festival with this slug already exists");
  return FestivalModel.create({ ...input, createdBy: adminId, updatedBy: adminId });
}

export async function updateFestival(id: string, input: Record<string, unknown>, adminId: string) {
  const festival = await getFestivalById(id);
  if (input.slug && input.slug !== festival.slug) {
    const existing = await FestivalModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A festival with this slug already exists");
  }
  Object.assign(festival, input, { updatedBy: adminId });
  await festival.save();
  return festival;
}

export async function deleteFestival(id: string) {
  const festival = await getFestivalById(id);
  await festival.deleteOne();
}
