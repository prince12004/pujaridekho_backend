import { Schema, model, type InferSchemaType } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type RoleDocument = InferSchemaType<typeof roleSchema>;
export const RoleModel = model("Role", roleSchema);
