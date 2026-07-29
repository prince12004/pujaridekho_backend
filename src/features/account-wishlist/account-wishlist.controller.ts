import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { addToWishlist, listMyWishlist, removeFromWishlist } from "./account-wishlist.service.js";

export const getMyWishlist = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listMyWishlist(req.customer!.id));
});

const addSchema = z.object({ itemType: z.enum(["pooja", "product", "festival"]), itemId: z.string().min(1) });

export const postWishlistItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemType, itemId } = addSchema.parse(req.body);
  const wishlist = await addToWishlist(req.customer!.id, itemType, itemId);
  sendSuccess(res, wishlist, "Added to wishlist", 201);
});

export const deleteWishlistItem = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await removeFromWishlist(req.customer!.id, req.params.itemType, req.params.itemId);
  sendSuccess(res, wishlist, "Removed from wishlist");
});
