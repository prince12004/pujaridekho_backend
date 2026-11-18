import { Schema, model, type InferSchemaType } from "mongoose";

// One collection for every place the location-SEO system knows about — the
// Mongo equivalent of seo_cities / seo_sectors / seo_localities /
// seo_societies, distinguished by `type`. Every non-city location belongs to
// a city; sectors/localities/societies/commercial areas may also hang off a
// parent sector or locality (e.g. a society inside "Sector 150").
export const SEO_LOCATION_TYPES = ["city", "sector", "locality", "commercial", "society"] as const;
export type SeoLocationType = (typeof SEO_LOCATION_TYPES)[number];

const seoLocationSchema = new Schema(
  {
    type: { type: String, enum: SEO_LOCATION_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    // Location key, also the default suffix of its page URL ("pandit-in-<slug>").
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: Schema.Types.ObjectId, ref: "SeoLocation", default: null },
    parent: { type: Schema.Types.ObjectId, ref: "SeoLocation", default: null },
    // Short factual note for admins / coverage lists (e.g. "Golf Course Road").
    areaLabel: { type: String, trim: true },
    pincode: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

seoLocationSchema.index({ type: 1, city: 1, sortOrder: 1, name: 1 });
seoLocationSchema.index({ parent: 1 });

export type SeoLocationDocument = InferSchemaType<typeof seoLocationSchema>;
export const SeoLocationModel = model("SeoLocation", seoLocationSchema);
