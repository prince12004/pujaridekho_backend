import { ApiError } from "../../lib/api-error.js";
import { RoleModel } from "../../models/role.model.js";
import { AdminUserModel } from "../../models/admin-user.model.js";
import bcrypt from "bcryptjs";

export async function listRoles() {
  return RoleModel.find().sort({ name: 1 });
}

export async function createRole(input: { name: string; permissions: string[] }) {
  const existing = await RoleModel.findOne({ name: input.name });
  if (existing) throw ApiError.conflict("A role with this name already exists");
  return RoleModel.create({ ...input, isSystem: false });
}

export async function updateRole(id: string, input: { name?: string; permissions?: string[] }) {
  const role = await RoleModel.findById(id);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System roles cannot be modified");
  Object.assign(role, input);
  await role.save();
  return role;
}

export async function deleteRole(id: string) {
  const role = await RoleModel.findById(id);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System roles cannot be deleted");
  const assignedCount = await AdminUserModel.countDocuments({ role: id });
  if (assignedCount > 0) throw ApiError.conflict("Cannot delete a role that is assigned to admin users");
  await role.deleteOne();
}

export async function listAdminUsers() {
  return AdminUserModel.find().populate("role", "name permissions").sort({ createdAt: -1 });
}

export async function createAdminUser(input: { name: string; email: string; password: string; role: string }) {
  const existing = await AdminUserModel.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict("An admin with this email already exists");
  const role = await RoleModel.findById(input.role);
  if (!role) throw ApiError.badRequest("Selected role does not exist");
  const passwordHash = await bcrypt.hash(input.password, 12);
  return AdminUserModel.create({ name: input.name, email: input.email, passwordHash, role: input.role });
}

export async function updateAdminUserStatus(id: string, status: "active" | "suspended") {
  const user = await AdminUserModel.findById(id);
  if (!user) throw ApiError.notFound("Admin user not found");
  user.status = status;
  await user.save();
  return user;
}
