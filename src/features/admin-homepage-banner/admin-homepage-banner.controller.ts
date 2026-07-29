import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { getOrCreateBanner } from "../homepage-banner/homepage-banner.service.js";

const bannerSchema = z.object({
  active: z.boolean().optional(),
  text: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

export const getAdminHomepageBanner = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await getOrCreateBanner());
});

export const patchAdminHomepageBanner = asyncHandler(async (req: Request, res: Response) => {
  const input = bannerSchema.parse(req.body);
  const banner = await getOrCreateBanner();
  Object.assign(banner, input);
  await banner.save();
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "HomepageBanner",
    entityId: banner._id.toString(),
    description: "Updated homepage announcement banner",
  });
  sendSuccess(res, banner, "Homepage banner updated");
});
