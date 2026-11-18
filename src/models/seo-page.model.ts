import { Schema, model, type InferSchemaType } from "mongoose";

// A public landing page served at /<slug>.
//   location        "pandit-in-<location>"     — city, sector, locality, commercial area or society
//   office_location "office-puja-in-<city>"
//   service         "office-opening-puja" etc. — a service landing page, not tied to a place
// Services, FAQs and internal links are embedded (the Mongo equivalent of
// seo_page_services / seo_faqs / seo_internal_links) so a page is always
// read and written as one document.
export const SEO_PAGE_TYPES = ["location", "office_location", "service"] as const;
export const SEO_DIRECTORY_SECTIONS = ["main", "sectors", "localities", "commercial", "societies", "office"] as const;

const pageServiceSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    // Linked pooja (booking target + live price/image); optional for services
    // that only have an SEO service page.
    pooja: { type: Schema.Types.ObjectId, ref: "Pooja", default: null },
    url: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const internalLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const seoPageSchema = new Schema(
  {
    pageType: { type: String, enum: SEO_PAGE_TYPES, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    location: { type: Schema.Types.ObjectId, ref: "SeoLocation", default: null },
    // Admin-facing name, e.g. "Pandit in Gaur City 2".
    name: { type: String, required: true, trim: true },

    h1: { type: String, trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    // Plain-text lead paragraph shown under the H1.
    intro: { type: String, trim: true },
    // Sanitised rich-text HTML body.
    content: { type: String, default: "" },
    bannerImage: { type: String },
    images: { type: [String], default: [] },
    heroTagline: { type: String, trim: true },

    services: { type: [pageServiceSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    internalLinks: { type: [internalLinkSchema], default: [] },
    // Manually chosen nearby locations; when empty the page falls back to
    // published siblings in the same city.
    nearbyLocations: { type: [{ type: Schema.Types.ObjectId, ref: "SeoLocation" }], default: [] },
    // Free-text coverage (sectors/landmarks) shown alongside the auto-derived
    // list of child locations.
    coverageNote: { type: String, trim: true },

    canonicalUrl: { type: String, trim: true },
    indexable: { type: Boolean, default: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },

    showInDirectory: { type: Boolean, default: true },
    directorySection: { type: String, enum: SEO_DIRECTORY_SECTIONS, default: "main" },
    directoryOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One page per place per page type — e.g. only one "pandit-in-…" page for
// Gaur City 2, whatever its slug.
seoPageSchema.index(
  { pageType: 1, location: 1 },
  { unique: true, partialFilterExpression: { location: { $type: "objectId" } } },
);
seoPageSchema.index({ status: 1, indexable: 1 });

export type SeoPageDocument = InferSchemaType<typeof seoPageSchema>;
export const SeoPageModel = model("SeoPage", seoPageSchema);
