import { Schema, model, type InferSchemaType } from "mongoose";

// Ported 1:1 from pujaridekhocrm/backend/server.js's salesPersonSchema so
// migrated documents (see scripts/migrate-crm-data.ts) map cleanly onto this
// collection without any field renaming/reshaping.
//
// Deliberately NOT folded into AdminUserModel: salespeople log in with a
// phone number + password (no email), and the CRM's "own records only"
// scoping (see crmOwnFilter in middlewares/crm-auth.ts) keys off
// salesPersonId, a concept the admin-user/role system has no equivalent
// for. Reusing AdminUser would mean bolting a parallel, CRM-only auth shape
// onto a model the main admin panel also depends on. Keeping it separate
// avoids that coupling while still reusing the same JWT/middleware idiom
// (see crm-auth.service.ts / middlewares/crm-auth.ts) as admin-auth.
const salesPersonSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

export type SalesPersonDocument = InferSchemaType<typeof salesPersonSchema>;
export const SalesPersonModel = model("SalesPerson", salesPersonSchema);
