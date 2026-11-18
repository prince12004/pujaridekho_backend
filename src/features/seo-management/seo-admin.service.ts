import { isValidObjectId } from "mongoose";
import { ApiError } from "../../lib/api-error.js";
import { SeoFooterGroupModel } from "../../models/seo-footer-group.model.js";
import { SEO_LOCATION_TYPES, SeoLocationModel, type SeoLocationType } from "../../models/seo-location.model.js";
import { SeoPageModel } from "../../models/seo-page.model.js";
import { SeoRedirectModel } from "../../models/seo-redirect.model.js";
import {
  SLUG_PATTERN,
  indexabilityProblems,
  isLiveUrl,
  isReservedSlug,
  sanitizeContent,
  slugify,
  countWords,
  MIN_INDEXABLE_WORDS,
} from "./seo-content.js";
import { invalidateFooterCache, isSeoPageEligible } from "./seo-public.service.js";

// ---------------------------------------------------------------- Locations

export interface LocationInput {
  type: SeoLocationType;
  name: string;
  slug?: string;
  city?: string | null;
  parent?: string | null;
  areaLabel?: string;
  pincode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function listLocations(query: { type?: string; city?: string; search?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.type && (SEO_LOCATION_TYPES as readonly string[]).includes(query.type)) filter.type = query.type;
  if (query.city && isValidObjectId(query.city)) filter.city = query.city;
  if (query.search?.trim()) filter.name = { $regex: query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  const locations = await SeoLocationModel.find(filter)
    .populate("city", "name slug")
    .populate("parent", "name slug type")
    .sort({ type: 1, sortOrder: 1, name: 1 })
    .lean();
  const pages = await SeoPageModel.find({ location: { $in: locations.map((l) => l._id) } })
    .select("pageType slug status indexable location")
    .lean();
  return locations.map((l) => ({
    ...l,
    pages: pages.filter((p) => String(p.location) === String(l._id)),
  }));
}

async function validateLocationRefs(input: Partial<LocationInput>, selfId?: string) {
  if (input.type && input.type !== "city") {
    if (!input.city || !isValidObjectId(input.city)) throw ApiError.badRequest("Please choose the city this location belongs to");
    const city = await SeoLocationModel.findById(input.city);
    if (!city || city.type !== "city") throw ApiError.badRequest("Selected city does not exist");
  }
  if (input.parent) {
    if (!isValidObjectId(input.parent) || input.parent === selfId) throw ApiError.badRequest("Invalid parent location");
    const parent = await SeoLocationModel.findById(input.parent);
    if (!parent || parent.type === "society") throw ApiError.badRequest("Parent must be a city, sector, locality or commercial area");
    if (input.city && parent.type !== "city" && String(parent.city) !== String(input.city)) {
      throw ApiError.badRequest("Parent location is in a different city");
    }
  }
}

function defaultDirectorySection(type: string) {
  return type === "city" ? "main" : type === "sector" ? "sectors" : type === "commercial" ? "commercial" : type === "society" ? "societies" : "localities";
}

export async function createLocation(input: LocationInput, options: { createPage?: boolean } = {}) {
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  if (!SLUG_PATTERN.test(slug)) throw ApiError.badRequest("Invalid slug");
  if (await SeoLocationModel.exists({ slug })) throw ApiError.conflict(`A location with slug "${slug}" already exists`);
  await validateLocationRefs(input);

  const location = await SeoLocationModel.create({
    ...input,
    slug,
    city: input.type === "city" ? null : input.city,
    parent: input.parent || null,
  });

  // Every location gets a draft "Pandit in <name>" page to fill in — never
  // auto-published, so no thin pages go live without unique content.
  if (options.createPage !== false) {
    const pageSlug = `pandit-in-${slug}`;
    if (!(await SeoPageModel.exists({ slug: pageSlug })) && !isReservedSlug(pageSlug)) {
      await SeoPageModel.create({
        pageType: "location",
        slug: pageSlug,
        location: location._id,
        name: `Pandit in ${location.name}`,
        h1: `Pandit in ${location.name}`,
        status: "draft",
        directorySection: defaultDirectorySection(location.type),
      });
    }
  }
  return location;
}

export async function updateLocation(id: string, input: Partial<LocationInput>) {
  const location = await SeoLocationModel.findById(id);
  if (!location) throw ApiError.notFound("Location not found");
  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    if (!SLUG_PATTERN.test(slug)) throw ApiError.badRequest("Invalid slug");
    if (slug !== location.slug && (await SeoLocationModel.exists({ slug }))) {
      throw ApiError.conflict(`A location with slug "${slug}" already exists`);
    }
    input.slug = slug;
  }
  await validateLocationRefs({ type: input.type ?? (location.type as SeoLocationType), city: input.city ?? (location.city ? String(location.city) : null), parent: input.parent }, id);
  Object.assign(location, input);
  if (location.type === "city") location.city = null;
  await location.save();
  invalidateFooterCache();
  return location;
}

export async function deleteLocation(id: string) {
  const location = await SeoLocationModel.findById(id);
  if (!location) throw ApiError.notFound("Location not found");
  if (await SeoLocationModel.exists({ $or: [{ city: location._id }, { parent: location._id }] })) {
    throw ApiError.badRequest("Move or delete the locations inside this one first");
  }
  if (await SeoPageModel.exists({ location: location._id, status: "published" })) {
    throw ApiError.badRequest("Unpublish this location's page first (and add a 301 redirect for its URL)");
  }
  await SeoPageModel.deleteMany({ location: location._id });
  await location.deleteOne();
}

// ---------------------------------------------------------------- Pages

export interface PageInput {
  pageType: "location" | "office_location" | "service";
  slug: string;
  location?: string | null;
  name: string;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  content?: string;
  bannerImage?: string;
  images?: string[];
  heroTagline?: string;
  services?: { label: string; pooja?: string | null; url?: string; note?: string }[];
  faqs?: { question: string; answer: string }[];
  internalLinks?: { label: string; url: string }[];
  nearbyLocations?: string[];
  coverageNote?: string;
  canonicalUrl?: string;
  indexable?: boolean;
  status?: "draft" | "published";
  showInDirectory?: boolean;
  directorySection?: string;
  directoryOrder?: number;
}

export async function listPages(query: { pageType?: string; status?: string; city?: string; search?: string; needsContent?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.pageType) filter.pageType = query.pageType;
  if (query.status === "draft" || query.status === "published") filter.status = query.status;
  if (query.search?.trim()) {
    const rx = { $regex: query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ name: rx }, { slug: rx }, { h1: rx }];
  }
  if (query.city && isValidObjectId(query.city)) {
    const ids = await SeoLocationModel.find({ $or: [{ _id: query.city }, { city: query.city }] }).distinct("_id");
    filter.location = { $in: ids };
  }
  const pages = await SeoPageModel.find(filter)
    .select("-faqs -services -internalLinks -images")
    .populate({ path: "location", select: "name type slug city", populate: { path: "city", select: "name" } })
    .sort({ pageType: 1, directoryOrder: 1, name: 1 })
    .lean();
  const withWords = pages.map(({ content, ...p }) => ({
    ...p,
    wordCount: countWords(p.intro, content),
    eligible: isSeoPageEligible({ ...p, content } as never),
  }));
  return query.needsContent === "true" ? withWords.filter((p) => p.wordCount < MIN_INDEXABLE_WORDS) : withWords;
}

