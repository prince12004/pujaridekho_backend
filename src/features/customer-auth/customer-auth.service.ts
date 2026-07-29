import { ApiError } from "../../lib/api-error.js";
import { requestOtp, consumeOtp } from "../../lib/otp.js";
import { issueCustomerTokenPair, verifyCustomerRefreshToken } from "../../lib/customer-tokens.js";
import { CustomerModel } from "../../models/customer.model.js";

export async function sendLoginOtp(mobile: string) {
  return requestOtp(mobile, "login");
}

export async function verifyLoginOtp(mobile: string, otp: string) {
  await consumeOtp(mobile, "login", otp);

  let customer = await CustomerModel.findOne({ mobile });
  const isNewCustomer = !customer;
  if (!customer) {
    customer = await CustomerModel.create({ name: "Customer", mobile });
  }
  if (customer.status !== "active") {
    throw ApiError.forbidden("This account has been blocked. Please contact support.");
  }

  customer.lastLoginAt = new Date();
  await customer.save();

  const tokens = issueCustomerTokenPair(customer._id.toString());
  return { ...tokens, isNewCustomer, customer };
}

export async function refreshCustomerSession(refreshToken: string) {
  let payload;
  try {
    payload = verifyCustomerRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const customer = await CustomerModel.findById(payload.sub);
  if (!customer || customer.status !== "active") {
    throw ApiError.unauthorized("Session is no longer valid");
  }

  return issueCustomerTokenPair(customer._id.toString());
}

export async function requestChangeMobileOtp(currentCustomerId: string, newMobile: string) {
  const conflict = await CustomerModel.findOne({ mobile: newMobile, _id: { $ne: currentCustomerId } });
  if (conflict) throw ApiError.conflict("This mobile number is already linked to another account");

  return requestOtp(newMobile, "change_mobile");
}

export async function verifyChangeMobileOtp(currentCustomerId: string, newMobile: string, otp: string) {
  const conflict = await CustomerModel.findOne({ mobile: newMobile, _id: { $ne: currentCustomerId } });
  if (conflict) throw ApiError.conflict("This mobile number is already linked to another account");

  await consumeOtp(newMobile, "change_mobile", otp);

  const customer = await CustomerModel.findById(currentCustomerId);
  if (!customer) throw ApiError.notFound("Account not found");

  customer.mobile = newMobile;
  await customer.save();
  return customer;
}
