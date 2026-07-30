import { Schema, model, type InferSchemaType } from "mongoose";

const poojaCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String },
    description: { type: String },
    seo: {
      title: { type: String },
      description: { type: String },
    },
    status: { type: String, enum: ["draft", "Published"], default: "draft" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PoojaCategoryDocument = InferSchemaType<typeof poojaCategorySchema>;
export const PoojaCategoryModel = model("PoojaCategory", poojaCategorySchema);
