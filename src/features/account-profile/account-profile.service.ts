import { ApiError } from "../../lib/api-error.js";
import { CustomerModel } from "../../models/customer.model.js";

export async function getMyProfile(customerId: string) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");
  return customer;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  dob?: Date;
  gender?: "male" | "female" | "other";
  preferredLanguage?: string;
  city?: string;
  photo?: string;
}

export async function updateMyProfile(customerId: string, input: UpdateProfileInput) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");
  Object.assign(customer, input);
  await customer.save();
  return customer;
}
