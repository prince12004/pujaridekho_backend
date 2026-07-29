import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { getOrCreateSettings } from "../settings/settings.service.js";

const socialLinksSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  twitter: z.string().optional(),
});

const settingsSchema = z.object({
  siteName: z.string().optional(),
  tagline: z.string().optional(),
  contactPhone: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  contactEmail: z.string().optional(),
  officeAddress: z.string().optional(),
  officeHours: z.string().optional(),
  socialLinks: socialLinksSchema.optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
});

export const getAdminSettings = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getOrCreateSettings());
});

export const patchAdminSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = settingsSchema.parse(req.body);
  const settings = await getOrCreateSettings();
  Object.assign(settings, input);
  await settings.save();
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Settings",
    entityId: settings._id.toString(),
    description: "Updated website settings",
  });
  sendSuccess(res, settings, "Settings updated");
});
