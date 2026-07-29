import { Router } from "express";
import { getPublicSeoByPath } from "./seo.controller.js";

export const seoRouter = Router();

seoRouter.get("/by-path", getPublicSeoByPath);
