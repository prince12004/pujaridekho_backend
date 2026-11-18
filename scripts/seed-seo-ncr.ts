/**
 * Seeds the Delhi NCR location-SEO system:
 *   - 6 cities, their sectors / localities / commercial areas and societies
 *   - a DRAFT "pandit-in-<slug>" page for every location (filled in by admins)
 *   - 21 PUBLISHED pages with hand-written content (6 city, 6 office-city, 9 service)
 *   - the default footer link columns
 *
 * Safe to re-run: it only inserts what is missing and never overwrites
 * anything an admin has edited. A seeded page is published only if it passes
 * the same indexability checks the admin panel enforces.
 *
 *   npx tsx scripts/seed-seo-ncr.ts            # apply
 *   npx tsx scripts/seed-seo-ncr.ts --dry-run  # report only
 *   npx tsx scripts/seed-seo-ncr.ts --reset-footer  # rebuild footer columns
 */
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { PoojaModel } from "../src/models/pooja.model.js";
import { SeoFooterGroupModel } from "../src/models/seo-footer-group.model.js";
import { SeoLocationModel } from "../src/models/seo-location.model.js";
import { SeoPageModel } from "../src/models/seo-page.model.js";
import { indexabilityProblems, internalPathExists, sanitizeContent } from "../src/features/seo-management/seo-content.js";
import { SEED_AREAS, SEED_CITIES, SEED_SOCIETIES } from "./data/seo-ncr-locations.js";
import { SEED_PAGES, type SeedService } from "./data/seo-ncr-content.js";

const DRY_RUN = process.argv.includes("--dry-run");
const RESET_FOOTER = process.argv.includes("--reset-footer");

const stats = { locations: 0, draftPages: 0, published: 0, skippedExisting: 0, notPublished: [] as string[] };

async function upsertLocation(doc: Record<string, unknown> & { slug: string }) {
  const existing = await SeoLocationModel.findOne({ slug: doc.slug });
  if (existing) return existing;
  stats.locations++;
  if (DRY_RUN) return new SeoLocationModel(doc);
  return SeoLocationModel.create(doc);
}

function directorySectionFor(type: string) {
  return type === "sector" ? "sectors" : type === "commercial" ? "commercial" : type === "society" ? "societies" : type === "city" ? "main" : "localities";
}

async function ensureDraftPage(location: InstanceType<typeof SeoLocationModel>) {
  const slug = `pandit-in-${location.slug}`;
  if (await SeoPageModel.exists({ $or: [{ slug }, { pageType: "location", location: location._id }] })) return;
  stats.draftPages++;
  if (DRY_RUN) return;
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
    // Neither a matching pooja nor a fallback page — leave it out rather than add a dead link.
  }
  return resolved;
}

