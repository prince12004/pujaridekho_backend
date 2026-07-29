import { Router } from "express";
import { getPublicPage } from "./pages.controller.js";

export const pagesRouter = Router();

pagesRouter.get("/:slug", getPublicPage);
