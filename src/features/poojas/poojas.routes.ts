import { Router } from "express";
import { getPublicPoojas, getPublicPooja } from "./poojas.controller.js";

export const poojasRouter = Router();

poojasRouter.get("/", getPublicPoojas);
poojasRouter.get("/:slug", getPublicPooja);
