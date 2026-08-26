import { Schema, model, type InferSchemaType } from "mongoose";

const homeLeadSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    pooja: { type: String, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true },
);

homeLeadSchema.index({ createdAt: -1 });

export type HomeLeadDocument = InferSchemaType<typeof homeLeadSchema>;
export const HomeLeadModel = model("HomeLead", homeLeadSchema);
