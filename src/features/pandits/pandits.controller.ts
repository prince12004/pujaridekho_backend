import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { getPublicPanditById, listPublicPandits } from "./pandits.service.js";

const listQuerySchema = z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    search: z.string().optional(),
    city: z.string().optional(),
    sort: z.enum(["rating", "newest"]).optional(),
});

export const getPublicPandits = asyncHandler(async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const result = await listPublicPandits(query);
    sendSuccess(res, result);
});

export const getPublicPandit = asyncHandler(async (req: Request, res: Response) => {
    const pandit = await getPublicPanditById(req.params.id);
    sendSuccess(res, pandit);
});
