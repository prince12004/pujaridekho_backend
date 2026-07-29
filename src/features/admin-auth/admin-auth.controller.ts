import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { loginAdmin } from "./admin-auth.service.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const postAdminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginAdmin(email, password);
  sendSuccess(res, result, "Login successful");
});

export const getAdminMe = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { admin: req.admin });
});
