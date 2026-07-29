import { ApiError } from "../../lib/api-error.js";
import { PageModel } from "../../models/page.model.js";

export async function listPages() {
  return PageModel.find().sort({ createdAt: -1 });
}

export async function getPageById(id: string) {
  const page = await PageModel.findById(id);
  if (!page) throw ApiError.notFound("Page not found");
  return page;
}

export async function createPage(input: Record<string, unknown>) {
  const existing = await PageModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A page with this slug already exists");
  return PageModel.create(input);
}

export async function updatePage(id: string, input: Record<string, unknown>) {
  const page = await getPageById(id);
  Object.assign(page, input);
  await page.save();
  return page;
}

export async function deletePage(id: string) {
  const page = await getPageById(id);
  await page.deleteOne();
}
