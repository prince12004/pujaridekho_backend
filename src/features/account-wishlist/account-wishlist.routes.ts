import { Router } from "express";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { deleteWishlistItem, getMyWishlist, postWishlistItem } from "./account-wishlist.controller.js";

export const accountWishlistRouter = Router();

accountWishlistRouter.use(requireCustomerAuth);
accountWishlistRouter.get("/", getMyWishlist);
accountWishlistRouter.post("/", postWishlistItem);
accountWishlistRouter.delete("/:itemType/:itemId", deleteWishlistItem);
