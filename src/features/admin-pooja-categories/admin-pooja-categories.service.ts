import { ApiError } from "../../lib/api-error.js";
import { PoojaCategoryModel } from "../../models/pooja-category.model.js";

export async function listPoojaCategories() {
  return PoojaCategoryModel.find().sort({ sortOrder: 1, name: 1 });
}

export async function getPoojaCategoryById(id: string) {
  const category = await PoojaCategoryModel.findById(id);
  if (!category) throw ApiError.notFound("Pooja category not found");
  return category;
}

export async function createPoojaCategory(input: Record<string, unknown>) {
  const existing = await PoojaCategoryModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A category with this slug already exists");
  return PoojaCategoryModel.create(input);
}

export async function updatePoojaCategory(id: string, input: Record<string, unknown>) {
  const category = await getPoojaCategoryById(id);
  if (input.slug && input.slug !== category.slug) {
    const existing = await PoojaCategoryModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A category with this slug already exists");
  }
  Object.assign(category, input);
  await category.save();
  return category;
}

export async function deletePoojaCategory(id: string) {
  const category = await getPoojaCategoryById(id);
  await category.deleteOne();
}
