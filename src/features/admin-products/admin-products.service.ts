import { ApiError } from "../../lib/api-error.js";
import { ProductModel } from "../../models/product.model.js";

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export async function listProducts(query: ListProductsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.search) filter.name = { $regex: query.search, $options: "i" };

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .populate("category", "name slug")
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ProductModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProductById(id: string) {
  const product = await ProductModel.findById(id).populate("category", "name slug");
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function createProduct(input: Record<string, unknown>, adminId: string) {
  const existing = await ProductModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A product with this slug already exists");
  return ProductModel.create({ ...input, createdBy: adminId, updatedBy: adminId });
}

export async function updateProduct(id: string, input: Record<string, unknown>, adminId: string) {
  const product = await getProductById(id);
  if (input.slug && input.slug !== product.slug) {
    const existing = await ProductModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A product with this slug already exists");
  }
  Object.assign(product, input, { updatedBy: adminId });
  await product.save();
  return product;
}

export async function deleteProduct(id: string) {
  const product = await getProductById(id);
  await product.deleteOne();
}
