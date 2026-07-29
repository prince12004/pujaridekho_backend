import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { generateAndSaveKundli, getMyKundliById, listMyKundlis } from "./account-kundli.service.js";

const generateSchema = z.object({
  personName: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be YYYY-MM-DD"),
  tob: z.string().regex(/^\d{2}:\d{2}$/, "tob must be HH:mm"),
  place: z.string().min(1),
});

export const postMyKundli = asyncHandler(async (req: Request, res: Response) => {
  const input = generateSchema.parse(req.body);
  const record = await generateAndSaveKundli(req.customer!.id, input);
  sendSuccess(res, record, "Kundli generated", 201);
});

export const getMyKundlis = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listMyKundlis(req.customer!.id));
});

export const getMyKundli = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getMyKundliById(req.customer!.id, req.params.id));
});
