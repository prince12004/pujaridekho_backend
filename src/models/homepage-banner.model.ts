import { Schema, model, type InferSchemaType } from "mongoose";

const homepageBannerSchema = new Schema(
  {
    active: { type: Boolean, default: false },
    text: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "" },
  },
  { timestamps: true },
);

export type HomepageBannerDocument = InferSchemaType<typeof homepageBannerSchema>;
export const HomepageBannerModel = model("HomepageBanner", homepageBannerSchema);
