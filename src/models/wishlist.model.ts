import { Schema, model, type InferSchemaType } from "mongoose";

export const WISHLIST_ITEM_TYPES = ["pooja", "product", "festival"] as const;

const wishlistItemSchema = new Schema(
  {
    itemType: { type: String, enum: WISHLIST_ITEM_TYPES, required: true },
    itemId: { type: Schema.Types.ObjectId, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const wishlistSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true, unique: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true },
);

export type WishlistDocument = InferSchemaType<typeof wishlistSchema>;
export const WishlistModel = model("Wishlist", wishlistSchema);
