import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ApiError } from "../../lib/api-error.js";
import { SalesPersonModel, type SalesPersonDocument } from "../../models/sales-person.model.js";

// Ported from pujaridekhocrm/backend/server.js's salespeople routes.

export function toSalesPersonJson(doc: SalesPersonDocument) {
  return {
    id: doc.id,
    name: doc.name,
    phone: doc.phone,
    active: doc.active,
    createdAt: doc.createdAt,
  };
}

export async function listSalesPeople() {
  return SalesPersonModel.find().sort({ name: 1 });
}

export interface CreateSalesPersonInput {
  id?: string;
  name: string;
  phone: string;
  password: string;
  createdAt?: string;
}

export async function createSalesPerson(input: CreateSalesPersonInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    return await SalesPersonModel.create({
      id: input.id || `${Date.now()}_${Math.round(Math.random() * 999)}`,
      name: input.name,
      phone: input.phone.trim(),
      passwordHash,
      createdAt: input.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      throw ApiError.conflict("A salesperson with this phone number already exists");
    }
    throw err;
  }
}

export interface UpdateSalesPersonInput {
  name?: string;
  phone?: string;
  active?: boolean;
  password?: string;
}

export async function updateSalesPerson(id: string, input: UpdateSalesPersonInput) {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.phone !== undefined) update.phone = input.phone.trim();
  if (input.active !== undefined) update.active = input.active;
  if (input.password) update.passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const doc = await SalesPersonModel.findOneAndUpdate({ id }, { $set: update }, { new: true });
    if (!doc) throw ApiError.notFound("Not found");
    return doc;
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      throw ApiError.conflict("A salesperson with this phone number already exists");
    }
    throw err;
  }
}
