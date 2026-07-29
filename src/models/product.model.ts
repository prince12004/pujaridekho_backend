import { Schema, model, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "ProductCategory" },
    shortDescription: { type: String },
    description: { type: String },
    images: { type: [String], default: [] },
    sku: { type: String },
    sellingPrice: { type: Number, required: true, min: 0 },
    marketPrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String },
      description: { type: String },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

productSchema.index({ status: 1, featured: 1 });
productSchema.index({ category: 1 });

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel = model("Product", productSchema);
