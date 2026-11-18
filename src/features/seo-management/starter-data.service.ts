import { PoojaModel } from "../../models/pooja.model.js";
import { SeoFooterGroupModel } from "../../models/seo-footer-group.model.js";
import { SeoLocationModel } from "../../models/seo-location.model.js";
import { SeoPageModel } from "../../models/seo-page.model.js";
import { indexabilityProblems, internalPathExists, sanitizeContent } from "./seo-content.js";
import { invalidateFooterCache } from "./seo-public.service.js";
import { SEED_AREAS, SEED_CITIES, SEED_SOCIETIES } from "./starter-data/locations.js";
import { SEED_PAGES, type SeedService } from "./starter-data/content.js";
import { STARTER_COMPANY_LINKS, STARTER_FOOTER_TEXT_BLOCKS, STARTER_OFFICE_LINKS } from "./starter-data/footer.js";

export interface StarterImportOptions {
  dryRun?: boolean;
  locations?: boolean; // cities, areas, societies + their draft pages
  pages?: boolean; // the 21 written pages
  footer?: boolean; // default footer blocks (only if none exist, unless resetFooter)
  resetFooter?: boolean;
}

export interface StarterImportReport {
  dryRun: boolean;
  locations: number;
  draftPages: number;
  published: number;
  skippedExisting: number;
  notPublished: string[];
  footer: "created" | "kept-existing" | "skipped";
  footerLinksOff: string[];
  unmatchedPoojas: string[];
}

/** Default footer blocks: shown live when no footer has been saved yet, and
 * written to the database only by the starter import or an admin save. */
export async function buildDefaultFooterGroups() {
  const companyLinks = [];
  for (const link of STARTER_COMPANY_LINKS) {
    companyLinks.push({ ...link, isActive: link.url.startsWith("/pages/") ? await internalPathExists(link.url) : true });
  }
  // Popular Searches: the directory, the city pages and the top published
  // poojas. Links to pages that aren't live yet are hidden on the website.
  const topPoojas = await PoojaModel.find({ status: "published" })
    .sort({ featured: -1, popular: -1, sortOrder: 1, createdAt: 1 })
    .limit(6)
    .select("name slug")
    .lean();
  const searchLinks = [
    { label: "All Locations", url: "/seo-pages", isActive: true },
    ...SEED_CITIES.map((c) => ({ label: `Pandit in ${c.name}`, url: `/pandit-in-${c.slug}`, isActive: true })),
    ...topPoojas.map((p) => ({ label: p.name, url: `/poojas/${p.slug}`, isActive: true })),
    { label: "Office Puja", url: "/office-puja", isActive: true },
  ];
  return [
    { key: "popular-searches", title: "Popular Searches", kind: "tags" as const, isActive: true, links: searchLinks },
    ...STARTER_FOOTER_TEXT_BLOCKS.map((b) => ({ ...b, kind: "text" as const, isActive: true, links: [] })),
    { key: "popular-pujas", title: "Popular Pujas", kind: "poojas" as const, limit: 8, isActive: true, links: [] },
    { key: "pandit-near-you", title: "Pandit Near You", kind: "cities" as const, body: "All SEO Pages", limit: 12, isActive: true, links: [] },
    { key: "office-business", title: "Office & Business Puja", kind: "links" as const, isActive: true, links: STARTER_OFFICE_LINKS.map((l) => ({ ...l, isActive: true })) },
    { key: "company", title: "Company", kind: "links" as const, isActive: true, links: companyLinks },
    { key: "latest-blogs", title: "Latest Blogs", kind: "blogs" as const, limit: 5, isActive: true, links: [] },
  ];
}

function directorySectionFor(type: string) {
  return type === "sector" ? "sectors" : type === "commercial" ? "commercial" : type === "society" ? "societies" : type === "city" ? "main" : "localities";
}

/**
 * Optional Delhi NCR starter set, triggered from Admin → SEO Management →
 * "Import starter data" (or `npm run seed:seo`). It only inserts what is
 * missing and never overwrites anything already in the database. Written
 * pages are published only if they pass the same checks as the admin panel.
 * Once imported, everything is ordinary data — edit or delete it in admin.
 */
