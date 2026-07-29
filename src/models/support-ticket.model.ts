import { Schema, model, type InferSchemaType } from "mongoose";

export const SUPPORT_CATEGORIES = [
  "booking",
  "pandit",
  "payment",
  "refund",
  "order",
  "consultation",
  "account",
  "other",
] as const;

export const SUPPORT_STATUSES = ["open", "in_progress", "waiting_for_customer", "resolved", "closed"] as const;
export const SUPPORT_RELATED_TYPES = ["booking", "order", "consultation"] as const;

const supportMessageSchema = new Schema(
  {
    sender: { type: String, enum: ["customer", "admin"], required: true },
    message: { type: String, required: true },
    attachmentUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const supportTicketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true },
    relatedType: { type: String, enum: SUPPORT_RELATED_TYPES },
    relatedId: { type: Schema.Types.ObjectId },
    subject: { type: String, required: true },
    attachmentUrl: { type: String },
    status: { type: String, enum: SUPPORT_STATUSES, default: "open" },
    messages: { type: [supportMessageSchema], default: [] },
  },
  { timestamps: true },
);

supportTicketSchema.index({ customer: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema>;
export const SupportTicketModel = model("SupportTicket", supportTicketSchema);
