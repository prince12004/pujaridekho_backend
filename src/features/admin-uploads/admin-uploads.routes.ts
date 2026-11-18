import { Router, type NextFunction, type Request, type Response } from "express";
import { requireAdminAuth } from "../../middlewares/admin-auth.js";
import { ApiError } from "../../lib/api-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { audioUpload } from "../../lib/upload.js";
import { saveAudio } from "../../lib/cloud-storage.js";
import { PERMISSIONS, WILDCARD_PERMISSION } from "../../lib/permissions.js";

export const adminUploadsRouter = Router();
adminUploadsRouter.use(requireAdminAuth);

// Pooja or festival editors may upload audio.
function canEditAudio(req: Request, _res: Response, next: NextFunction) {
  const perms = req.admin?.permissions ?? [];
  if (perms.includes(WILDCARD_PERMISSION) || perms.includes(PERMISSIONS.POOJAS_MANAGE) || perms.includes(PERMISSIONS.FESTIVALS_MANAGE)) {
    return next();
  }
  next(ApiError.forbidden("You don't have permission to upload audio"));
}

// Multer errors (wrong type / too big) come back as a clean 400.
function handleAudio(req: Request, res: Response, next: NextFunction) {
  audioUpload.single("file")(req, res, (err: unknown) => {
    if (!err) return next();
    const e = err as { code?: string; message?: string };
    next(ApiError.badRequest(e.code === "LIMIT_FILE_SIZE" ? "Audio must be 10 MB or smaller" : (e.message ?? "Upload failed")));
  });
}

adminUploadsRouter.post(
  "/audio",
  canEditAudio,
  handleAudio,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("Choose an MP3 or M4A file");
    const saved = await saveAudio(req.file.buffer, req.file.originalname, req.file.mimetype);
    sendSuccess(res, { url: saved.url, durationSec: saved.durationSec }, "Audio uploaded", 201);
  }),
);