export async function getPage(id: string) {
  const page = await SeoPageModel.findById(id).populate("location", "name type slug city").lean();
  if (!page) throw ApiError.notFound("SEO page not found");
  return { ...page, wordCount: countWords(page.intro, page.content), minWords: MIN_INDEXABLE_WORDS };
}

async function normalizePageInput(input: Partial<PageInput>, selfId?: string) {
  const out: Record<string, unknown> = { ...input };

  if (input.slug !== undefined) {
    const slug = input.slug.replace(/^\/+/, "").trim().toLowerCase();
    if (!SLUG_PATTERN.test(slug)) throw ApiError.badRequest("URL slug may only contain lowercase letters, numbers and hyphens");
    if (isReservedSlug(slug)) throw ApiError.badRequest(`"/${slug}" is an existing website page and can't be used`);
    const clash = await SeoPageModel.findOne({ slug, _id: { $ne: selfId } }).select("_id").lean();
    if (clash) throw ApiError.conflict(`Another SEO page already uses /${slug}`);
    out.slug = slug;
  }

  if (input.location !== undefined) {
    if (input.location) {
      if (!isValidObjectId(input.location) || !(await SeoLocationModel.exists({ _id: input.location }))) {
        throw ApiError.badRequest("Selected location does not exist");
      }
    } else {
      out.location = null;
    }
  }

  if (input.content !== undefined) out.content = sanitizeContent(input.content);
  if (input.services) {
    out.services = input.services
      .filter((s) => s.label?.trim())
      .map((s) => ({ ...s, pooja: s.pooja && isValidObjectId(s.pooja) ? s.pooja : null }));
  }
  if (input.faqs) out.faqs = input.faqs.filter((f) => f.question?.trim() && f.answer?.trim());
  if (input.internalLinks) {
    const links = input.internalLinks.filter((l) => l.label?.trim() && l.url?.trim());
    for (const link of links) {
      if (!(await isLiveUrl(link.url))) throw ApiError.badRequest(`Internal link "${link.label}" (${link.url}) does not point to a live page`);
    }
    out.internalLinks = links;
  }
  if (input.nearbyLocations) out.nearbyLocations = input.nearbyLocations.filter((id) => isValidObjectId(id));
  if (input.canonicalUrl !== undefined) {
    const canonical = input.canonicalUrl.trim();
    if (canonical && !/^(https?:\/\/|\/)/.test(canonical)) throw ApiError.badRequest("Canonical URL must be a full URL or start with /");
    out.canonicalUrl = canonical || undefined;
  }
  return out;
}

