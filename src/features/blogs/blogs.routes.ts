import { Router } from "express";
import { getPublicBlogs, getPublicBlog, getPublicBlogCategories } from "./blogs.controller.js";

export const blogsRouter = Router();

blogsRouter.get("/categories", getPublicBlogCategories);
blogsRouter.get("/", getPublicBlogs);
blogsRouter.get("/:slug", getPublicBlog);
