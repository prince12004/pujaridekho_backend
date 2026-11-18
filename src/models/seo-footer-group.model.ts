import { Schema, model, type InferSchemaType } from "mongoose";

// Footer blocks (seo_footer_groups + seo_footer_links), ordered by sortOrder:
//   links  — a hand-made list of links (ordered by array position)
//   tags   — a hand-made list shown as pill links beside the logo (e.g. Popular Searches)
//   poojas — links generated from published poojas (featured/popular first)
//   blogs  — links to the latest published blog posts
//   text   — a heading + paragraph (e.g. "Verified Pandits"), shown above the link columns
export const FOOTER_GROUP_KINDS = ["links", "tags", "poojas", "blogs", "text"] as const;
const footerLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const seoFooterGroupSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    kind: { type: String, enum: FOOTER_GROUP_KINDS, default: "links" },
    body: { type: String, trim: true },
    // Max links for the automatic kinds (poojas / blogs).
    limit: { type: Number, default: 12, min: 1, max: 30 },
    links: { type: [footerLinkSchema], default: [] },
  },
  { timestamps: true },
);

export type SeoFooterGroupDocument = InferSchemaType<typeof seoFooterGroupSchema>;
export const SeoFooterGroupModel = model("SeoFooterGroup", seoFooterGroupSchema);
