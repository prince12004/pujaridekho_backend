import { Schema, model, type InferSchemaType } from "mongoose";

const newsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ["active", "unsubscribed"], default: "active" },
  },
  { timestamps: true },
);

export type NewsletterSubscriberDocument = InferSchemaType<typeof newsletterSubscriberSchema>;
export const NewsletterSubscriberModel = model("NewsletterSubscriber", newsletterSubscriberSchema);
