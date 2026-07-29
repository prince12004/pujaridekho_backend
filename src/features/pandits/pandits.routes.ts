import { Router } from "express";
import { getPublicPandits, getPublicPandit } from "./pandits.controller.js";

export const panditsRouter = Router();

panditsRouter.get("/", getPublicPandits);
panditsRouter.get("/:id", getPublicPandit);
