import { Router } from "express";
import { blockSuperadminMutations, requireCrmAuth } from "../../middlewares/crm-auth.js";
import { getActivityLogs, postActivityLog, postBulkActivityLogs } from "./crm-activity-log.controller.js";

export const crmActivityLogRouter = Router();

crmActivityLogRouter.use(requireCrmAuth, blockSuperadminMutations);

crmActivityLogRouter.get("/", getActivityLogs);
// POST .../bulk is a read (see READ_ONLY_POST_URL_SUFFIXES in crm-auth.ts) —
// exempted from the superadmin mutation block there.
crmActivityLogRouter.post("/bulk", postBulkActivityLogs);
crmActivityLogRouter.post("/", postActivityLog);
