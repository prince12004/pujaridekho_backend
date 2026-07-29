import type { Model } from "mongoose";
import { ApiError } from "../../lib/api-error.js";
import { WishlistModel } from "../../models/wishlist.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { ProductModel } from "../../models/product.model.js";
import { FestivalModel } from "../../models/festival.model.js";

async function getOrCreateWishlist(customerId: string) {
  let wishlist = await WishlistModel.findOne({ customer: customerId });
  if (!wishlist) wishlist = await WishlistModel.create({ customer: customerId, items: [] });
  return wishlist;
}

// Cast to a loosely-typed Model — the three underlying schemas differ, but
// every lookup here only touches fields common to all of them (name, slug,
// price, status), which none of the individual schema types express cleanly
// as a union.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL_BY_TYPE: Record<"pooja" | "product" | "festival", Model<any>> = {
  pooja: PoojaModel,
  product: ProductModel,
  festival: FestivalModel,
};

export async function listMyWishlist(customerId: string) {
  const wishlist = await getOrCreateWishlist(customerId);

  const enriched = await Promise.all(
    wishlist.items.map(async (item) => {
      const Model = MODEL_BY_TYPE[item.itemType as keyof typeof MODEL_BY_TYPE];
      const doc = await Model.findById(item.itemId).select("name slug featuredImage images startingPrice sellingPrice marketPrice status");
      return { itemType: item.itemType, itemId: item.itemId, addedAt: item.addedAt, item: doc };
    }),
  );

  return enriched.filter((entry) => entry.item !== null);
}

export async function addToWishlist(customerId: string, itemType: "pooja" | "product" | "festival", itemId: string) {
  const Model = MODEL_BY_TYPE[itemType];
  const exists = await Model.exists({ _id: itemId });
  if (!exists) throw ApiError.badRequest("That item could not be found");

  const wishlist = await getOrCreateWishlist(customerId);
  const alreadyAdded = wishlist.items.some((i) => i.itemType === itemType && i.itemId.toString() === itemId);
  if (!alreadyAdded) {
    wishlist.items.push({ itemType, itemId } as never);
    await wishlist.save();
  }
  return wishlist;
}

export async function removeFromWishlist(customerId: string, itemType: string, itemId: string) {
  const wishlist = await getOrCreateWishlist(customerId);
  wishlist.items = wishlist.items.filter((i) => !(i.itemType === itemType && i.itemId.toString() === itemId)) as never;
  await wishlist.save();
  return wishlist;
}