async function assertPublishable(page: InstanceType<typeof SeoPageModel>) {
  if (page.status !== "published") return;
  if (page.pageType !== "service" && !page.location) throw ApiError.badRequest("Choose a location before publishing");
  if (page.indexable) {
    const problems = await indexabilityProblems(page);
    if (problems.length) {
      throw new ApiError(400, `Can't publish as indexable yet: ${problems.join("; ")}. Keep it as a draft or publish it as noindex.`);
    }
  }
}

export async function createPage(input: PageInput) {
  if (!input.slug) throw ApiError.badRequest("URL slug is required");
  const data = await normalizePageInput(input);
  if (input.pageType !== "service" && !input.location) throw ApiError.badRequest("Choose a location for this page");
  if (input.location && (await SeoPageModel.exists({ pageType: input.pageType, location: input.location }))) {
    throw ApiError.conflict("This location already has a page of this type — edit that one instead");
  }
  const page = new SeoPageModel(data);
  if (page.status === "published") page.publishedAt = new Date();
  await assertPublishable(page);
  await page.save();
  invalidateFooterCache();
  return page;
}

export async function updatePage(id: string, input: Partial<PageInput>) {
  const page = await SeoPageModel.findById(id);
  if (!page) throw ApiError.notFound("SEO page not found");
  const data = await normalizePageInput(input, id);
  if (data.location && String(data.location) !== String(page.location)) {
    const pageType = (data.pageType as string) ?? page.pageType;
    if (await SeoPageModel.exists({ _id: { $ne: id }, pageType, location: data.location })) {
      throw ApiError.conflict("That location already has a page of this type");
    }
  }
  const wasPublished = page.status === "published";
  const oldSlug = page.slug;
  page.set(data);
  if (page.status === "published" && !wasPublished) page.publishedAt = new Date();
  await assertPublishable(page);
  await page.save();

  // Changing a live page's URL must never break existing links/rankings:
  // the old URL is 301-redirected to the new one automatically.
  if (wasPublished && oldSlug !== page.slug) {
    await SeoRedirectModel.updateOne(
      { fromPath: `/${oldSlug}` },
      { $set: { toPath: `/${page.slug}`, statusCode: 301, isActive: true, note: "Auto-created when the page URL changed" } },
      { upsert: true },
    );
    // Collapse chains: anything that pointed at the old URL now points at the new one.
    await SeoRedirectModel.updateMany({ toPath: `/${oldSlug}` }, { $set: { toPath: `/${page.slug}` } });
  }
  invalidateFooterCache();
  return page;
}

export async function deletePage(id: string) {
  const page = await SeoPageModel.findById(id);
  if (!page) throw ApiError.notFound("SEO page not found");
  if (page.status === "published") throw ApiError.badRequest("Unpublish the page before deleting it (and add a 301 redirect for its URL)");
  await page.deleteOne();
  invalidateFooterCache();
}

export async function bulkUpdateDirectory(items: { id: string; showInDirectory?: boolean; directorySection?: string; directoryOrder?: number }[]) {
  await Promise.all(
    items
      .filter((i) => isValidObjectId(i.id))
      .map((i) => {
        const set: Record<string, unknown> = {};
        if (i.showInDirectory !== undefined) set.showInDirectory = i.showInDirectory;
        if (i.directorySection !== undefined) set.directorySection = i.directorySection;
        if (i.directoryOrder !== undefined) set.directoryOrder = i.directoryOrder;
        return SeoPageModel.updateOne({ _id: i.id }, { $set: set });
      }),
  );
}

// ---------------------------------------------------------------- Footer

