import { Schema, model, type InferSchemaType } from "mongoose";
export const CUSTOMER_ARRANGE_WHITELIST = [
  "Fruits",
  "Mithai",
  "Fresh Flowers",
  "Flower Mala",
  "Paan",
  "Milk",
  "Curd",
  "Honey",
  "Ghee",
  "Coconut",
  "Panchamrit Ingredients",
] as const;

const includedItemSchema = new Schema(
  {
    itemName: { type: String, required: true },
    quantity: { type: String },
    unit: { type: String },
    estimatedPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    category: { type: String },
    arrangedBy: { type: String, default: "PujariDekho" },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const samagriTemplateSchema = new Schema(
  {
    samagriTemplateName: { type: String, required: true },
    pooja: { type: Schema.Types.ObjectId, ref: "Pooja", required: true, unique: true },
    includedItems: { type: [includedItemSchema], default: [] },
    customerArrangeItems: { type: [String], default: [] },
    estimatedSamagriCost: { type: Number, default: 0, min: 0 },
    estimatedSamagriMrp: { type: Number, min: 0 },
  },
  { timestamps: true },
);

export type SamagriTemplateDocument = InferSchemaType<typeof samagriTemplateSchema>;
export const SamagriTemplateModel = model("SamagriTemplate", samagriTemplateSchema);
