import { Router } from "express";
import { getPanchang } from "./panchang.controller.js";

export const panchangRouter = Router();

panchangRouter.get("/", getPanchang);
