import { Schema, model, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "pooja.created", "booking.pandit_assigned"
    entityType: { type: String, required: true }, // e.g. "Pooja", "Booking"
    entityId: { type: String },
    description: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLogModel = model("AuditLog", auditLogSchema);
