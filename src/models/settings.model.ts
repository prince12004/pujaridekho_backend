import { Schema, model, type InferSchemaType } from "mongoose";

const socialLinksSchema = new Schema(
  {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    twitter: { type: String, default: "" },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    siteName: { type: String, default: "PujariDekho" },
    tagline: { type: String, default: "Aapki Har Puja Ke Pujari" },
    contactPhone: { type: String, default: "" },
    contactWhatsapp: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    officeAddress: { type: String, default: "" },
    officeHours: { type: String, default: "" },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
  },
  { timestamps: true },
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema>;
export const SettingsModel = model("Settings", settingsSchema);
