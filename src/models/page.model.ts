import { Schema, model, type InferSchemaType } from "mongoose";

const pageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    metaTitle: { type: String },
    metaDescription: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true },
);

export type PageDocument = InferSchemaType<typeof pageSchema>;
export const PageModel = model("Page", pageSchema);
