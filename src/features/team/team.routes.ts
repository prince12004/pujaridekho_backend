import { Router, type Request, type Response } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { ApiError } from "../../lib/api-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { recordAuditLog } from "../../lib/audit.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { TeamMemberModel } from "../../models/team-member.model.js";

// ---------------------------------------------------------------- Public
export const teamRouter = Router();
teamRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const members = await TeamMemberModel.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("name designation bio profile group photo photoPosition featured")
      .lean();
    sendSuccess(res, members);
  }),
);

// ---------------------------------------------------------------- Admin
export const adminTeamRouter = Router();
adminTeamRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.CMS_MANAGE));

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  designation: z.string().trim().min(1, "Designation is required").max(80),
  bio: z.string().trim().max(240, "Keep the bio under 240 characters").default(""),
  group: z.enum(["leadership", "advisor"]).default("leadership"),
  profile: z.string().trim().max(4000, "Keep the profile under 4000 characters").default(""),
  photo: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => !v || /^(https?:\/\/|\/)/.test(v), "Photo must be an uploaded image URL")
    .default(""),
  photoPosition: z.enum(["top", "center", "bottom"]).default("top"),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

adminTeamRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await TeamMemberModel.find().sort({ sortOrder: 1, createdAt: 1 }).lean());
  }),
);

adminTeamRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const input = memberSchema.parse(req.body);
    const last = await TeamMemberModel.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
    const member = await TeamMemberModel.create({ ...input, sortOrder: (last?.sortOrder ?? -1) + 1 });
    await recordAuditLog(req, req.admin!, { action: "create", entityType: "TeamMember", entityId: member._id.toString(), description: `Added team member ${member.name}` });
    sendSuccess(res, member, "Team member added", 201);
  }),
);

// Set the display order: body { ids: [...] } in the new order.
adminTeamRouter.put(
  "/order",
  asyncHandler(async (req: Request, res: Response) => {
    const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);
    if (ids.some((id) => !isValidObjectId(id))) throw ApiError.badRequest("Invalid member id");
    await Promise.all(ids.map((id, i) => TeamMemberModel.updateOne({ _id: id }, { $set: { sortOrder: i } })));
    await recordAuditLog(req, req.admin!, { action: "update", entityType: "TeamMember", entityId: "order", description: "Reordered team members" });
    sendSuccess(res, await TeamMemberModel.find().sort({ sortOrder: 1, createdAt: 1 }).lean(), "Order saved");
  }),
);

adminTeamRouter.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) throw ApiError.badRequest("Invalid member id");
    const input = memberSchema.partial().parse(req.body);
    const member = await TeamMemberModel.findByIdAndUpdate(req.params.id, { $set: input }, { new: true });
    if (!member) throw ApiError.notFound("Team member not found");
    await recordAuditLog(req, req.admin!, { action: "update", entityType: "TeamMember", entityId: member._id.toString(), description: `Updated team member ${member.name}` });
    sendSuccess(res, member, "Team member saved");
  }),
);

adminTeamRouter.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) throw ApiError.badRequest("Invalid member id");
    const member = await TeamMemberModel.findByIdAndDelete(req.params.id);
    if (!member) throw ApiError.notFound("Team member not found");
    await recordAuditLog(req, req.admin!, { action: "delete", entityType: "TeamMember", entityId: req.params.id, description: `Removed team member ${member.name}` });
    sendSuccess(res, null, "Team member removed");
  }),
);
