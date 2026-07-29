import { ApiError } from "../../lib/api-error.js";
import { PoojaModel } from "../../models/pooja.model.js";

export interface ListPoojasQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export async function listPoojas(query: ListPoojasQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.search) filter.name = { $regex: query.search, $options: "i" };

  const [items, total] = await Promise.all([
    PoojaModel.find(filter)
      .populate("category", "name slug")
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PoojaModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPoojaById(id: string) {
  const pooja = await PoojaModel.findById(id).populate("category", "name slug");
  if (!pooja) throw ApiError.notFound("Pooja not found");
  return pooja;
}

export async function createPooja(input: Record<string, unknown>, adminId: string) {
  const existing = await PoojaModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A pooja with this slug already exists");
  return PoojaModel.create({ ...input, createdBy: adminId, updatedBy: adminId });
}

export async function updatePooja(id: string, input: Record<string, unknown>, adminId: string) {
  const pooja = await getPoojaById(id);
  if (input.slug && input.slug !== pooja.slug) {
    const existing = await PoojaModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A pooja with this slug already exists");
  }
  Object.assign(pooja, input, { updatedBy: adminId });
  await pooja.save();
  return pooja;
}

export async function deletePooja(id: string) {
  const pooja = await getPoojaById(id);
  await pooja.deleteOne();
}
