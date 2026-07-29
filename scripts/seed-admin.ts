/**
 * One-off script to bootstrap the first Super Admin account.
 * Reads ADMIN_SEED_NAME / ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD from .env —
 * never hardcode credentials here. Safe to re-run (idempotent).
 *
 * Usage: pnpm seed:admin
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { AdminUserModel } from "../src/models/admin-user.model.js";
import { RoleModel } from "../src/models/role.model.js";
import { DEFAULT_ROLES } from "../src/lib/permissions.js";

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  const name = process.env.ADMIN_SEED_NAME;
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!mongoUri) throw new Error("MONGODB_URI is not set");
  if (!name || !email || !password) {
    throw new Error("ADMIN_SEED_NAME, ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env to run this script");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  for (const roleDef of DEFAULT_ROLES) {
    await RoleModel.findOneAndUpdate(
      { name: roleDef.name },
      { $setOnInsert: { name: roleDef.name, permissions: roleDef.permissions, isSystem: roleDef.isSystem } },
      { upsert: true },
    );
  }
  console.log(`Ensured ${DEFAULT_ROLES.length} default roles exist`);

  const superAdminRole = await RoleModel.findOne({ name: "Super Admin" });
  if (!superAdminRole) throw new Error("Super Admin role was not created");

  const existing = await AdminUserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin user ${email} already exists — skipping creation.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await AdminUserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: superAdminRole._id,
      status: "active",
    });
    console.log(`Created Super Admin: ${email}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
