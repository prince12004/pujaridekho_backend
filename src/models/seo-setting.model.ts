import { Schema, model, type InferSchemaType } from "mongoose";

const seoSettingSchema = new Schema(
  {
    pagePath: { type: String, required: true, unique: true, trim: true },
    title: { type: String },
    description: { type: String },
    keywords: { type: [String], default: [] },
    ogImage: { type: String },
  },
  { timestamps: true },
);

export type SeoSettingDocument = InferSchemaType<typeof seoSettingSchema>;
export const SeoSettingModel = model("SeoSetting", seoSettingSchema);
