import { Schema, model, type InferSchemaType } from "mongoose";

const samagriItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    includedByDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const packageSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    duration: { type: String },
    panditCount: { type: Number, default: 1 },
    samagriIncluded: { type: Boolean, default: false },
    dakshinaIncluded: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    description: { type: String },
    recommended: { type: Boolean, default: false },
  },
  { _id: false },
);

const vidhiStepSchema = new Schema({ title: String, description: String }, { _id: false });
const faqSchema = new Schema({ question: String, answer: String }, { _id: false });

const poojaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String },
    fullDescription: { type: String },
    featuredImage: { type: String },
    heroBanner: { type: String },
    gallery: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "PoojaCategory" },
    tags: { type: [String], default: [] },
    duration: { type: String },
    startingPrice: { type: Number, required: true, min: 0 },
    marketPrice: { type: Number, min: 0 },
    benefits: { type: [String], default: [] },
    importance: { type: String },
    whoShouldPerform: { type: String },
    vidhiSteps: { type: [vidhiStepSchema], default: [] },
    // Optional, user-selectable samagri add-ons — NOT bundled into the price
    // by default; `includedByDefault` only marks packages/customer defaults,
    // the customer explicitly opts in per item on the booking flow.
    samagri: { type: [samagriItemSchema], default: [] },
    packages: { type: [packageSchema], default: [] },
    faq: { type: [faqSchema], default: [] },
    relatedPoojas: { type: [Schema.Types.ObjectId], ref: "Pooja", default: [] },
    relatedBlogSlugs: { type: [String], default: [] },
    relatedProductSlugs: { type: [String], default: [] },
    citiesAvailable: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    popular: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "Published", "archived"], default: "draft" },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String },
      description: { type: String },
      canonical: { type: String },
      ogImage: { type: String },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

poojaSchema.index({ status: 1, featured: 1 });
poojaSchema.index({ category: 1 });

export type PoojaDocument = InferSchemaType<typeof poojaSchema>;
export const PoojaModel = model("Pooja", poojaSchema);
