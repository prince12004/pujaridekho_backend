import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { getOrCreateSettings } from "../settings/settings.service.js";
import { clearSiteStatsCache } from "../stats/stats.service.js";

const socialLinksSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  twitter: z.string().optional(),
});

const SEMVER = /^\d+\.\d+\.\d+$/;

export function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

const appPlatformSchema = z
  .object({
    minVersion: z.string().trim().regex(SEMVER, "Version must look like 1.2.3"),
    latestVersion: z.string().trim().regex(SEMVER, "Version must look like 1.2.3"),
    storeUrl: z.union([z.literal(""), z.string().trim().url("Enter a valid store link")]),
  })
  .refine((v) => compareVersions(v.latestVersion, v.minVersion) >= 0, {
    message: "Latest version must be the same as or higher than the minimum version",
    path: ["latestVersion"],
  });

const appSettingsSchema = z.object({
  android: appPlatformSchema,
  ios: appPlatformSchema,
  updateMessage: z.string().trim().max(300).optional().default(""),
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
  app: appSettingsSchema.optional(),
  statsOffsets: z
    .object({
      verifiedPandits: z.number().int().min(0).max(100000),
      poojas: z.number().int().min(0).max(10000000),
      families: z.number().int().min(0).max(10000000),
    })
    .optional(),
});

export const getAdminSettings = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getOrCreateSettings());
});

export const patchAdminSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = settingsSchema.parse(req.body);
  const settings = await getOrCreateSettings();
  Object.assign(settings, input);
  await settings.save();
  clearSiteStatsCache();
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Settings",
    entityId: settings._id.toString(),
    description: "Updated website settings",
  });
  sendSuccess(res, settings, "Settings updated");
});
