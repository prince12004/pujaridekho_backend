import type { Types } from "mongoose";
import { BlogModel } from "../../models/blog.model.js";
import { FestivalModel } from "../../models/festival.model.js";
import { PageModel } from "../../models/page.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { PoojaCategoryModel } from "../../models/pooja-category.model.js";
import { ProductModel } from "../../models/product.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { SeoFooterGroupModel } from "../../models/seo-footer-group.model.js";
import { SeoLocationModel } from "../../models/seo-location.model.js";
import { SeoPageModel } from "../../models/seo-page.model.js";
import { SeoRedirectModel } from "../../models/seo-redirect.model.js";
import { STATIC_PUBLIC_ROUTES, isLiveUrl } from "./seo-content.js";
import { findServiceCityForPageSlug, getCityLinks, getServiceCities } from "./seo-cities.js";
import { getSeoSettings } from "./seo-settings.service.js";

type Id = Types.ObjectId;

interface LeanLocation {
  _id: Id;
  type: string;
  name: string;
  slug: string;
  city?: Id | null;
  parent?: Id | null;
  areaLabel?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface LeanPage {
  _id: Id;
  pageType: "location" | "office_location" | "service";
  slug: string;
  name: string;
  location?: Id | null;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  content?: string;
  bannerImage?: string;
  images?: string[];
  heroTagline?: string;
  services?: { label: string; pooja?: Id | null; url?: string; note?: string }[];
  faqs?: { question: string; answer: string }[];
  internalLinks?: { label: string; url: string }[];
  nearbyLocations?: Id[];
  coverageNote?: string;
  canonicalUrl?: string;
  indexable?: boolean;
  status: string;
  showInDirectory?: boolean;
  directorySection?: string;
  directoryOrder?: number;
  updatedAt?: Date;
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  city: "City",
  sector: "Sectors",
  locality: "Localities",
  commercial: "Commercial Areas",
  society: "Residential Societies",
};

const path = (slug: string) => `/${slug}`;

/** Published location pages keyed by location id. */
async function publishedLocationPages(locationIds: Id[], pageType: "location" | "office_location" = "location") {
  if (locationIds.length === 0) return new Map<string, LeanPage>();
  const pages = (await SeoPageModel.find({ pageType, status: "published", location: { $in: locationIds } })
    .select("slug name location h1")
    .lean()) as unknown as LeanPage[];
  return new Map(pages.map((p) => [String(p.location), p]));
}

export async function getPublicPageBySlug(slug: string) {
  let page = (await SeoPageModel.findOne({ slug: slug.toLowerCase(), status: "published" }).lean()) as unknown as
    | LeanPage
    | null;
  // No written page yet for a served city: serve a basic, noindex city page
  // (live poojas, booking steps, CTAs) so "Pandit in <city>" links always
  // work. It is replaced by the real page as soon as one is published.
  let isBasicCityPage = false;
  if (!page) {
    const city = await findServiceCityForPageSlug(slug.toLowerCase());
    if (!city) return null;
    const settings = await getSeoSettings();
    const fill = (t: string) => t.replace(/\{place\}/g, city.name);
    isBasicCityPage = true;
    page = {
      _id: (city.locationId ?? null) as unknown as Id,
      pageType: "location",
      slug: slug.toLowerCase(),
      name: `Pandit in ${city.name}`,
      location: city.locationId ?? null,
      h1: fill(settings.landing.cityFallbackHeading),
      metaTitle: fill(settings.landing.cityFallbackMetaTitle),
      metaDescription: fill(settings.landing.cityFallbackMetaDescription),
      intro: fill(settings.landing.cityFallbackIntro),
      content: "",
      services: [],
      faqs: [],
      internalLinks: [],
      status: "published",
      indexable: false,
    };
  }

  const location = page.location
    ? ((await SeoLocationModel.findById(page.location).lean()) as unknown as LeanLocation | null)
    : null;
  const city =
    location?.type === "city"
      ? location
      : location?.city
        ? ((await SeoLocationModel.findById(location.city).lean()) as unknown as LeanLocation | null)
        : null;
  const parent = location?.parent
    ? ((await SeoLocationModel.findById(location.parent).lean()) as unknown as LeanLocation | null)
    : null;

  // ---- Breadcrumbs (only link ancestors that actually have a live page)
  const breadcrumbs: { name: string; path?: string }[] = [];
  if (page.pageType === "service") {
    breadcrumbs.push({ name: "Puja Services", path: "/seo-pages" });
  } else if (page.pageType === "office_location") {
    const officeHub = await SeoPageModel.findOne({ slug: "office-puja", status: "published" }).select("slug name").lean();
    breadcrumbs.push(officeHub ? { name: "Office Puja", path: "/office-puja" } : { name: "Locations", path: "/seo-pages" });
  } else {
    breadcrumbs.push({ name: "Locations", path: "/seo-pages" });
    const ancestorIds = [city, parent].filter((l): l is LeanLocation => !!l && String(l._id) !== String(location?._id));
    const ancestorPages = await publishedLocationPages(ancestorIds.map((l) => l._id));
    for (const ancestor of ancestorIds) {
      const ancestorPage = ancestorPages.get(String(ancestor._id));
      if (ancestorPage) breadcrumbs.push({ name: ancestorPage.name, path: path(ancestorPage.slug) });
    }
  }
  breadcrumbs.push({ name: page.name });

  // ---- Services (resolved to live pooja pages / SEO pages; dead ones dropped).
  // A page with no hand-picked services shows every published pooja straight
  // from the catalogue, so new poojas appear on all such pages automatically.
  const pageServices: { label: string; pooja?: Id | null; url?: string; note?: string }[] = page.services?.length
    ? page.services
    : (
        await PoojaModel.find({ status: "published" }).sort({ sortOrder: 1, createdAt: 1 }).select("_id name").lean()
      ).map((p) => ({ label: p.name, pooja: p._id as Id }));
  const poojaIds = pageServices.map((s) => s.pooja).filter((id): id is Id => !!id);
  const poojas = poojaIds.length
    ? await PoojaModel.find({ _id: { $in: poojaIds }, status: "published" })
        .select("name slug startingPrice marketPrice featuredImage heroBanner shortDescription")
        .lean()
    : [];
  const poojaById = new Map(poojas.map((p) => [String(p._id), p]));
  const services = [];
  const usedUrls = new Set<string>();
  for (const service of pageServices) {
    let pooja = service.pooja ? poojaById.get(String(service.pooja)) : undefined;
    let url = pooja ? `/poojas/${pooja.slug}` : service.url;
    // Two services pointing at the same pooja (e.g. one "Office / Shop
    // Opening" pooja) — use the second one's own service page instead, or
    // drop it, so the same card never appears twice.
    if (url && usedUrls.has(url)) {
      pooja = undefined;
      url = service.url && !usedUrls.has(service.url) ? service.url : undefined;
    }
    if (!url || !(await isLiveUrl(url))) continue;
    usedUrls.add(url);
    services.push({
      // Linked poojas always show their current catalogue name.
      label: pooja?.name ?? service.label,
      note: service.note,
      url,
      pooja: pooja
        ? {
            name: pooja.name,
            slug: pooja.slug,
            startingPrice: pooja.startingPrice,
            marketPrice: pooja.marketPrice,
            image: pooja.featuredImage || pooja.heroBanner,
            shortDescription: pooja.shortDescription,
          }
        : null,
    });
  }

  // ---- Coverage: the places inside this one
  let coverageLocations: LeanLocation[] = [];
  if (page.pageType === "office_location" && city) {
    coverageLocations = (await SeoLocationModel.find({ city: city._id, type: "commercial", isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()) as unknown as LeanLocation[];
  } else if (location?.type === "city") {
    coverageLocations = (await SeoLocationModel.find({ city: location._id, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()) as unknown as LeanLocation[];
  } else if (location) {
    coverageLocations = (await SeoLocationModel.find({ parent: location._id, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()) as unknown as LeanLocation[];
  }
  const coveragePages = await publishedLocationPages(coverageLocations.map((l) => l._id));
  const coverageGroups = ["sector", "locality", "commercial", "society"]
    .map((type) => ({
      type,
      label: LOCATION_TYPE_LABELS[type],
      items: coverageLocations
        .filter((l) => l.type === type)
        .map((l) => {
          const linked = coveragePages.get(String(l._id));
          return { name: l.name, areaLabel: l.areaLabel, path: linked ? path(linked.slug) : null };
        }),
    }))
    .filter((g) => g.items.length > 0);

  // ---- Nearby locations
  let nearby: { name: string; path: string }[] = [];
  if (page.pageType === "service") {
    const officeCities = await SeoPageModel.find({ pageType: "office_location", status: "published" })
      .sort({ directoryOrder: 1, name: 1 })
      .select("slug name h1")
      .lean();
    nearby = officeCities.map((p) => ({ name: p.name, path: path(p.slug) }));
  } else if (location || city) {
    let candidates: LeanLocation[];
    if (page.nearbyLocations?.length) {
      candidates = (await SeoLocationModel.find({ _id: { $in: page.nearbyLocations } }).lean()) as unknown as LeanLocation[];
    } else if (location?.type === "city" || page.pageType === "office_location") {
      candidates = (await SeoLocationModel.find({ type: "city", isActive: true, _id: { $ne: city?._id } })
        .sort({ sortOrder: 1, name: 1 })
        .lean()) as unknown as LeanLocation[];
    } else {
      candidates = (await SeoLocationModel.find({
        city: city?._id,
        type: location?.type,
        isActive: true,
        _id: { $ne: location?._id },
      })
        .sort({ sortOrder: 1, name: 1 })
        .lean()) as unknown as LeanLocation[];
    }
    const nearbyPages = await publishedLocationPages(
      candidates.map((l) => l._id),
      page.pageType === "office_location" ? "office_location" : "location",
    );
    nearby = candidates
      .map((l) => nearbyPages.get(String(l._id)))
      .filter((p): p is LeanPage => !!p)
      .slice(0, 12)
      .map((p) => ({ name: p.name, path: path(p.slug) }));
  }

  // ---- Related service pages + hand-picked internal links
  const relatedServicePages = await SeoPageModel.find({ pageType: "service", status: "published", _id: { $ne: page._id } })
    .sort({ directoryOrder: 1, name: 1 })
    .select("slug name h1")
    .limit(9)
    .lean();
  const internalLinks = [];
  for (const link of page.internalLinks ?? []) {
    if (await isLiveUrl(link.url)) internalLinks.push(link);
  }
  const cityPage = city ? (await publishedLocationPages([city._id])).get(String(city._id)) : undefined;
  const officeCityPage = city ? (await publishedLocationPages([city._id], "office_location")).get(String(city._id)) : undefined;

  // ---- Real, approved reviews for the poojas this page offers
  const reviews = poojaIds.length
    ? await ReviewModel.find({ entityType: "pooja", entityId: { $in: poojaIds }, status: "approved" })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("customerName rating comment createdAt entityId")
        .lean()
    : [];

  if (isBasicCityPage && nearby.length === 0) {
    nearby = (await getCityLinks()).filter((l) => l.url !== `/${page.slug}`).map((l) => ({ name: l.label, path: l.url }));
  }

  return {
    _id: page._id,
    pageType: page.pageType,
    slug: page.slug,
    name: page.name,
    h1: page.h1 || page.name,
    metaTitle: page.metaTitle || page.h1 || page.name,
    metaDescription: page.metaDescription || page.intro || "",
    intro:
      page.intro ||
      (await getSeoSettings()).landing.cityFallbackIntro.replace(/\{place\}/g, location?.name ?? city?.name ?? page.name),
    content: page.content,
    bannerImage: page.bannerImage,
    images: page.images ?? [],
    heroTagline: page.heroTagline,
    faqs: page.faqs ?? [],
    coverageNote: page.coverageNote,
    canonicalUrl: page.canonicalUrl,
    indexable: page.indexable !== false,
    updatedAt: page.updatedAt,
    location: location ? { name: location.name, type: location.type, slug: location.slug } : null,
    city: city ? { name: city.name, slug: city.slug } : null,
    breadcrumbs,
    services,
    coverageGroups,
    nearby,
    relatedServices: relatedServicePages.map((p) => ({ name: p.name, path: path(p.slug) })),
    internalLinks,
    cityPage: cityPage && cityPage.slug !== page.slug ? { name: cityPage.name, path: path(cityPage.slug) } : null,
    officeCityPage:
      officeCityPage && officeCityPage.slug !== page.slug
        ? { name: officeCityPage.name, path: path(officeCityPage.slug) }
        : null,
    reviews: reviews.map((r) => ({
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      pooja: poojaById.get(String(r.entityId))?.name,
    })),
  };
}

/** A page is listed in the directory/sitemap only when it is live, indexable
 * and canonical to itself. */
function isEligible(page: LeanPage, siteUrl?: string) {
  if (page.status !== "published" || page.indexable === false) return false;
  if (!page.canonicalUrl) return true;
  const own = path(page.slug);
  const canonical = page.canonicalUrl.replace(/\/+$/, "");
  return canonical === own || (!!siteUrl && canonical === `${siteUrl.replace(/\/+$/, "")}${own}`);
}

export async function getDirectory() {
  // Live pages are listed for visitors even while noindex (e.g. societies
  // still waiting for unique content); the sitemap stays indexable-only.
  const pages = ((await SeoPageModel.find({ status: "published", showInDirectory: true })
    .select("pageType slug name h1 location canonicalUrl indexable status directorySection directoryOrder")
    .lean()) as unknown as LeanPage[]).filter((p) => isEligible({ ...p, indexable: true }));

  const locationIds = pages.map((p) => p.location).filter((id): id is Id => !!id);
  const locations = (await SeoLocationModel.find({ _id: { $in: locationIds } }).lean()) as unknown as LeanLocation[];
  const locationById = new Map(locations.map((l) => [String(l._id), l]));
  // Every served city is listed (SEO cities, or else Cities & Service Areas),
  // linking to its written page when published, otherwise its basic city page.
  const cities = await getServiceCities();

  const sortPages = (a: LeanPage, b: LeanPage) =>
    (a.directoryOrder ?? 0) - (b.directoryOrder ?? 0) || a.name.localeCompare(b.name);
  const link = (p: LeanPage) => ({ name: p.name, path: path(p.slug) });

  const SECTION_LABELS: Record<string, string> = {
    sectors: "Sector-wise Locations",
    localities: "Localities & Areas",
    commercial: "Commercial Areas",
    societies: "Residential Societies",
  };

  const cityGroups = cities
    .map((city) => {
      const cityId = city.locationId ? String(city.locationId) : null;
      const inCity = cityId
        ? pages.filter((p) => {
            if (p.pageType !== "location" || !p.location) return false;
            const loc = locationById.get(String(p.location));
            return !!loc && (String(loc._id) === cityId || String(loc.city) === cityId);
          })
        : [];
      const main = inCity.find((p) => String(p.location) === cityId);
      const sections = ["sectors", "localities", "commercial", "societies"]
        .map((section) => ({
          key: section,
          label: SECTION_LABELS[section],
          links: inCity
            .filter((p) => p !== main && (p.directorySection === section || (p.directorySection === "main" && section === "localities")))
            .sort(sortPages)
            .map(link),
        }))
        .filter((s) => s.links.length > 0);
      return {
        key: city.slug,
        title: city.name,
        main: main ? link(main) : { name: `Pandit in ${city.name}`, path: `/pandit-in-${city.slug}` },
        sections,
      };
    });

  const office = pages.filter((p) => p.pageType === "office_location").sort(sortPages).map(link);
  const services = pages.filter((p) => p.pageType === "service").sort(sortPages).map(link);

  const poojas = (
    await PoojaModel.find({ status: "published" }).sort({ sortOrder: 1, createdAt: 1 }).select("name slug").lean()
  ).map((p) => ({ name: p.name, path: `/poojas/${p.slug}` }));

  return { cities: cityGroups, office, services, poojas };
}

// Footer is on every page — cache the validated result briefly.
let footerCache: { at: number; data: unknown } | null = null;
const FOOTER_TTL_MS = 60_000;

export function invalidateFooterCache() {
  footerCache = null;
}

export interface PublicFooterGroup {
  key: string;
  kind: "links" | "tags" | "cities" | "categories" | "poojas" | "blogs" | "text";
  title: string;
  body?: string;
  links: { label: string; url: string }[];
}

export async function getPublicFooter(): Promise<PublicFooterGroup[]> {
  if (footerCache && Date.now() - footerCache.at < FOOTER_TTL_MS) return footerCache.data as PublicFooterGroup[];
  let groups: { key: string; title: string; kind?: string | null; body?: string | null; limit?: number | null; links?: { label: string; url: string; isActive?: boolean | null }[] }[] =
    await SeoFooterGroupModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  // Nothing saved yet → show the default blocks, built live from the database.
  if (groups.length === 0 && !(await SeoFooterGroupModel.exists({}))) {
    const { buildDefaultFooterGroups } = await import("./starter-data.service.js");
    groups = await buildDefaultFooterGroups();
  }
  const data: PublicFooterGroup[] = [];
  for (const group of groups) {
    const kind = (group.kind ?? "links") as PublicFooterGroup["kind"];
    const limit = group.limit ?? 12;
    if (kind === "text") {
      if (group.body?.trim()) data.push({ key: group.key, kind, title: group.title, body: group.body.trim(), links: [] });
      continue;
    }
    if (kind === "cities") {
      // "Pandit in <city>" for every served city, then the directory link last.
      const cityLinks = (await getCityLinks()).slice(0, limit);
      const cityColumn = [...cityLinks, { label: group.body?.trim() || "All SEO Pages", url: "/seo-pages" }];
      if (cityLinks.length) data.push({ key: group.key, kind: "links", title: group.title, links: cityColumn });
      continue;
    }
    if (kind === "categories") {
      // Expands into one column per pooja category (kind "links" on the site).
      for (const column of await buildCategoryColumns(group.key, limit)) data.push(column);
      continue;
    }
    let links: { label: string; url: string }[] = [];
    if (kind === "poojas") {
      const poojas = await PoojaModel.find({ status: "published" })
        .sort({ featured: -1, popular: -1, sortOrder: 1, createdAt: 1 })
        .limit(limit)
        .select("name slug")
        .lean();
      links = poojas.map((p) => ({ label: p.name, url: `/poojas/${p.slug}` }));
    } else if (kind === "blogs") {
      const blogs = await BlogModel.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).limit(limit).select("title slug").lean();
      links = blogs.map((b) => ({ label: b.title, url: `/blog/${b.slug}` }));
    } else {
      for (const l of group.links ?? []) {
        if (l.isActive === false) continue;
        // Only ever render links that resolve — no broken footer links.
        if (await isLiveUrl(l.url)) links.push({ label: l.label, url: l.url });
      }
    }
    // A hand-made column with a single live link looks broken — wait until
    // at least two of its pages are live (e.g. city pages being published).
    const minLinks = kind === "links" ? 2 : 1;
    if (links.length >= minLinks) data.push({ key: group.key, kind, title: group.title, links });
  }
  footerCache = { at: Date.now(), data };
  return data;
}

async function buildCategoryColumns(baseKey: string, maxColumns: number): Promise<PublicFooterGroup[]> {
  const [poojas, categories] = await Promise.all([
    PoojaModel.find({ status: "published" }).sort({ sortOrder: 1, createdAt: 1 }).select("name slug category").lean(),
    PoojaCategoryModel.find().select("name slug sortOrder").lean(),
  ]);
  const byCategory = new Map<string, { label: string; url: string }[]>();
  const uncategorised: { label: string; url: string }[] = [];
  for (const p of poojas) {
    const link = { label: p.name, url: `/poojas/${p.slug}` };
    if (p.category) {
      const key = String(p.category);
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(link);
    } else uncategorised.push(link);
  }
  const ranked = categories
    .filter((c) => byCategory.has(String(c._id)))
    .sort((a, b) => byCategory.get(String(b._id))!.length - byCategory.get(String(a._id))!.length || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const columns = Math.max(1, maxColumns);
  // Leave the last column for "More Pujas" when there are more categories than columns.
  const shown = ranked.length > columns ? ranked.slice(0, columns - 1) : ranked;
  const rest = ranked.filter((c) => !shown.includes(c)).flatMap((c) => byCategory.get(String(c._id))!);
  const out: PublicFooterGroup[] = shown.map((c) => ({
    key: `${baseKey}-${c.slug}`,
    kind: "links" as const,
    title: c.name,
    links: byCategory.get(String(c._id))!,
  }));
  const more = [...rest, ...uncategorised];
  if (more.length) out.push({ key: `${baseKey}-more`, kind: "links", title: "More Pujas", links: more });
  return out;
}

export async function getActiveRedirects() {
  return SeoRedirectModel.find({ isActive: true }).select("fromPath toPath statusCode -_id").lean();
}

export interface SitemapEntry {
  path: string;
  lastModified?: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = STATIC_PUBLIC_ROUTES.map((route) => ({
    path: route,
    changeFrequency: route === "/" ? "daily" : "monthly",
    priority: route === "/" ? 1 : route === "/poojas" ? 0.9 : 0.5,
  }));

  const [poojas, festivals, blogs, products, cmsPages, seoPages] = await Promise.all([
    PoojaModel.find({ status: "published" }).select("slug updatedAt").lean(),
    FestivalModel.find({ status: "published" }).select("slug updatedAt").lean(),
    BlogModel.find({ status: "published" }).select("slug updatedAt").lean(),
    ProductModel.find({ status: "published" }).select("slug updatedAt").lean(),
    PageModel.find({ status: "published" }).select("slug updatedAt").lean(),
    SeoPageModel.find({ status: "published", indexable: true })
      .select("pageType slug canonicalUrl indexable status updatedAt location")
      .lean() as unknown as Promise<LeanPage[]>,
  ]);

  for (const p of poojas) entries.push({ path: `/poojas/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 });
  for (const p of festivals) entries.push({ path: `/festivals/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.6 });
  for (const p of blogs) entries.push({ path: `/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.6 });
  for (const p of products) entries.push({ path: `/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.5 });
  for (const p of cmsPages) entries.push({ path: `/pages/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.4 });
  for (const p of seoPages.filter((sp) => isEligible(sp))) {
    entries.push({
      path: path(p.slug),
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: p.pageType === "service" ? 0.8 : 0.7,
    });
  }
  return entries;
}

export { isEligible as isSeoPageEligible };
