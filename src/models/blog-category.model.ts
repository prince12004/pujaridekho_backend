import { Schema, model, type InferSchemaType } from "mongoose";

const blogCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true },
);

export type BlogCategoryDocument = InferSchemaType<typeof blogCategorySchema>;
export const BlogCategoryModel = model("BlogCategory", blogCategorySchema);
