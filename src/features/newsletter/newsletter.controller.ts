import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { subscribeToNewsletter } from "./newsletter.service.js";

const subscribeSchema = z.object({ email: z.string().email() });

export const postSubscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email } = subscribeSchema.parse(req.body);
  await subscribeToNewsletter(email);
  sendSuccess(res, null, "Subscribed successfully", 201);
});
