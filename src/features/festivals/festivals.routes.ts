import { Router } from "express";
import { getPublicFestivals, getPublicFestival } from "./festivals.controller.js";

export const festivalsRouter = Router();

festivalsRouter.get("/", getPublicFestivals);
festivalsRouter.get("/:slug", getPublicFestival);
