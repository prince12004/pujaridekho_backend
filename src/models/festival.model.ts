import { Schema, model, type InferSchemaType } from "mongoose";

const samagriItemSchema = new Schema(
  { name: { type: String, required: true }, description: { type: String }, price: { type: Number, required: true, min: 0 }, includedByDefault: { type: Boolean, default: false } },
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

const festivalSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    festivalDate: { type: Date },
    dateLabel: { type: String },
    shortDescription: { type: String },
    fullDescription: { type: String },
    featuredImage: { type: String },
    heroBanner: { type: String },
    gallery: { type: [String], default: [] },
    startingPrice: { type: Number, required: true, min: 0 },
    marketPrice: { type: Number, min: 0 },
    benefits: { type: [String], default: [] },
    importance: { type: String },
    vidhiSteps: { type: [vidhiStepSchema], default: [] },
    samagri: { type: [samagriItemSchema], default: [] },
    packages: { type: [packageSchema], default: [] },
    faq: { type: [faqSchema], default: [] },
    citiesAvailable: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "Published", "archived"], default: "draft" },
    sortOrder: { type: Number, default: 0 },
    seo: { title: { type: String }, description: { type: String } },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

festivalSchema.index({ status: 1, featured: 1 });
festivalSchema.index({ festivalDate: 1 });

export type FestivalDocument = InferSchemaType<typeof festivalSchema>;
export const FestivalModel = model("Festival", festivalSchema);
