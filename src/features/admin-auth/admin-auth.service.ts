import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { ApiError } from "../../lib/api-error.js";
import { AdminUserModel } from "../../models/admin-user.model.js";
import { RoleModel } from "../../models/role.model.js";

const TOKEN_TTL = "8h";

export async function loginAdmin(email: string, password: string) {
  const user = await AdminUserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (user.status !== "active") {
    throw ApiError.forbidden("This admin account has been suspended");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const role = await RoleModel.findById(user.role);
  if (!role) {
    throw ApiError.internal("Role assigned to this account no longer exists");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign({ sub: user._id.toString() }, env.ADMIN_JWT_SECRET, { expiresIn: TOKEN_TTL });

  return {
    token,
    admin: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: role.name,
      permissions: role.permissions,
    },
  };
}
