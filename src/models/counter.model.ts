import { Schema, model } from "mongoose";

// Atomic sequence counters (e.g. "booking:PD-2026-"), incremented with $inc
// so concurrent requests can never be handed the same number.
const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

export const CounterModel = model("Counter", counterSchema);
