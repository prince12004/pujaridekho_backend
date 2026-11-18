import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { requireCustomerAuth } from "../../middlewares/customer-auth.js";
import { DeviceModel } from "../../models/device.model.js";

// Push-notification devices for the logged-in customer (Flutter app).
export const accountDevicesRouter = Router();
accountDevicesRouter.use(requireCustomerAuth);

const deviceSchema = z.object({
  token: z.string().trim().min(10).max(4096),
  platform: z.enum(["android", "ios"]),
  appVersion: z.string().trim().max(30).optional(),
});

// Upsert by token: a token that was registered by another customer (shared
// phone, re-login) moves to whoever registered it last.
accountDevicesRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const input = deviceSchema.parse(req.body);
    await DeviceModel.updateOne(
      { token: input.token },
      { $set: { customer: req.customer!.id, platform: input.platform, appVersion: input.appVersion, lastSeenAt: new Date() } },
      { upsert: true },
    );
    sendSuccess(res, { token: input.token }, "Device registered");
  }),
);

// Called on logout. Only removes the token if it belongs to this customer.
accountDevicesRouter.delete(
  "/:token",
  asyncHandler(async (req: Request, res: Response) => {
    const token = decodeURIComponent(req.params.token);
    await DeviceModel.deleteOne({ token, customer: req.customer!.id });
    sendSuccess(res, { token }, "Device removed");
  }),
);
