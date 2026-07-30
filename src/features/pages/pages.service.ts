import { ApiError } from "../../lib/api-error.js";
import { PageModel } from "../../models/page.model.js";

export async function getPublishedPageBySlug(slug: string) {
  const page = await PageModel.findOne({ slug, status: "Published" });
  if (!page) throw ApiError.notFound("Page not found");
  return page;
}
