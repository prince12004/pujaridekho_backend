import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createBlog, deleteBlog, getBlogById, listBlogs, updateBlog } from "./admin-blogs.service.js";

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImage: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "Published"]).optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const getBlogs = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  sendSuccess(res, await listBlogs(query));
});

export const getBlog = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getBlogById(req.params.id));
});

export const postBlog = asyncHandler(async (req: Request, res: Response) => {
  const input = blogSchema.parse(req.body);
  const blog = await createBlog(input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Blog",
    entityId: blog._id.toString(),
    description: `Created blog post "${blog.title}"`,
  });
  sendSuccess(res, blog, "Blog post created", 201);
});

export const patchBlog = asyncHandler(async (req: Request, res: Response) => {
  const input = blogSchema.partial().parse(req.body);
  const blog = await updateBlog(req.params.id, input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Blog",
    entityId: blog._id.toString(),
    description: `Updated blog post "${blog.title}"`,
  });
  sendSuccess(res, blog, "Blog post updated");
});

export const removeBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await getBlogById(req.params.id);
  await deleteBlog(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Blog",
    entityId: req.params.id,
    description: `Deleted blog post "${blog.title}"`,
  });
  sendSuccess(res, null, "Blog post deleted");
});
