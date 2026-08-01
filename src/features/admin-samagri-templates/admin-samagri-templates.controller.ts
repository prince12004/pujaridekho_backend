import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import {
  createSamagriTemplate,
  deleteSamagriTemplate,
  getSamagriTemplateById,
  listSamagriTemplates,
  updateSamagriTemplate,
} from "./admin-samagri-templates.service.js";

const includedItemSchema = z.object({
  itemName: z.string().min(1),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  estimatedPrice: z.number().min(0),
  mrp: z.number().min(0).optional(),
  category: z.string().optional(),
  arrangedBy: z.string().optional(),
  required: z.boolean().optional(),
});

const samagriTemplateSchema = z.object({
  samagriTemplateName: z.string().min(1),
  pooja: z.string().min(1),
  includedItems: z.array(includedItemSchema).optional(),
  // Free-text — not restricted to CUSTOMER_ARRANGE_WHITELIST, which is only a
  // set of quick-select suggestions in the admin UI.
  customerArrangeItems: z.array(z.string().min(1)).optional(),
  // Optional manual override — when omitted, the server auto-sums includedItems instead.
  estimatedSamagriCost: z.number().min(0).optional(),
  // Optional strikethrough "MRP" for the whole kit, shown to customers.
  estimatedSamagriMrp: z.number().min(0).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
});

export const getSamagriTemplates = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  sendSuccess(res, await listSamagriTemplates(query));
});

export const getSamagriTemplate = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getSamagriTemplateById(req.params.id));
});

export const postSamagriTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = samagriTemplateSchema.parse(req.body);
  const template = await createSamagriTemplate(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "SamagriTemplate",
    entityId: template._id.toString(),
    description: `Created samagri template "${template.samagriTemplateName}"`,
  });
  sendSuccess(res, template, "Samagri template created", 201);
});

export const patchSamagriTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = samagriTemplateSchema.partial().parse(req.body);
  const template = await updateSamagriTemplate(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "SamagriTemplate",
    entityId: template._id.toString(),
    description: `Updated samagri template "${template.samagriTemplateName}"`,
  });
  sendSuccess(res, template, "Samagri template updated");
});

export const removeSamagriTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await getSamagriTemplateById(req.params.id);
  await deleteSamagriTemplate(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "SamagriTemplate",
    entityId: req.params.id,
    description: `Deleted samagri template "${template.samagriTemplateName}"`,
  });
  sendSuccess(res, null, "Samagri template deleted");
});
