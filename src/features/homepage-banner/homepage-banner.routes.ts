import { Router } from "express";
import { getPublicHomepageBanner } from "./homepage-banner.controller.js";

export const homepageBannerRouter = Router();

homepageBannerRouter.get("/", getPublicHomepageBanner);
