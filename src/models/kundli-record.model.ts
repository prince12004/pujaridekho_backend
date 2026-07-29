import { Schema, model, type InferSchemaType } from "mongoose";

// Stores the exact output of the real astronomy-engine computation (see
// src/lib/astronomy/kundli.ts) so a saved Kundli renders identically on
// revisit — never recomputed/faked from a summary.
const planetPositionSchema = new Schema(
  { planet: String, rashi: String, nakshatra: String, pada: Number, siderealLongitude: Number },
  { _id: false },
);

const kundliRecordSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    personName: { type: String, required: true, trim: true },
    dob: { type: String, required: true },
    tob: { type: String, required: true },
    place: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    ascendant: { rashi: String, siderealLongitude: Number },
    moonRashi: { type: String },
    moonNakshatra: { type: String },
    moonPada: { type: Number },
    sunRashi: { type: String },
    ayanamsa: { type: Number },
    locationUsed: { type: String },
    planets: { type: [planetPositionSchema], default: [] },
  },
  { timestamps: true },
);

kundliRecordSchema.index({ customer: 1, createdAt: -1 });

export type KundliRecordDocument = InferSchemaType<typeof kundliRecordSchema>;
export const KundliRecordModel = model("KundliRecord", kundliRecordSchema);
