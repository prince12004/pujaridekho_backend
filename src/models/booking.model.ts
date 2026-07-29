import { Schema, model, type InferSchemaType } from "mongoose";

// Unified status lifecycle for BOTH online (website) and offline (admin-created)
// bookings — a single Booking model/service backs both flows, per explicit
// requirement: "Do NOT build two independent booking systems."
export const BOOKING_STATUSES = [
  "pending_payment",
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
  "pandit_accepted",
  "pandit_on_the_way",
  "pooja_started",
  "pooja_completed",
  "closed",
  "cancelled",
  "refund_requested",
  "refunded",
  "rescheduled",
] as const;

export const BOOKING_SERVICE_TYPES = ["pooja", "pandit", "festival", "consultation", "other"] as const;
export const BOOKING_CHANNELS = ["online", "offline"] as const;
export const BOOKING_SOURCES = [
  "website",
  "phone",
  "whatsapp",
  "walk_in",
  "admin",
  "referral",
  "repeat_customer",
  "other",
] as const;
export const PAYMENT_METHODS = ["payu", "razorpay", "cash", "upi", "bank_transfer", "card", "other"] as const;
export const PAYMENT_STATUSES = ["unpaid", "partially_paid", "paid", "refunded"] as const;

const customerSnapshotSchema = new Schema(
  {
    name: String,
    mobile: String,
    email: String,
  },
  { _id: false },
);

const packageSnapshotSchema = new Schema(
  {
    name: String,
    price: Number,
    salePrice: Number,
    samagriIncluded: Boolean,
    dakshinaIncluded: Boolean,
  },
  { _id: false },
);

const selectedSamagriSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const pricingSchema = new Schema(
  {
    packagePrice: { type: Number, default: 0 },
    samagriCharges: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    customDiscount: { type: Number, default: 0 },
    marketPrice: { type: Number },
    finalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    priceChangedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    priceChangeReason: { type: String },
  },
  { _id: false },
);

const paymentRecordSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    transactionRef: { type: String },
    notes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const referralSchema = new Schema(
  {
    referredBy: { type: String },
    referralCode: { type: String },
    notes: { type: String },
  },
  { _id: false },
);

const internalNoteSchema = new Schema(
  {
    note: { type: String, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const timelineEventSchema = new Schema(
  {
    status: { type: String },
    note: { type: String },
    changedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const REQUEST_STATUSES = ["requested", "approved", "rejected"] as const;

const rescheduleRequestSchema = new Schema(
  {
    requestedDate: { type: Date, required: true },
    requestedTime: { type: String },
    reason: { type: String },
    status: { type: String, enum: REQUEST_STATUSES, default: "requested" },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolutionNote: { type: String },
  },
  { _id: false },
);

const cancelRequestSchema = new Schema(
  {
    reason: { type: String, required: true },
    notes: { type: String },
    status: { type: String, enum: REQUEST_STATUSES, default: "requested" },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolutionNote: { type: String },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    bookingId: { type: String, required: true, unique: true },

    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    customerSnapshot: { type: customerSnapshotSchema, default: {} },

    serviceType: { type: String, enum: BOOKING_SERVICE_TYPES, required: true, default: "pooja" },
    pooja: { type: Schema.Types.ObjectId, ref: "Pooja" },
    festival: { type: Schema.Types.ObjectId, ref: "Festival", default: null },
    package: { type: packageSnapshotSchema },
    selectedSamagri: { type: [selectedSamagriSchema], default: [] },

    address: { type: String },
    city: { type: String },
    landmark: { type: String },
    pincode: { type: String },
    gotra: { type: String },
    specialInstructions: { type: String },

    poojaDate: { type: Date, required: true },
    poojaTime: { type: String },
    // Set only for Pooja bookings made against an admin-managed Muhurat
    // schedule (Pooja + Date specific) — used to keep each slot's
    // bookedCount accurate for capacity limits.
    muhuratSlot: {
      type: new Schema(
        {
          muhurat: { type: Schema.Types.ObjectId, ref: "Muhurat", required: true },
          slotId: { type: Schema.Types.ObjectId, required: true },
        },
        { _id: false },
      ),
      default: null,
    },

    pandit: { type: Schema.Types.ObjectId, ref: "Pandit", default: null },

    status: { type: String, enum: BOOKING_STATUSES, default: "pending_payment" },

    pricing: { type: pricingSchema, default: {} },
    payments: { type: [paymentRecordSchema], default: [] },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },

    // Distinguishes a customer-initiated website booking from an
    // admin-entered offline booking, while both flow through this same model.
    bookingChannel: { type: String, enum: BOOKING_CHANNELS, required: true, default: "online" },
    bookingSource: { type: String, enum: BOOKING_SOURCES, required: true, default: "website" },
    referral: { type: referralSchema },
    createdByAdmin: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },

    internalNotes: { type: [internalNoteSchema], default: [] },
    timeline: { type: [timelineEventSchema], default: [] },

    rescheduleRequest: { type: rescheduleRequestSchema, default: null },
    cancelRequest: { type: cancelRequestSchema, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customer: 1 });
bookingSchema.index({ pandit: 1 });
bookingSchema.index({ bookingChannel: 1, bookingSource: 1 });

export type BookingDocument = InferSchemaType<typeof bookingSchema>;
export const BookingModel = model("Booking", bookingSchema);
