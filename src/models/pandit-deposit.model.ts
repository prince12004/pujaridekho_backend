import { Schema, model, type InferSchemaType } from "mongoose";

// Records one payment a pandit makes to the company for cash they've
// collected from customers on completed bookings (pujaripandit_app "Pay
// Dues" flow). Created by pandit-app.service#payDues, which also stamps the
// settled bookings' panditExecution.depositStatus/depositId/depositedAt.
const panditDepositSchema = new Schema(
  {
    pandit: { type: Schema.Types.ObjectId, ref: "Pandit", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["upi", "card", "net_banking", "cash"], default: "upi" },
    gatewayRef: { type: String, default: null },
    bookings: { type: [Schema.Types.ObjectId], ref: "Booking", default: [] },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

panditDepositSchema.index({ pandit: 1, paidAt: -1 });

export type PanditDepositDocument = InferSchemaType<typeof panditDepositSchema>;
export const PanditDepositModel = model("PanditDeposit", panditDepositSchema);
