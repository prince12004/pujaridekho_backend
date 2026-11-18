import { Schema, model, type InferSchemaType } from "mongoose";

// Footer link columns (seo_footer_groups + seo_footer_links). Links are
// embedded and ordered by array position.
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
    links: { type: [footerLinkSchema], default: [] },
  },
  { timestamps: true },
);

export type SeoFooterGroupDocument = InferSchemaType<typeof seoFooterGroupSchema>;
export const SeoFooterGroupModel = model("SeoFooterGroup", seoFooterGroupSchema);
