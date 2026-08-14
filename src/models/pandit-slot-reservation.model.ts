import { Schema, model, type InferSchemaType } from "mongoose";

// The CRM works off 3 fixed daily blocks per pandit — distinct from the
// admin-managed Muhurat schedule (which is per Pooja+Date, customer-facing,
// and has variable slot times). This is a separate concern by design.
export const CRM_FIXED_SLOTS = ["8-11", "12-3", "4-8"] as const;

const panditSlotReservationSchema = new Schema(
  {
    pandit: { type: Schema.Types.ObjectId, ref: "Pandit", required: true },
    // Stored as "YYYY-MM-DD" (not a Date) so lookups are exact-string matches
    // with no timezone drift between the CRM's date and ours.
    date: { type: String, required: true },
    slot: { type: String, enum: CRM_FIXED_SLOTS, required: true },
    bookingRef: { type: String, required: true },
    // Set only when bookingRef matched an existing website Booking that we
    // updated in place; null for CRM-native refs with no matching booking.
    booking: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
  },
  { timestamps: true },
);

// The atomic guard against double-booking: a second reservation attempt for
// the same pandit+date+slot fails at the database level (E11000) even under
// concurrent requests across multiple server instances — no in-memory state.
panditSlotReservationSchema.index({ pandit: 1, date: 1, slot: 1 }, { unique: true });
panditSlotReservationSchema.index({ pandit: 1, bookingRef: 1 });

export type PanditSlotReservationDocument = InferSchemaType<typeof panditSlotReservationSchema>;
export const PanditSlotReservationModel = model("PanditSlotReservation", panditSlotReservationSchema);
