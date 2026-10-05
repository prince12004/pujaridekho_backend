import { Router } from "express";
import { blockSuperadminMutations, requireCrmAdmin, requireCrmAuth } from "../../middlewares/crm-auth.js";
import {
  deleteInquiryById,
  getInquiriesList,
  getInquiryById,
  getInquiryPandits,
  getInquiryPanditAvailability,
  getStatsHandler,
  getWebsiteBookingsSync,
  postAssignPandit,
  postAssignPanditToEvent,
  postBulkSync,
  postInquiry,
  putInquiry,
} from "./crm-inquiries.controller.js";

export const crmInquiriesRouter = Router();

// All routes here require CRM auth (salesperson/admin/superadmin) — matches
// `app.use('/api', requireAuth)` in server.js (everything past the public
// auth/webhook routes). Pandit read endpoints are mounted here too, same as
// the original /api/pandits* routes, which also sat behind requireAuth.
crmInquiriesRouter.use(requireCrmAuth, blockSuperadminMutations);

crmInquiriesRouter.get("/pandits", getInquiryPandits);
crmInquiriesRouter.get("/pandits/availability", getInquiryPanditAvailability);

crmInquiriesRouter.get("/stats", getStatsHandler);
crmInquiriesRouter.get("/sync/website-bookings", requireCrmAdmin, getWebsiteBookingsSync);
crmInquiriesRouter.post("/sync", postBulkSync);

crmInquiriesRouter.get("/", getInquiriesList);
crmInquiriesRouter.post("/", postInquiry);
crmInquiriesRouter.get("/:id", getInquiryById);
crmInquiriesRouter.put("/:id", putInquiry);
crmInquiriesRouter.delete("/:id", requireCrmAdmin, deleteInquiryById);
crmInquiriesRouter.post("/:id/assign-pandit", postAssignPandit);
crmInquiriesRouter.post("/:id/events/:eventId/assign-pandit", postAssignPanditToEvent);
