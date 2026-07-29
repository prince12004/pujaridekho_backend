import { Router } from "express";
import { getPublicMuhurats } from "./muhurats.controller.js";

export const muhuratsRouter = Router();

muhuratsRouter.get("/", getPublicMuhurats);
