import { ApiError } from "../../lib/api-error.js";
import { CustomerModel } from "../../models/customer.model.js";

export interface ListCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function listCustomers(query: ListCustomersQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { mobile: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    CustomerModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    CustomerModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCustomerById(id: string) {
  const customer = await CustomerModel.findById(id);
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}

export async function findOrCreateCustomerByMobile(input: {
  name: string;
  mobile: string;
  email?: string;
}) {
  const existing = await CustomerModel.findOne({ mobile: input.mobile });
  if (existing) return existing;
  return CustomerModel.create(input);
}

export async function createCustomer(input: Record<string, unknown>) {
  const existing = await CustomerModel.findOne({ mobile: input.mobile });
  if (existing) throw ApiError.conflict("A customer with this mobile number already exists");
  return CustomerModel.create(input);
}

export async function updateCustomer(id: string, input: Record<string, unknown>) {
  const customer = await getCustomerById(id);
  Object.assign(customer, input);
  await customer.save();
  return customer;
}
