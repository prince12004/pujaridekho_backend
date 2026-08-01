import { Schema, model, type InferSchemaType } from "mongoose";

// Common items a customer must always arrange themselves and that are never
// bundled into a Pujari Dekho kit (fresh/perishable/ritual-personal items).
// Shown as quick-select suggestions in the admin form — customerArrangeItems
// itself accepts any custom string, it isn't restricted to this list.
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
    // Actual MRP for this item — optional; falls back to estimatedPrice
    // (i.e. no discount) wherever a total is computed if left unset.
    mrp: { type: Number, min: 0 },
    category: { type: String },
    arrangedBy: { type: String, default: "PujariDekho" },
    // Controls storefront behaviour: true = always-included display item,
    // false = customer-toggleable add-on priced into the booking total.
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
    // Pujari Dekho's actual offer price for the kit — auto-summed from
    // includedItems[].estimatedPrice unless manually overridden.
    estimatedSamagriCost: { type: Number, default: 0, min: 0 },
    // Strikethrough "MRP" for the whole kit, shown to customers next to the
    // real (estimatedSamagriCost) price — auto-summed from
    // includedItems[].mrp (falling back to estimatedPrice per item) unless
    // manually overridden.
    estimatedSamagriMrp: { type: Number, min: 0 },
  },
  { timestamps: true },
);

export type SamagriTemplateDocument = InferSchemaType<typeof samagriTemplateSchema>;
export const SamagriTemplateModel = model("SamagriTemplate", samagriTemplateSchema);