async function main() {
  await connectDatabase();
  console.log(`Connected to ${mongoose.connection.name}${DRY_RUN ? " (dry run)" : ""}`);

  // ---- Locations
  const bySlug = new Map<string, InstanceType<typeof SeoLocationModel>>();
  for (const city of SEED_CITIES) {
    const doc = await upsertLocation({ type: "city", name: city.name, slug: city.slug, sortOrder: city.sortOrder, city: null });
    bySlug.set(city.slug, doc);
  }
  for (const [i, area] of SEED_AREAS.entries()) {
    const city = bySlug.get(area.city)!;
    const doc = await upsertLocation({
      type: area.type,
      name: area.name,
      slug: area.slug,
      areaLabel: area.areaLabel,
      city: city._id,
      parent: city._id,
      sortOrder: i,
    });
    bySlug.set(area.slug, doc);
  }
  for (const [i, society] of SEED_SOCIETIES.entries()) {
    const city = bySlug.get(society.city)!;
    const parent = society.parent ? bySlug.get(society.parent) : city;
    const doc = await upsertLocation({
      type: "society",
      name: society.name,
      slug: society.slug,
      city: city._id,
      parent: parent?._id ?? city._id,
      sortOrder: i,
    });
    bySlug.set(society.slug, doc);
  }

  // ---- Hand-written pages (published if they pass the quality gate)
  for (const seed of SEED_PAGES) {
    if (await SeoPageModel.exists({ slug: seed.slug })) {
      stats.skippedExisting++;
      continue;
    }
    const location = seed.location ? bySlug.get(seed.location) : undefined;
    // A draft auto-page may already exist for this city — fill it in rather than duplicate it.
    const existingForLocation =
      location && seed.pageType === "location"
        ? await SeoPageModel.findOne({ pageType: "location", location: location._id })
        : null;

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

    const problems = await indexabilityProblems({ ...data, _id: existingForLocation?._id });
    const status = problems.length ? "draft" : "published";
    if (problems.length) stats.notPublished.push(`/${seed.slug}: ${problems.join("; ")}`);
    else stats.published++;

    if (DRY_RUN) continue;
    if (existingForLocation) {
      if (existingForLocation.status === "published" || existingForLocation.intro) {
        stats.skippedExisting++;
        continue;
      }
      existingForLocation.set({ ...data, status, publishedAt: status === "published" ? new Date() : undefined });
      await existingForLocation.save();
    } else {
      await SeoPageModel.create({ ...data, status, publishedAt: status === "published" ? new Date() : undefined });
    }
  }

  // ---- Draft pages for every other location (after the city pages exist)
  for (const location of bySlug.values()) await ensureDraftPage(location);

  // ---- Footer columns
  const footerExists = await SeoFooterGroupModel.exists({});
  if (!footerExists || RESET_FOOTER) {
    const company = [
      { label: "About Us", url: "/about" },
      { label: "Contact Us", url: "/contact" },
      { label: "How It Works", url: "/pages/how-it-works" },
      { label: "FAQs", url: "/faq" },
      { label: "Become a Pandit", url: "/become-a-pandit" },
      { label: "Blog", url: "/blog" },
      { label: "Privacy Policy", url: "/privacy-policy" },
      { label: "Terms & Conditions", url: "/terms-and-conditions" },
      { label: "Cancellation Policy", url: "/pages/cancellation-policy" },
      { label: "Refund Policy", url: "/refund-policy" },
    ];
    const companyLinks = [];
    for (const link of company) {
      // CMS pages that don't exist yet are added switched off — create them in
      // Pages CMS and switch the link on in SEO Management → Footer.
      const live = link.url.startsWith("/pages/") ? await internalPathExists(link.url) : true;
      companyLinks.push({ ...link, isActive: live });
    }

    // Our own wording — only claims PujariDekho can stand behind (no
    // invented pandit counts or "AI" features).
    const textBlocks = [
      {
        key: "about-verified-pandits",
        title: "Verified Pandits",
        body:
          "Every pandit ji on PujariDekho is verified before being assigned to a booking, and performs the puja according to traditional vidhi — whether it is a Griha Pravesh, Satyanarayan Katha, Rudrabhishek or a sanskar ceremony for your family.",
      },
      {
        key: "about-online-booking",
        title: "Online Puja Booking",
        body:
          "Choose your puja, enter your address and preferred date, and confirm online with a ₹99 booking amount or the full amount. The price is shown before you pay, and you can add the puja samagri so it arrives with the pandit ji.",
      },
      {
        key: "about-pandit-near-me",
        title: "Pandit Ji Near Me",
        body:
          "Looking for a pandit near you in Delhi NCR? PujariDekho serves homes, societies, offices and shops across Noida, Greater Noida, Greater Noida West, Ghaziabad, Delhi and Gurugram. See all locations on our SEO directory page.",
      },
      {
        key: "about-muhurat",
        title: "Muhurat & Guidance",
        body:
          "Not sure which puja suits the occasion or when to hold it? Message our team on WhatsApp for help choosing the right puja and a suitable muhurat for Griha Pravesh, Mundan, Namkaran, business openings and other ceremonies.",
      },
    ].map((b) => ({ ...b, kind: "text" as const, links: [] as { label: string; url: string; isActive: boolean }[] }));

    const groups = [
      ...textBlocks,
      { key: "popular-pujas", title: "Popular Pujas", kind: "poojas" as const, limit: 12, links: [] },
      {
        key: "seo-pages",
        title: "Pandit Near You",
        links: [
          { label: "All SEO Pages", url: "/seo-pages", isActive: true },
          ...SEED_CITIES.map((c) => ({ label: `Pandit in ${c.name}`, url: `/pandit-in-${c.slug}`, isActive: true })),
        ],
      },
      {
        key: "office-business",
        title: "Office & Business Puja",
        links: [
          { label: "Office Opening Puja", url: "/office-opening-puja" },
          { label: "Corporate Office Puja", url: "/corporate-office-puja" },
          { label: "Shop Opening Puja", url: "/shop-opening-puja" },
          { label: "Business Opening Puja", url: "/business-opening-puja" },
          { label: "Factory Opening Puja", url: "/factory-opening-puja" },
          { label: "Office Vastu Shanti", url: "/office-vastu-shanti-puja" },
          { label: "Diwali Office Puja", url: "/diwali-office-puja" },
        ].map((l) => ({ ...l, isActive: true })),
      },
      { key: "company", title: "Company", links: companyLinks },
      { key: "latest-blogs", title: "Latest Blogs", kind: "blogs" as const, limit: 5, links: [] },
    ];

    if (!DRY_RUN) {
      if (RESET_FOOTER) await SeoFooterGroupModel.deleteMany({});
      for (const [i, group] of groups.entries()) {
        await SeoFooterGroupModel.updateOne({ key: group.key }, { $set: { ...group, sortOrder: i, isActive: true } }, { upsert: true });
      }
    }
    console.log("Footer blocks:", groups.map((g) => `${g.title}${"kind" in g && g.kind !== "links" ? ` [${g.kind}]` : ` (${g.links.filter((l) => l.isActive).length} links)`}`).join(", "));
    const off = groups.flatMap((g) => g.links.filter((l) => !l.isActive).map((l) => `${g.title} → ${l.label}`));
    if (off.length) console.log("Footer links switched off until their page exists:\n  " + off.join("\n  "));
  } else {
    console.log("Footer already configured — left unchanged (use --reset-footer to rebuild).");
  }

  console.log(`New locations: ${stats.locations}`);
  console.log(`New draft location pages: ${stats.draftPages}`);
  console.log(`Published content pages: ${stats.published}`);
  console.log(`Pages skipped (already existed): ${stats.skippedExisting}`);
  if (stats.notPublished.length) console.log("Kept as draft (failed quality check):\n  " + stats.notPublished.join("\n  "));
  const unmatched = [...poojaCache.entries()].filter(([, v]) => !v).map(([k]) => k);
  if (unmatched.length) console.log(`No published pooja matched: ${unmatched.join(", ")} (fallback URL used or service omitted)`);

  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
