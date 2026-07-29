import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  createSeoSetting,
  deleteSeoSetting,
  getSeoSettingById,
  listSeoSettings,
  updateSeoSetting,
} from "./admin-seo.service.js";

const seoSchema = z.object({
  pagePath: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
});

export const getSeoSettings = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listSeoSettings());
});

export const getSeoSetting = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getSeoSettingById(req.params.id));
});

export const postSeoSetting = asyncHandler(async (req: Request, res: Response) => {
  const input = seoSchema.parse(req.body);
  const setting = await createSeoSetting(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "SeoSetting",
    entityId: setting._id.toString(),
    description: `Created SEO entry for "${setting.pagePath}"`,
  });
  sendSuccess(res, setting, "SEO entry created", 201);
});

export const patchSeoSetting = asyncHandler(async (req: Request, res: Response) => {
  const input = seoSchema.partial().parse(req.body);
  const setting = await updateSeoSetting(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "SeoSetting",
    entityId: setting._id.toString(),
    description: `Updated SEO entry for "${setting.pagePath}"`,
  });
  sendSuccess(res, setting, "SEO entry updated");
});

export const removeSeoSetting = asyncHandler(async (req: Request, res: Response) => {
  await deleteSeoSetting(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "SeoSetting",
    entityId: req.params.id,
    description: "Deleted SEO entry",
  });
  sendSuccess(res, null, "SEO entry deleted");
});
