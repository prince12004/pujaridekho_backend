import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { loginCrmUser } from "./crm-auth.service.js";

const loginSchema = z.object({
  identifier: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string(),
});

export const postCrmLogin = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const identifier = body.identifier ?? body.username ?? "";
  const result = await loginCrmUser(identifier, body.password);
  // Flat shape (not wrapped under `data.result`) to match the original CRM
  // API's response body, which the Flutter app's auth layer expects as-is.
  sendSuccess(res, result, "Login successful");
});
