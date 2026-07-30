import { ApiError } from "../../lib/api-error.js";
import { BlogModel } from "../../models/blog.model.js";

export interface ListBlogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function listBlogs(query: ListBlogsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.title = { $regex: query.search, $options: "i" };

  const [items, total] = await Promise.all([
    BlogModel.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    BlogModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBlogById(id: string) {
  const blog = await BlogModel.findById(id).populate("category", "name slug");
  if (!blog) throw ApiError.notFound("Blog post not found");
  return blog;
}

export async function createBlog(input: Record<string, unknown>, adminId: string) {
  const existing = await BlogModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A blog post with this slug already exists");
  const payload = { ...input, createdBy: adminId, updatedBy: adminId } as Record<string, unknown>;
  if (payload.status === "Published" && !payload.PublishedAt) payload.PublishedAt = new Date();
  return BlogModel.create(payload);
}

export async function updateBlog(id: string, input: Record<string, unknown>, adminId: string) {
  const blog = await getBlogById(id);
  if (input.slug && input.slug !== blog.slug) {
    const existing = await BlogModel.findOne({ slug: input.slug, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("A blog post with this slug already exists");
  }
  if (input.status === "Published" && !blog.PublishedAt) {
    (input as Record<string, unknown>).PublishedAt = new Date();
  }
  Object.assign(blog, input, { updatedBy: adminId });
  await blog.save();
  return blog;
}

export async function deleteBlog(id: string) {
  const blog = await getBlogById(id);
  await blog.deleteOne();
}
