import { ApiError } from "../../lib/api-error.js";
import { BlogCategoryModel } from "../../models/blog-category.model.js";

export async function listBlogCategories() {
  return BlogCategoryModel.find().sort({ name: 1 });
}

export async function getBlogCategoryById(id: string) {
  const category = await BlogCategoryModel.findById(id);
  if (!category) throw ApiError.notFound("Blog category not found");
  return category;
}

export async function createBlogCategory(input: Record<string, unknown>) {
  const existing = await BlogCategoryModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A category with this slug already exists");
  return BlogCategoryModel.create(input);
}

export async function updateBlogCategory(id: string, input: Record<string, unknown>) {
  const category = await getBlogCategoryById(id);
  if (input.slug && input.slug !== category.slug) {
    const existing = await BlogCategoryModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A category with this slug already exists");
  }
  Object.assign(category, input);
  await category.save();
  return category;
}

export async function deleteBlogCategory(id: string) {
  const category = await getBlogCategoryById(id);
  await category.deleteOne();
}
