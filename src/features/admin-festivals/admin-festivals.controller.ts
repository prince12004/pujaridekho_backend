import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createFestival, deleteFestival, getFestivalById, listFestivals, updateFestival } from "./admin-festivals.service.js";

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

const festivalSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  festivalDate: z.coerce.date().optional(),
  dateLabel: z.string().optional(),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  featuredImage: z.string().optional(),
  heroBanner: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  startingPrice: z.number().min(0),
  marketPrice: z.number().min(0).optional(),
  benefits: z.array(z.string()).optional(),
  importance: z.string().optional(),
  vidhiSteps: z.array(vidhiStepSchema).optional(),
  samagri: z.array(samagriItemSchema).optional(),
  packages: z.array(packageSchema).optional(),
  faq: z.array(faqSchema).optional(),
  citiesAvailable: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "Published", "archived"]).optional(),
  sortOrder: z.number().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const getFestivals = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  sendSuccess(res, await listFestivals(query));
});

export const getFestival = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getFestivalById(req.params.id));
});

export const postFestival = asyncHandler(async (req: Request, res: Response) => {
  const input = festivalSchema.parse(req.body);
  const festival = await createFestival(input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Festival",
    entityId: festival._id.toString(),
    description: `Created festival "${festival.name}"`,
  });
  sendSuccess(res, festival, "Festival created", 201);
});

export const patchFestival = asyncHandler(async (req: Request, res: Response) => {
  const input = festivalSchema.partial().parse(req.body);
  const festival = await updateFestival(req.params.id, input, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Festival",
    entityId: festival._id.toString(),
    description: `Updated festival "${festival.name}"`,
  });
  sendSuccess(res, festival, "Festival updated");
});

export const removeFestival = asyncHandler(async (req: Request, res: Response) => {
  const festival = await getFestivalById(req.params.id);
  await deleteFestival(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Festival",
    entityId: req.params.id,
    description: `Deleted festival "${festival.name}"`,
  });
  sendSuccess(res, null, "Festival deleted");
});
