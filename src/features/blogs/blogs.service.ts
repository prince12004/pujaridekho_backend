import { ApiError } from "../../lib/api-error.js";
import { BlogModel } from "../../models/blog.model.js";
import { BlogCategoryModel } from "../../models/blog-category.model.js";

export interface PublicListBlogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export async function listPublicBlogs(query: PublicListBlogsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = { status: "published" };
  if (query.search) filter.title = { $regex: query.search, $options: "i" };

  const items = await BlogModel.find(filter).populate("category", "name slug").sort({ publishedAt: -1, createdAt: -1 });

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

export async function getPublicBlogBySlug(slug: string) {
  const blog = await BlogModel.findOne({ slug, status: "published" }).populate("category", "name slug");
  if (!blog) throw ApiError.notFound("Blog post not found");
  return blog;
}

export async function getAdjacentPublicBlogs(slug: string) {
  const all = await BlogModel.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).select("title slug");
  const index = all.findIndex((post) => post.slug === slug);
  return {
    previous: index > 0 ? all[index - 1] : null,
    next: index >= 0 && index < all.length - 1 ? all[index + 1] : null,
  };
}

export async function listPublicBlogCategories() {
  return BlogCategoryModel.find({ status: "published" }).sort({ name: 1 });
}
