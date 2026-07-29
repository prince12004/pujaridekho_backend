import { Router } from "express";
import { getPublicCities } from "./cities.controller.js";

export const citiesRouter = Router();

citiesRouter.get("/", getPublicCities);
