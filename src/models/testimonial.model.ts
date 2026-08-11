import { Schema, model, type InferSchemaType } from "mongoose";

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    quote: { type: String, required: true },
    photo: { type: String },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type TestimonialDocument = InferSchemaType<typeof testimonialSchema>;
export const TestimonialModel = model("Testimonial", testimonialSchema);
