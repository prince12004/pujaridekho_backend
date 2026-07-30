import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { createPage, deletePage, getPageById, listPages, updatePage } from "./admin-pages.service.js";

const pageSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  title: z.string().min(1),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["draft", "Published"]).optional(),
});

export const getPages = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await listPages());
});

export const getPage = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await getPageById(req.params.id));
});

export const postPage = asyncHandler(async (req: Request, res: Response) => {
  const input = pageSchema.parse(req.body);
  const page = await createPage(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Page",
    entityId: page._id.toString(),
    description: `Created page "${page.title}"`,
  });
  sendSuccess(res, page, "Page created", 201);
});

export const patchPage = asyncHandler(async (req: Request, res: Response) => {
  const input = pageSchema.partial().parse(req.body);
  const page = await updatePage(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Page",
    entityId: page._id.toString(),
    description: `Updated page "${page.title}"`,
  });
  sendSuccess(res, page, "Page updated");
});

export const removePage = asyncHandler(async (req: Request, res: Response) => {
  await deletePage(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Page",
    entityId: req.params.id,
    description: "Deleted page",
  });
  sendSuccess(res, null, "Page deleted");
});
