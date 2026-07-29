import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { upload } from "../../lib/upload.js";
import { getMedia, postMedia, removeMedia } from "./admin-media.controller.js";

export const adminMediaRouter = Router();

adminMediaRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.MEDIA_MANAGE));

adminMediaRouter.get("/", getMedia);
adminMediaRouter.post("/", upload.single("file"), postMedia);
adminMediaRouter.delete("/:id", removeMedia);
