import { Router } from "express";
import { blockSuperadminMutations, requireCrmAuth } from "../../middlewares/crm-auth.js";
import { getActivityLogs, postActivityLog, postBulkActivityLogs } from "./crm-activity-log.controller.js";

export const crmActivityLogRouter = Router();

crmActivityLogRouter.use(requireCrmAuth, blockSuperadminMutations);

crmActivityLogRouter.get("/", getActivityLogs);
crmActivityLogRouter.post("/bulk", postBulkActivityLogs);
crmActivityLogRouter.post("/", postActivityLog);
