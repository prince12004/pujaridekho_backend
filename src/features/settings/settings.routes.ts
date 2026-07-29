import { Router } from "express";
import { getPublicSettings } from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/", getPublicSettings);
