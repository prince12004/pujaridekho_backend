import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createPooja, deletePooja, getPoojaById, listPoojas, updatePooja } from "./admin-poojas.service.js";

const samagriItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  includedByDefault: z.boolean().optional(),
});

const packageSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  duration: z.string().optional(),
  panditCount: z.number().optional(),
  samagriIncluded: z.boolean().optional(),
  dakshinaIncluded: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  description: z.string().optional(),
  recommended: z.boolean().optional(),
});

const vidhiStepSchema = z.object({ title: z.string().optional(), description: z.string().optional() });
const faqSchema = z.object({ question: z.string().optional(), answer: z.string().optional() });

const poojaSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  featuredImage: z.string().optional(),
  heroBanner: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  duration: z.string().optional(),
  startingPrice: z.number().min(0),
  marketPrice: z.number().min(0).optional(),
  benefits: z.array(z.string()).optional(),
  importance: z.string().optional(),
  whoShouldPerform: z.string().optional(),
  vidhiSteps: z.array(vidhiStepSchema).optional(),
  samagri: z.array(samagriItemSchema).optional(),
  packages: z.array(packageSchema).optional(),
  faq: z.array(faqSchema).optional(),
  relatedPoojas: z.array(z.string()).optional(),
  relatedBlogSlugs: z.array(z.string()).optional(),
  relatedProductSlugs: z.array(z.string()).optional(),
  citiesAvailable: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  popular: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  sortOrder: z.number().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
});

export const getPoojas = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await listPoojas(query);
  sendSuccess(res, result);
});

export const getPooja = asyncHandler(async (req: Request, res: Response) => {
  const pooja = await getPoojaById(req.params.id);
  sendSuccess(res, pooja);
});

export const postPooja = asyncHandler(async (req: Request, res: Response) => {
  const input = poojaSchema.parse(req.body);
  const pooja = await createPooja(input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Pooja",
    entityId: pooja._id.toString(),
    description: `Created pooja "${pooja.name}"`,
    after: pooja,
  });
  sendSuccess(res, pooja, "Pooja created", 201);
});

export const patchPooja = asyncHandler(async (req: Request, res: Response) => {
  const input = poojaSchema.partial().parse(req.body);
  const before = await getPoojaById(req.params.id);
  const beforeSnapshot = before.toObject();
  const pooja = await updatePooja(req.params.id, input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Pooja",
    entityId: pooja._id.toString(),
    description: `Updated pooja "${pooja.name}"`,
    before: beforeSnapshot,
    after: pooja,
  });
  sendSuccess(res, pooja, "Pooja updated");
});

export const removePooja = asyncHandler(async (req: Request, res: Response) => {
  const pooja = await getPoojaById(req.params.id);
  await deletePooja(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Pooja",
    entityId: req.params.id,
    description: `Deleted pooja "${pooja.name}"`,
    before: pooja,
  });
  sendSuccess(res, null, "Pooja deleted");
});
