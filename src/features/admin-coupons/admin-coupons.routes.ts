import { Router } from "express";
import { requireAdminAuth, requirePermission } from "../../middlewares/admin-auth.js";
import { PERMISSIONS } from "../../lib/permissions.js";
import { getCoupons, postCoupon, patchCoupon, removeCoupon } from "./admin-coupons.controller.js";

export const adminCouponsRouter = Router();

adminCouponsRouter.use(requireAdminAuth, requirePermission(PERMISSIONS.COUPONS_MANAGE));

adminCouponsRouter.get("/", getCoupons);
adminCouponsRouter.post("/", postCoupon);
adminCouponsRouter.patch("/:id", patchCoupon);
adminCouponsRouter.delete("/:id", removeCoupon);
