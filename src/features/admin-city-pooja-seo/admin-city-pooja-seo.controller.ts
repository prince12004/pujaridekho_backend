import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  createCityPoojaSeo,
  deleteCityPoojaSeo,
  getCityPoojaSeoById,
  listCityPoojaSeo,
  updateCityPoojaSeo,
} from "./admin-city-pooja-seo.service.js";

const createSchema = z.object({
  city: z.string().min(1),
  pooja: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export const getCityPoojaSeoList = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listCityPoojaSeo());
});

export const getCityPoojaSeoOne = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getCityPoojaSeoById(req.params.id));
});

export const postCityPoojaSeo = asyncHandler(async (req: Request, res: Response) => {
  const input = createSchema.parse(req.body);
  const entry = await createCityPoojaSeo(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "CityPoojaSeo",
    entityId: entry._id.toString(),
    description: `Created city x pooja SEO entry "${entry.slug}"`,
  });
  sendSuccess(res, entry, "SEO entry created", 201);
});

export const patchCityPoojaSeo = asyncHandler(async (req: Request, res: Response) => {
  const input = updateSchema.parse(req.body);
  const entry = await updateCityPoojaSeo(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "CityPoojaSeo",
    entityId: entry._id.toString(),
    description: `Updated city x pooja SEO entry "${entry.slug}"`,
  });
  sendSuccess(res, entry, "SEO entry updated");
});

export const removeCityPoojaSeo = asyncHandler(async (req: Request, res: Response) => {
  await deleteCityPoojaSeo(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "CityPoojaSeo",
    entityId: req.params.id,
    description: "Deleted city x pooja SEO entry",
  });
  sendSuccess(res, null, "SEO entry deleted");
});
