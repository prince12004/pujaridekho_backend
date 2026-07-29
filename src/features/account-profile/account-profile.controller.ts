import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getMyProfile, updateMyProfile } from "./account-profile.service.js";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getMyProfile(req.customer!.id));
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  dob: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  preferredLanguage: z.string().optional(),
  city: z.string().optional(),
  photo: z.string().optional(),
});

export const patchProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = updateSchema.parse(req.body);
  sendSuccess(res, await updateMyProfile(req.customer!.id, input), "Profile updated");
});