export async function importStarterData(options: StarterImportOptions = {}): Promise<StarterImportReport> {
  const dryRun = !!options.dryRun;
  const report: StarterImportReport = {
    dryRun,
    locations: 0,
    draftPages: 0,
    published: 0,
    skippedExisting: 0,
    notPublished: [],
    footer: "skipped",
    footerLinksOff: [],
    unmatchedPoojas: [],
  };
  const poojaCache = new Map<string, { _id: unknown; slug: string } | null>();

  async function findPooja(pattern: string) {
    if (!poojaCache.has(pattern)) {
      const pooja = await PoojaModel.findOne({ status: "published", name: { $regex: pattern, $options: "i" } })
        .sort({ sortOrder: 1, createdAt: 1 })
        .select("slug")
        .lean();
      poojaCache.set(pattern, pooja ? { _id: pooja._id, slug: pooja.slug } : null);
    }
    return poojaCache.get(pattern) ?? null;
  }

  async function resolveServices(services: SeedService[]) {
    const resolved = [];
    for (const service of services) {
      const pooja = service.pooja ? await findPooja(service.pooja) : null;
      if (pooja) resolved.push({ label: service.label, pooja: pooja._id });
      else if (service.url) resolved.push({ label: service.label, url: service.url });
    }
    return resolved;
  }

  async function upsertLocation(doc: Record<string, unknown> & { slug: string }) {
    const existing = await SeoLocationModel.findOne({ slug: doc.slug });
    if (existing) return existing;
    report.locations++;
    return dryRun ? new SeoLocationModel(doc) : SeoLocationModel.create(doc);
  }

  // ---- Locations (always resolved: pages need the city ids)
  const bySlug = new Map<string, InstanceType<typeof SeoLocationModel>>();
  const wantLocations = options.locations !== false;
  if (wantLocations || options.pages !== false) {
    for (const city of SEED_CITIES) {
      bySlug.set(city.slug, await upsertLocation({ type: "city", name: city.name, slug: city.slug, sortOrder: city.sortOrder, city: null }));
    }
  }
  if (wantLocations) {
    for (const [i, area] of SEED_AREAS.entries()) {
      const city = bySlug.get(area.city)!;
      bySlug.set(
        area.slug,
        await upsertLocation({ type: area.type, name: area.name, slug: area.slug, areaLabel: area.areaLabel, city: city._id, parent: city._id, sortOrder: i }),
      );
    }
    for (const [i, society] of SEED_SOCIETIES.entries()) {
      const city = bySlug.get(society.city)!;
      const parent = society.parent ? bySlug.get(society.parent) : city;
      bySlug.set(
        society.slug,
        await upsertLocation({ type: "society", name: society.name, slug: society.slug, city: city._id, parent: parent?._id ?? city._id, sortOrder: i }),
      );
    }
  }

  // ---- Written pages (published only if they pass the quality checks)
  if (options.pages !== false) {
    for (const seed of SEED_PAGES) {
      const location = seed.location ? bySlug.get(seed.location) : undefined;
      // An existing page for this URL or place is only filled in if it is still
      // an empty draft (e.g. the auto-created "Pandit in Noida" draft);
      // anything published or already written is left untouched.
      const existing = await SeoPageModel.findOne({
        $or: [
          { slug: seed.slug },
          ...(location && seed.pageType !== "service" ? [{ pageType: seed.pageType, location: location._id }] : []),
        ],
      });
      if (existing && (existing.status === "published" || existing.intro?.trim() || existing.content?.trim())) {
        report.skippedExisting++;
        continue;
      }
      const data = {
        pageType: seed.pageType,
        slug: seed.slug,
        location: location?._id ?? null,
        name: seed.name,
        h1: seed.h1,
        metaTitle: seed.metaTitle,
        metaDescription: seed.metaDescription,
        heroTagline: seed.heroTagline,
        intro: seed.intro,
        content: sanitizeContent(seed.content),
        coverageNote: seed.coverageNote,
        faqs: seed.faqs,
        // Location pages list every published pooja automatically.
        services: seed.pageType === "location" ? [] : await resolveServices(seed.services),
        indexable: true,
        showInDirectory: true,
        directorySection: seed.pageType === "office_location" ? "office" : "main",
        directoryOrder: seed.directoryOrder,
      };
      const problems = await indexabilityProblems({ ...data, _id: existing?._id });
      const status = problems.length ? "draft" : "published";
      if (problems.length) report.notPublished.push(`/${seed.slug}: ${problems.join("; ")}`);
      else report.published++;
      if (dryRun) continue;
      const publishedAt = status === "published" ? new Date() : undefined;
      if (existing) {
        existing.set({ ...data, status, publishedAt });
        await existing.save();
      } else {
        await SeoPageModel.create({ ...data, status, publishedAt });
      }
    }
  }

  // ---- Draft pages for every imported location
  if (wantLocations) {
    for (const location of bySlug.values()) {
      const slug = `pandit-in-${location.slug}`;
      if (await SeoPageModel.exists({ $or: [{ slug }, { pageType: "location", location: location._id }] })) continue;
      report.draftPages++;
      if (dryRun) continue;
      await SeoPageModel.create({
        pageType: "location",
        slug,
        location: location._id,
        name: `Pandit in ${location.name}`,
        h1: `Pandit in ${location.name}`,
        status: "draft",
        indexable: true,
        directorySection: directorySectionFor(location.type),
      });
    }
  }

  // ---- Footer blocks
  if (options.footer !== false) {
    const hasFooter = await SeoFooterGroupModel.exists({});
    if (hasFooter && !options.resetFooter) {
      report.footer = "kept-existing";
    } else {
      const groups = await buildDefaultFooterGroups();
      for (const g of groups) {
        for (const l of g.links) if (!l.isActive) report.footerLinksOff.push(`${g.title} → ${l.label} (create ${l.url} in Pages CMS, then switch it on)`);
      }
      if (!dryRun) {
        if (options.resetFooter) await SeoFooterGroupModel.deleteMany({});
        for (const [i, group] of groups.entries()) {
          await SeoFooterGroupModel.updateOne({ key: group.key }, { $set: { ...group, sortOrder: i, isActive: true } }, { upsert: true });
        }
        invalidateFooterCache();
      }
      report.footer = "created";
    }
  }

  report.unmatchedPoojas = [...poojaCache.entries()].filter(([, v]) => !v).map(([k]) => k);
  return report;
}
