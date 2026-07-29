import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { addMyTicketMessage, createMyTicket, getMyTicketById, listMyTickets } from "./account-support.service.js";

const createSchema = z.object({
  category: z.enum(["booking", "pandit", "payment", "refund", "order", "consultation", "account", "other"]),
  relatedType: z.enum(["booking", "order", "consultation"]).optional(),
  relatedId: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
  attachmentUrl: z.string().optional(),
});

export const postMyTicket = asyncHandler(async (req: Request, res: Response) => {
  const input = createSchema.parse(req.body);
  const ticket = await createMyTicket(req.customer!.id, input);
  sendSuccess(res, ticket, "Support ticket created", 201);
});

export const getMyTickets = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await listMyTickets(req.customer!.id));
});

export const getMyTicket = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getMyTicketById(req.customer!.id, req.params.id));
});

const messageSchema = z.object({ message: z.string().min(1), attachmentUrl: z.string().optional() });

export const postMyTicketMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message, attachmentUrl } = messageSchema.parse(req.body);
  const ticket = await addMyTicketMessage(req.customer!.id, req.params.id, message, attachmentUrl);
  sendSuccess(res, ticket, "Message sent");
});
