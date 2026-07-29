import { Schema, model, type InferSchemaType } from "mongoose";

const cityPoojaSeoSchema = new Schema(
  {
    city: { type: Schema.Types.ObjectId, ref: "City", required: true },
    pooja: { type: Schema.Types.ObjectId, ref: "Pooja", required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String },
    description: { type: String },
  },
  { timestamps: true },
);

cityPoojaSeoSchema.index({ city: 1, pooja: 1 }, { unique: true });

export type CityPoojaSeoDocument = InferSchemaType<typeof cityPoojaSeoSchema>;
export const CityPoojaSeoModel = model("CityPoojaSeo", cityPoojaSeoSchema);
