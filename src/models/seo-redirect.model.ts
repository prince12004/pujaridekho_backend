import { Schema, model, type InferSchemaType } from "mongoose";

const seoRedirectSchema = new Schema(
  {
    fromPath: { type: String, required: true, unique: true, trim: true },
    toPath: { type: String, required: true, trim: true },
    statusCode: { type: Number, enum: [301, 302, 308], default: 301 },
    isActive: { type: Boolean, default: true },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

export type SeoRedirectDocument = InferSchemaType<typeof seoRedirectSchema>;
export const SeoRedirectModel = model("SeoRedirect", seoRedirectSchema);
