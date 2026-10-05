import bcrypt from "bcryptjs";
import { ApiError } from "../../lib/api-error.js";
import { requestOtp, consumeOtp } from "../../lib/otp.js";
import { issuePanditTokenPair } from "../../lib/pandit-tokens.js";
import { PanditModel } from "../../models/pandit.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { BookingModel } from "../../models/booking.model.js";
import { toPanditProfileJson } from "../../lib/pandit-app-presenters.js";

async function presentPandit(panditId: string) {
  const pandit = await PanditModel.findById(panditId);
  if (!pandit) throw ApiError.notFound("Pandit account not found");
  const [reviewCount, activeBooking] = await Promise.all([
    ReviewModel.countDocuments({ entityType: "pandit", entityId: pandit._id, status: "approved" }),
    BookingModel.exists({ pandit: pandit._id, "panditExecution.startedAt": { $ne: null }, "panditExecution.completedAt": null }),
  ]);
  return toPanditProfileJson(pandit, { reviewCount, hasActiveBooking: Boolean(activeBooking) });
}

export async function loginPandit(mobile: string, password: string) {
  const pandit = await PanditModel.findOne({ mobile }).select("+passwordHash");
  if (!pandit || !pandit.passwordHash) {
    throw ApiError.unauthorized("Incorrect mobile number or password.");
  }
  if (pandit.accountStatus !== "active") {
    throw ApiError.forbidden("This account has been deactivated. Please contact Pujari Dekho support.");
  }

  const isValid = await bcrypt.compare(password, pandit.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized("Incorrect mobile number or password.");
  }

  const tokens = issuePanditTokenPair(pandit._id.toString());
  const profile = await presentPandit(pandit._id.toString());
  return { ...tokens, pandit: profile };
}

export async function requestPanditPasswordReset(mobile: string) {
  const pandit = await PanditModel.findOne({ mobile });
  if (!pandit) {
    // Don't reveal whether a mobile number is registered.
    return { expiresAt: new Date(Date.now() + 5 * 60 * 1000) };
  }
  return requestOtp(mobile, "pandit_reset_password");
}

export async function resetPanditPassword(mobile: string, otp: string, newPassword: string) {
  const pandit = await PanditModel.findOne({ mobile });
  if (!pandit) throw ApiError.notFound("No pandit account found for this mobile number");

  await consumeOtp(mobile, "pandit_reset_password", otp);

  pandit.passwordHash = await bcrypt.hash(newPassword, 10);
  await pandit.save();
}

export async function changePanditPassword(panditId: string, currentPassword: string, newPassword: string) {
  const pandit = await PanditModel.findById(panditId).select("+passwordHash");
  if (!pandit) throw ApiError.notFound("Pandit account not found");
  if (!pandit.passwordHash || !(await bcrypt.compare(currentPassword, pandit.passwordHash))) {
    throw ApiError.unauthorized("Current password is incorrect.");
  }
  pandit.passwordHash = await bcrypt.hash(newPassword, 10);
  await pandit.save();
}
