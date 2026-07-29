import { Router } from "express";
import { getKundliCities, postKundli } from "./kundli.controller.js";

export const kundliRouter = Router();

kundliRouter.get("/cities", getKundliCities);
kundliRouter.post("/", postKundli);
