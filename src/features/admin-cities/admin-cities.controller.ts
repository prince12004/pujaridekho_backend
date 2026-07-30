import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createCity, deleteCity, listCities, updateCity } from "./admin-cities.service.js";

const citySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  state: z.string().optional(),
  image: z.string().optional(),
  isServiceable: z.boolean().optional(),
  sortOrder: z.number().optional(),
  status: z.enum(["draft", "Published"]).optional(),
});

export const getCities = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listCities());
});

export const postCity = asyncHandler(async (req: Request, res: Response) => {
  const input = citySchema.parse(req.body);
  const city = await createCity(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "City",
    entityId: city._id.toString(),
    description: `Created city "${city.name}"`,
  });
  sendSuccess(res, city, "City created", 201);
});

export const patchCity = asyncHandler(async (req: Request, res: Response) => {
  const input = citySchema.partial().parse(req.body);
  const city = await updateCity(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "City",
    entityId: city._id.toString(),
    description: `Updated city "${city.name}"`,
  });
  sendSuccess(res, city, "City updated");
});

export const removeCity = asyncHandler(async (req: Request, res: Response) => {
  await deleteCity(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "City",
    entityId: req.params.id,
    description: "Deleted city",
  });
  sendSuccess(res, null, "City deleted");
});
