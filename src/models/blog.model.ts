import { Schema, model, type InferSchemaType } from "mongoose";

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "BlogCategory" },
    excerpt: { type: String },
    content: { type: String, required: true },
    coverImage: { type: String },
    author: { type: String, default: "PujariDekho Team" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
    seo: {
      title: { type: String },
      description: { type: String },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

blogSchema.index({ status: 1, publishedAt: -1 });

export type BlogDocument = InferSchemaType<typeof blogSchema>;
export const BlogModel = model("Blog", blogSchema);
