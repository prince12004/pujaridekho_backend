import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { listPushCampaigns, searchCustomers, sendPushCampaign } from "./admin-push.service.js";

export const adminPushRouter = Router();
adminPushRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.NOTIFICATIONS_SEND));

const sendSchema = z
  .object({
    audience: z.object({
      type: z.enum(["all", "city", "customer"]),
      city: z.string().trim().optional(),
      customerId: z.string().optional(),
    }),
    title: z.string().trim().min(1, "Title is required").max(60, "Title must be 60 characters or fewer"),
    message: z.string().trim().min(1, "Message is required").max(180, "Message must be 180 characters or fewer"),
    link: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || v.startsWith("/"), "Link must be a website path like /poojas/satyanarayan-katha"),
    imageUrl: z.union([z.literal(""), z.string().trim().url("Enter a valid image URL")]).optional(),
    saveInApp: z.boolean().default(true),
  })
  .refine((v) => v.audience.type !== "city" || !!v.audience.city, { message: "Choose a city", path: ["audience", "city"] })
  .refine((v) => v.audience.type !== "customer" || !!v.audience.customerId, { message: "Choose a customer", path: ["audience", "customerId"] });

adminPushRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const input = sendSchema.parse(req.body);
    const campaign = await sendPushCampaign(
      { ...input, link: input.link || undefined, imageUrl: input.imageUrl || undefined },
      { id: req.admin!.id, name: req.admin!.name },
    );
    await recordAuditLog(req, req.admin!, {
      action: "create",
      entityType: "PushCampaign",
      entityId: campaign._id.toString(),
      description: `Sent push "${campaign.title}" to ${campaign.audience?.label} (${campaign.sentCount} sent, ${campaign.failedCount} failed)`,
    });
    sendSuccess(res, campaign, campaign.pushConfigured ? "Notification sent" : "Saved in-app — push is not configured yet", 201);
  }),
);

adminPushRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    sendSuccess(res, await listPushCampaigns(page, limit));
  }),
);

adminPushRouter.get(
  "/customers",
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await searchCustomers(String(req.query.q ?? "")));
  }),
);
