import { Router } from "express";
import { getPublicProducts, getPublicProduct, getPublicProductCategories } from "./products.controller.js";

export const productsRouter = Router();

productsRouter.get("/categories", getPublicProductCategories);
productsRouter.get("/", getPublicProducts);
productsRouter.get("/:slug", getPublicProduct);
