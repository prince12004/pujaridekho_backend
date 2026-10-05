import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { ApiError } from "../../lib/api-error.js";
import { SalesPersonModel } from "../../models/sales-person.model.js";
import { signCrmToken, type CrmAuthContext } from "../../middlewares/crm-auth.js";

// Ported from pujaridekhocrm/backend/server.js's POST /api/auth/login.
// `identifier` is either the admin/superadmin env-var username or a
// salesperson's phone number — checked in turn, same as the original.
export async function loginCrmUser(identifier: string, password: string) {
  const trimmed = identifier.trim();

  if (trimmed === env.CRM_ADMIN_USERNAME && password === env.CRM_ADMIN_PASSWORD) {
    const payload: CrmAuthContext = { role: "admin", name: env.CRM_ADMIN_USERNAME };
    return { token: signCrmToken(payload), role: "admin" as const, username: env.CRM_ADMIN_USERNAME };
  }

  if (trimmed === env.CRM_SUPERADMIN_USERNAME && password === env.CRM_SUPERADMIN_PASSWORD) {
    const payload: CrmAuthContext = { role: "superadmin", name: env.CRM_SUPERADMIN_USERNAME };
    return { token: signCrmToken(payload), role: "superadmin" as const, username: env.CRM_SUPERADMIN_USERNAME };
  }

  const person = await SalesPersonModel.findOne({ phone: trimmed, active: true });
  if (person && (await bcrypt.compare(password ?? "", person.passwordHash))) {
    const payload: CrmAuthContext = { role: "salesperson", salesPersonId: person.id, name: person.name };
    return {
      token: signCrmToken(payload),
      role: "salesperson" as const,
      salesPersonId: person.id,
      name: person.name,
    };
  }

  throw ApiError.unauthorized("Invalid username/mobile number or password");
}
