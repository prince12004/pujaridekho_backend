import { Schema, model, type InferSchemaType } from "mongoose";

const productCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String },
    description: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ProductCategoryDocument = InferSchemaType<typeof productCategorySchema>;
export const ProductCategoryModel = model("ProductCategory", productCategorySchema);
