import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { PANDIT_VERIFICATION_STATUSES } from "../../models/pandit.model.js";
import {
  convertApplicationToPandit,
  createPandit,
  deletePandit,
  getPanditApplicationById,
  getPanditById,
  listPandits,
  listPanditApplications,
  updatePandit,
  updatePanditApplication,
} from "./admin-pandits.service.js";

const bankDetailsSchema = z.object({
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
});

const panditSchema = z.object({
  photo: z.string().optional(),
  fullName: z.string().min(1),
  mobile: z.string().min(1),
  alternateMobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  dob: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  experienceYears: z.number().min(0).optional(),
  bio: z.string().optional(),
  languages: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  address: z.string().optional(),
  idProofUrl: z.string().optional(),
  certificates: z.array(z.string()).optional(),
  bankDetails: bankDetailsSchema.optional(),
  upiId: z.string().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  availabilityNotes: z.string().optional(),
  verificationStatus: z.enum(PANDIT_VERIFICATION_STATUSES).optional(),
  accountStatus: z.enum(["active", "inactive"]).optional(),
  featured: z.boolean().optional(),
  adminNotes: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  completedPoojas: z.number().min(0).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  city: z.string().optional(),
  verificationStatus: z.string().optional(),
});

export const getPandits = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await listPandits(query);
  sendSuccess(res, result);
});

export const getPandit = asyncHandler(async (req: Request, res: Response) => {
  const pandit = await getPanditById(req.params.id);
  sendSuccess(res, pandit);
});

export const postPandit = asyncHandler(async (req: Request, res: Response) => {
  const input = panditSchema.parse(req.body);
  const pandit = await createPandit(input);
  await recordAuditLog(req, req.admin!, {
    action: "create",
    entityType: "Pandit",
    entityId: pandit._id.toString(),
    description: `Created pandit "${pandit.fullName}"`,
    after: pandit,
  });
  sendSuccess(res, pandit, "Pandit created", 201);
});

export const patchPandit = asyncHandler(async (req: Request, res: Response) => {
  const input = panditSchema.partial().parse(req.body);
  const before = await getPanditById(req.params.id);
  const beforeSnapshot = before.toObject();
  const pandit = await updatePandit(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "Pandit",
    entityId: pandit._id.toString(),
    description: `Updated pandit "${pandit.fullName}"`,
    before: beforeSnapshot,
    after: pandit,
  });
  sendSuccess(res, pandit, "Pandit updated");
});

export const removePandit = asyncHandler(async (req: Request, res: Response) => {
  const pandit = await getPanditById(req.params.id);
  await deletePandit(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "delete",
    entityType: "Pandit",
    entityId: req.params.id,
    description: `Deleted pandit "${pandit.fullName}"`,
    before: pandit,
  });
  sendSuccess(res, null, "Pandit deleted");
});

export const getApplications = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const applications = await listPanditApplications(status);
  sendSuccess(res, applications);
});

export const getApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await getPanditApplicationById(req.params.id);
  sendSuccess(res, application);
});

const applicationUpdateSchema = z.object({
  status: z.enum(["pending", "under_review", "more_info_requested", "approved", "rejected"]).optional(),
  adminNotes: z.string().optional(),
});

export const patchApplication = asyncHandler(async (req: Request, res: Response) => {
  const input = applicationUpdateSchema.parse(req.body);
  const application = await updatePanditApplication(req.params.id, input);
  await recordAuditLog(req, req.admin!, {
    action: "update",
    entityType: "PanditApplication",
    entityId: application._id.toString(),
    description: `Updated pandit application for "${application.fullName}" to status ${application.status}`,
    after: application,
  });
  sendSuccess(res, application, "Application updated");
});

export const postConvertApplication = asyncHandler(async (req: Request, res: Response) => {
  const result = await convertApplicationToPandit(req.params.id);
  await recordAuditLog(req, req.admin!, {
    action: "convert",
    entityType: "PanditApplication",
    entityId: req.params.id,
    description: `Converted pandit application for "${result.application.fullName}" into a Pandit profile`,
    after: result.pandit,
  });
  sendSuccess(res, result, "Application converted to pandit profile", 201);
});
