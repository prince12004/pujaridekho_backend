import { Schema, model, type InferSchemaType } from "mongoose";

const citySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    state: { type: String },
    image: { type: String },
    isServiceable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "published" },
  },
  { timestamps: true },
);

export type CityDocument = InferSchemaType<typeof citySchema>;
export const CityModel = model("City", citySchema);
