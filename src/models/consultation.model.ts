import { Schema, model, type InferSchemaType } from "mongoose";

export const CONSULTATION_FEE = 500;
export const CONSULTATION_TYPES = ["call", "chat", "video"] as const;
export const REQUEST_STATUSES = ["requested", "approved", "rejected"] as const;

const requestSchema = new Schema(
  {
    reason: { type: String },
    requestedDate: { type: Date },
    requestedTime: { type: String },
    status: { type: String, enum: REQUEST_STATUSES, default: "requested" },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolutionNote: { type: String },
  },
  { _id: false },
);

const consultationSchema = new Schema(
  {
    // Nullable for consultations submitted before this ref existed — new
    // requests always link the real Customer, same as Booking/Order.
    customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    type: { type: String, enum: CONSULTATION_TYPES, default: "call" },
    topic: { type: String },
    message: { type: String },
    preferredDate: { type: Date },
    preferredTime: { type: String },
    duration: { type: String },
    fee: { type: Number, default: CONSULTATION_FEE },
    paymentStatus: { type: String, enum: ["unpaid", "partially_paid", "paid"], default: "unpaid" },
    amountPaid: { type: Number, default: 0 },
    paymentGateway: { type: String },
    gatewayTransactionId: { type: String },
    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "completed", "cancelled"],
      default: "new",
    },
    // Consultations don't let the customer pick a pandit — admin reviews the
    // request and assigns one from the verified pool.
    pandit: { type: Schema.Types.ObjectId, ref: "Pandit", default: null },
    adminNotes: { type: String },
    rescheduleRequest: { type: requestSchema, default: null },
    cancelRequest: { type: requestSchema, default: null },
    timeline: [{ status: String, note: String, changedAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true },
);

consultationSchema.index({ status: 1, createdAt: -1 });
consultationSchema.index({ customer: 1 });

export type ConsultationDocument = InferSchemaType<typeof consultationSchema>;
export const ConsultationModel = model("Consultation", consultationSchema);
