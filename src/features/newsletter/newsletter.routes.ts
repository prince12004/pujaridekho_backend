import { Router } from "express";
import { postSubscribe } from "./newsletter.controller.js";

export const newsletterRouter = Router();

newsletterRouter.post("/subscribe", postSubscribe);
