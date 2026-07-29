import { Schema, model, type InferSchemaType } from "mongoose";

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

export type MediaDocument = InferSchemaType<typeof mediaSchema>;
export const MediaModel = model("Media", mediaSchema);
