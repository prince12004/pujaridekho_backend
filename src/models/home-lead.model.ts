import { Schema, model, type InferSchemaType } from "mongoose";

const homeLeadSchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    pooja: { type: String, required: true },
    date: { type: String, required: true },
    // "homepage" = the homepage enquiry form. "checkout" = details captured
    // the moment a customer presses "Book Now" on checkout — saved before
    // OTP login / booking creation so nobody who fills the form is lost.
    source: { type: String, enum: ["homepage", "checkout"], default: "homepage" },
    status: { type: String, enum: ["open", "converted"], default: "open" },
    serviceType: { type: String },
    poojaSlug: { type: String },
    packageName: { type: String },
    estimatedAmount: { type: Number },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
    bookingRef: { type: String },
    convertedAt: { type: Date },
  },
  { timestamps: true },
);

homeLeadSchema.index({ createdAt: -1 });
homeLeadSchema.index({ source: 1, status: 1, createdAt: -1 });

export type HomeLeadDocument = InferSchemaType<typeof homeLeadSchema>;
export const HomeLeadModel = model("HomeLead", homeLeadSchema);
