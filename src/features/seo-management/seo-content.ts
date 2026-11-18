import sanitizeHtml from "sanitize-html";
import { BlogModel } from "../../models/blog.model.js";
import { FestivalModel } from "../../models/festival.model.js";
import { PageModel } from "../../models/page.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { ProductModel } from "../../models/product.model.js";
import { SeoPageModel } from "../../models/seo-page.model.js";
import { findServiceCityForPageSlug } from "./seo-cities.js";

// Top-level website routes that exist as real Next.js pages. An SEO page slug
// may never shadow one of them, and footer links pointing at them are always
// considered valid.
export const STATIC_PUBLIC_ROUTES = [
  "/",
  "/about",
  "/become-a-pandit",
  "/blog",
  "/careers",
  "/consultation",
  "/contact",
  "/faq",
  "/festivals",
  "/kundli",
  "/pandits",
  "/poojas",
  "/privacy-policy",
  "/products",
  "/refund-policy",
  "/shipping-policy",
  "/terms-and-conditions",
  "/seo-pages",
] as const;

const RESERVED_SLUGS = new Set([
  ...STATIC_PUBLIC_ROUTES.map((r) => r.slice(1)).filter(Boolean),
  "account",
  "admin",
  "api",
  "booking-checkout",
  "cart",
  "checkout",
  "orders",
  "pages",
  "payment",
  "uploads",
  "sitemap.xml",
  "robots.txt",
  "_next",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

export function sanitizeContent(html: string | undefined) {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li",
      "a", "blockquote", "hr", "table", "thead", "tbody", "tr", "th", "td", "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "") && !/pujaridekho\.com/i.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

export function countWords(...parts: (string | undefined | null)[]) {
  const text = parts
    .map((p) => sanitizeHtml(p ?? "", { allowedTags: [], allowedAttributes: {} }))
    .join(" ")
    .replace(/&[a-z]+;/gi, " ");
  return text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
}

// Minimum unique copy (intro + body, FAQs not counted) before a page may be
// published as indexable. Keeps thin "same page, different society name"
// pages out of Google.
export const MIN_INDEXABLE_WORDS = 150;

export interface PageQualityInput {
  _id?: unknown;
  h1?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  intro?: string | null;
  content?: string | null;
}

/** Reasons a page may not be published as indexable (empty = OK). */
export async function indexabilityProblems(page: PageQualityInput) {
  const problems: string[] = [];
  if (!page.h1?.trim()) problems.push("H1 is required");
  if (!page.metaTitle?.trim()) problems.push("Meta title is required");
  if (!page.metaDescription?.trim()) problems.push("Meta description is required");
  const words = countWords(page.intro, page.content);
  if (words < MIN_INDEXABLE_WORDS) {
    problems.push(`Add more unique content: ${words}/${MIN_INDEXABLE_WORDS} words in intro + content`);
  }

  const others = { _id: { $ne: page._id }, status: "published" };
  if (page.metaTitle?.trim()) {
    const dupe = await SeoPageModel.findOne({ ...others, metaTitle: page.metaTitle.trim() }).select("slug").lean();
    if (dupe) problems.push(`Meta title duplicates /${dupe.slug}`);
  }
  if (page.metaDescription?.trim()) {
    const dupe = await SeoPageModel.findOne({ ...others, metaDescription: page.metaDescription.trim() })
      .select("slug")
      .lean();
    if (dupe) problems.push(`Meta description duplicates /${dupe.slug}`);
  }
  return problems;
}

/** True when an internal path resolves to a live page on the website. */
export async function internalPathExists(rawPath: string): Promise<boolean> {
  const path = rawPath.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if ((STATIC_PUBLIC_ROUTES as readonly string[]).includes(path)) return true;

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1) {
    if (await SeoPageModel.exists({ slug: segments[0], status: "published" })) return true;
    // Basic city pages (/pandit-in-<city>) exist for every served city.
    return Boolean(await findServiceCityForPageSlug(segments[0]));
  }
  if (segments.length === 2) {
    const [section, slug] = segments;
    switch (section) {
      case "poojas":
        return Boolean(await PoojaModel.exists({ slug, status: "published" }));
      case "festivals":
        return Boolean(await FestivalModel.exists({ slug, status: "published" }));
      case "blog":
        return Boolean(await BlogModel.exists({ slug, status: "published" }));
      case "products":
        return Boolean(await ProductModel.exists({ slug, status: "published" }));
      case "pages":
        return Boolean(await PageModel.exists({ slug, status: "published" }));
    }
  }
  return false;
}

export async function isLiveUrl(url: string) {
  if (/^(https?:|mailto:|tel:)/i.test(url)) return true;
  if (!url.startsWith("/")) return false;
  return internalPathExists(url);
}
