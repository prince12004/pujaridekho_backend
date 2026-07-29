import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getPublicPoojaBySlug, listPublicPoojas } from "./poojas.service.js";

const listQuerySchema = z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    featured: z.coerce.boolean().optional(),
});

export const getPublicPoojas = asyncHandler(async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const result = await listPublicPoojas(query);
    sendSuccess(res, result);
});

export const getPublicPooja = asyncHandler(async (req: Request, res: Response) => {
    const pooja = await getPublicPoojaBySlug(req.params.slug);
    sendSuccess(res, pooja);
});
