import { Schema, model, type InferSchemaType } from "mongoose";

export const ADDRESS_TYPES = ["home", "office", "other"] as const;

const addressSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  landmark: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, required: true, trim: true },
  type: { type: String, enum: ADDRESS_TYPES, default: "home" },
  isDefault: { type: Boolean, default: false },
});

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    preferredLanguage: { type: String },
    city: { type: String },
    photo: { type: String },
    addresses: { type: [addressSchema], default: [] },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    lastLoginAt: { type: Date },
    adminNotes: { type: String },
  },
  { timestamps: true },
);

export type CustomerDocument = InferSchemaType<typeof customerSchema>;
export const CustomerModel = model("Customer", customerSchema);
