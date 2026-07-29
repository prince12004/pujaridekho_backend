import { ApiError } from "../../lib/api-error.js";
import { ProductCategoryModel } from "../../models/product-category.model.js";

export async function listProductCategories() {
  return ProductCategoryModel.find().sort({ sortOrder: 1, name: 1 });
}

export async function getProductCategoryById(id: string) {
  const category = await ProductCategoryModel.findById(id);
  if (!category) throw ApiError.notFound("Product category not found");
  return category;
}

export async function createProductCategory(input: Record<string, unknown>) {
  const existing = await ProductCategoryModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A category with this slug already exists");
  return ProductCategoryModel.create(input);
}

export async function updateProductCategory(id: string, input: Record<string, unknown>) {
  const category = await getProductCategoryById(id);
  if (input.slug && input.slug !== category.slug) {
    const existing = await ProductCategoryModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A category with this slug already exists");
  }
  Object.assign(category, input);
  await category.save();
  return category;
}

export async function deleteProductCategory(id: string) {
  const category = await getProductCategoryById(id);
  await category.deleteOne();
}
