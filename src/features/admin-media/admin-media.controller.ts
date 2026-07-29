import type { Request, Response } from "express";
import { ApiError } from "../../lib/api-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { deleteMedia, listMedia, saveUploadedMedia } from "./admin-media.service.js";

export const getMedia = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 24;
  sendSuccess(res, await listMedia(page, limit));
});

export const postMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const media = await saveUploadedMedia(req.file, req.admin!.id);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Media",
    entityId: media._id.toString(),
    description: `Uploaded media "${media.originalName}"`,
  });
  sendSuccess(res, media, "File uploaded", 201);
});

export const removeMedia = asyncHandler(async (req: Request, res: Response) => {
  await deleteMedia(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Media",
    entityId: req.params.id,
    description: "Deleted media file",
  });
  sendSuccess(res, null, "Media deleted");
});