export async function listFooterGroups() {
  const saved = await SeoFooterGroupModel.find().sort({ sortOrder: 1 }).lean();
  if (saved.length) return saved;
  // Nothing saved yet: open the editor with the default blocks the website is
  // already showing. They are stored only when the admin presses Save.
  const { buildDefaultFooterGroups } = await import("./starter-data.service.js");
  return buildDefaultFooterGroups();
}

export interface FooterGroupInput {
  key: string;
  title: string;
  isActive?: boolean;
  kind?: "links" | "tags" | "poojas" | "blogs" | "text";
  body?: string;
  limit?: number;
  links: { label: string; url: string; isActive?: boolean }[];
}

export async function saveFooterGroups(groups: FooterGroupInput[]) {
  const problems: string[] = [];
  for (const group of groups) {
    if (group.kind === "text" && !group.body?.trim()) problems.push(`"${group.title}" needs some text`);
    if (group.kind && group.kind !== "links" && group.kind !== "tags") continue;
    for (const link of group.links) {
      if (link.isActive !== false && !(await isLiveUrl(link.url))) problems.push(`"${link.label}" → ${link.url} is not a live page`);
    }
  }
  if (problems.length) {
    throw ApiError.badRequest(`Please fix: ${problems.join(", ")}`);
  }
  const keys = groups.map((g) => g.key);
  if (new Set(keys).size !== keys.length) throw ApiError.badRequest("Footer group keys must be unique");

  await SeoFooterGroupModel.deleteMany({ key: { $nin: keys } });
  for (const [index, group] of groups.entries()) {
    await SeoFooterGroupModel.updateOne(
      { key: group.key },
      {
        $set: {
          title: group.title,
          isActive: group.isActive !== false,
          sortOrder: index,
          kind: group.kind ?? "links",
          body: group.body,
          limit: group.limit ?? 12,
          links: group.kind && group.kind !== "links" && group.kind !== "tags" ? [] : group.links,
        },
      },
      { upsert: true },
    );
  }
  invalidateFooterCache();
  return listFooterGroups();
}

// ---------------------------------------------------------------- Redirects

function normalizePath(value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}

export async function listRedirects() {
  return SeoRedirectModel.find().sort({ createdAt: -1 }).lean();
}

export async function saveRedirect(input: { fromPath: string; toPath: string; statusCode?: number; isActive?: boolean; note?: string }, id?: string) {
  const fromPath = normalizePath(input.fromPath);
  const toPath = normalizePath(input.toPath);
  if (!fromPath.startsWith("/") || fromPath === "/") throw ApiError.badRequest("Redirect 'from' must be a path like /old-page");
  if (fromPath.startsWith("/admin") || fromPath.startsWith("/api")) throw ApiError.badRequest("Can't redirect admin or API paths");
  if (fromPath === toPath) throw ApiError.badRequest("A page can't redirect to itself");
  if (await SeoRedirectModel.exists({ fromPath: toPath, isActive: true })) {
    throw ApiError.badRequest(`${toPath} is itself redirected — point straight at the final URL to avoid a redirect chain`);
  }
  const clash = await SeoRedirectModel.findOne({ fromPath, _id: { $ne: id } });
  if (clash) throw ApiError.conflict(`${fromPath} already has a redirect`);
  const data = { fromPath, toPath, statusCode: input.statusCode ?? 301, isActive: input.isActive !== false, note: input.note };
  if (id) {
    const updated = await SeoRedirectModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!updated) throw ApiError.notFound("Redirect not found");
    return updated;
  }
  return SeoRedirectModel.create(data);
}

export async function deleteRedirect(id: string) {
  await SeoRedirectModel.findByIdAndDelete(id);
}

// ---------------------------------------------------------------- Sitemap report

export async function getSitemapReport() {
  const pages = await SeoPageModel.find().select("pageType slug name status indexable canonicalUrl intro content metaTitle metaDescription h1").lean();
  const included: { slug: string; name: string }[] = [];
  const excluded: { slug: string; name: string; reason: string }[] = [];
  for (const p of pages) {
    if (p.status !== "published") excluded.push({ slug: p.slug, name: p.name, reason: "Draft" });
    else if (p.indexable === false) excluded.push({ slug: p.slug, name: p.name, reason: "Set to noindex" });
    else if (!isSeoPageEligible(p as never)) excluded.push({ slug: p.slug, name: p.name, reason: `Canonical points to ${p.canonicalUrl}` });
    else included.push({ slug: p.slug, name: p.name });
  }
  return { included, excluded, minWords: MIN_INDEXABLE_WORDS };
}
