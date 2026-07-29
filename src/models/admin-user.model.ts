import { Schema, model, type InferSchemaType, Types } from "mongoose";

const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema> & { _id: Types.ObjectId };
export const AdminUserModel = model("AdminUser", adminUserSchema);
