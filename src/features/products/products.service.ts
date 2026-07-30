import { ApiError } from "../../lib/api-error.js";
import { ProductModel } from "../../models/product.model.js";
import { ProductCategoryModel } from "../../models/product-category.model.js";

export interface PublicListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  featured?: boolean;
}

export async function listPublicProducts(query: PublicListProductsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = { status: "Published" };
  if (query.search) filter.name = { $regex: query.search, $options: "i" };
  if (query.featured) filter.featured = true;

  const items = await ProductModel.find(filter)
    .populate("category", "name slug")
    .sort({ sortOrder: 1, createdAt: -1 });

  const filtered = query.category
    ? items.filter((item) => {
      const category = item.category as { slug?: string } | undefined;
      return category?.slug === query.category;
    })
    : items;

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * limit, page * limit);

  return { items: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicProductBySlug(slug: string) {
  const product = await ProductModel.findOne({ slug, status: "Published" }).populate("category", "name slug");
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function listPublicProductCategories() {
  const categories = await ProductCategoryModel.find({ status: "Published" }).sort({ sortOrder: 1, name: 1 });
  const counts = await ProductModel.aggregate([
    { $match: { status: "Published" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countByCategory = new Map(counts.map((c) => [String(c._id), c.count as number]));

  return categories.map((category) => ({
    ...category.toObject(),
    itemCount: countByCategory.get(String(category._id)) ?? 0,
  }));
}
