import { Schema, model, type InferSchemaType } from "mongoose";

// Ported 1:1 from pujaridekhocrm/backend/server.js's inquirySchema (the CRM's
// "Inquiry"/lead model) so migrated documents (see
// scripts/migrate-crm-data.ts) map cleanly onto this collection without any
// field renaming/reshaping. Deliberately NOT merged with HomeLeadModel —
// that model is an unrelated, much simpler "website contact form" lead,
// while this is the CRM's full sales-pipeline record (assignment, pandit
// scheduling, payment tracking, optimistic locking, website-booking sync).
const crmInquirySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    clientName: { type: String, required: true },
    phone: { type: String, required: true },
    pujaName: { type: String, required: true },
    pujaDate: { type: String, default: null },
    pujaTime: { type: String, default: null },
    // Latest of pujaEvents' dates — kept in sync alongside pujaDate (the
    // earliest) whenever events are written.
    pujaEndDate: { type: String, default: null },
    // Labeled dates for a multi-day puja (e.g. "Sthapna" on 11 Sep,
    // "Visarjan" on 15 Sep), each with its own independent pandit
    // assignment. May be empty for a booking that only ever had the single
    // legacy pujaDate.
    pujaEvents: {
      type: [
        {
          _id: false,
          id: { type: String, required: true },
          label: { type: String, required: true },
          date: { type: String, required: true },
          time: { type: String, default: null },
          panditId: { type: String, default: null },
          panditName: { type: String, default: null },
          assignedSlot: { type: String, default: null },
        },
      ],
      default: [],
    },
    status: { type: String, default: "inquiry", enum: ["inquiry", "confirmed", "notConverted"] },
    // totalAmount stays the single authoritative total every existing screen
    // reads. packagePrice/samagriPrice are optional — when packagePrice is
    // present on a write, the service layer derives totalAmount from them
    // (packagePrice + samagriPrice if samagriIncluded); left null on older
    // records until someone edits them.
    packagePrice: { type: Number, default: null },
    samagriPrice: { type: Number, default: null },
    totalAmount: { type: Number, default: 0 },
    tokenAmount: { type: Number, default: 0 },
    tokenStatus: { type: String, default: "pending", enum: ["pending", "received"] },
    // Whether the FULL totalAmount (not just the token/advance) has been
    // collected — separate flag from tokenStatus since a booking can have
    // its token received while the balance is still due.
    totalAmountStatus: { type: String, default: "pending", enum: ["pending", "received"] },
    transactionId: { type: String, default: null },
    nextCallDate: { type: String, default: null },
    // Free-text priest name — kept for old records/back-compat, but no
    // longer written to once a structured pandit is assigned via
    // panditId/panditName below.
    pujariName: { type: String, default: null },
    panditId: { type: String, default: null },
    panditName: { type: String, default: null },
    assignedSlot: { type: String, default: null },
    address: { type: String, default: null },
    notes: { type: String, default: null },
    source: {
      type: String,
      default: "other",
      enum: ["website", "whatsapp", "instagram", "facebook", "other"],
    },
    // Set only for bookings confirmed directly on the website and synced in
    // — dedupes redelivery and distinguishes a website-confirmed booking
    // from one made natively in the CRM. Deliberately no `default: null` —
    // the sparse unique index below only excludes documents where this
    // path is truly absent.
    websiteBookingId: { type: String },
    // Internal only — the field values as last received from the website,
    // so a re-sync can tell "admin edited this locally" apart from "nobody's
    // touched it since the last sync, safe to take the website's newer
    // value."
    websiteSyncSnapshot: { type: Schema.Types.Mixed, default: null },
    assignedTo: { type: String, default: null },
    createdAt: { type: String, required: true },
    reviewed: { type: Boolean, default: false },
    // Whether Pujari Dekho is providing the puja samagri for a confirmed
    // booking, or the client is arranging their own.
    samagriIncluded: { type: Boolean, default: false },
    // Optimistic locking (see PUT /inquiries/:id). Deliberately a plain
    // app-level field rather than Mongoose's built-in versionKey, since
    // the update route uses findOneAndUpdate, not .save().
    version: { type: Number, default: 0 },
    updatedAt: { type: String, default: null },
  },
  { versionKey: false },
);

// Mirrors the original server.js indexes 1:1 — see that file's comment block
// for the per-route justification of each one.
crmInquirySchema.index({ assignedTo: 1 });
crmInquirySchema.index({ createdAt: -1 });
crmInquirySchema.index({ status: 1 });
crmInquirySchema.index({ nextCallDate: 1 });
crmInquirySchema.index({ pujaDate: 1 });
crmInquirySchema.index({ phone: 1 });
crmInquirySchema.index({ clientName: 1 });
crmInquirySchema.index({ assignedTo: 1, createdAt: -1 });
crmInquirySchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
crmInquirySchema.index({ status: 1, createdAt: -1 });
crmInquirySchema.index({ status: 1, pujaDate: 1 });
crmInquirySchema.index({ status: 1, pujaEndDate: 1 });
crmInquirySchema.index({ status: 1, nextCallDate: 1 });
crmInquirySchema.index({ "pujaEvents.date": 1 });
crmInquirySchema.index({ websiteBookingId: 1 }, { unique: true, sparse: true });

export type CrmInquiryDocument = InferSchemaType<typeof crmInquirySchema>;
export const CrmInquiryModel = model("CrmInquiry", crmInquirySchema);
