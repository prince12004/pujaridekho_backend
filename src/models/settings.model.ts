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

// Mobile app version gate, read by the Flutter app on launch:
//   installed < minVersion    → blocking "Update required"
//   installed < latestVersion → dismissible "Update available"
const appPlatformSchema = new Schema(
  {
    minVersion: { type: String, default: "1.0.0" },
    latestVersion: { type: String, default: "1.0.0" },
    storeUrl: { type: String, default: "" },
  },
  { _id: false },
);

const appSettingsSchema = new Schema(
  {
    android: { type: appPlatformSchema, default: () => ({}) },
    ios: { type: appPlatformSchema, default: () => ({}) },
    updateMessage: { type: String, default: "A new version of Pujari Dekho is available." },
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
    // Defaults apply even to the existing settings document, so GET /settings
    // never returns a null "app" object.
    app: { type: appSettingsSchema, default: () => ({}) },
    // Added on top of the live database counts shown on the homepage / About
    // page. Only use a number you can evidence (e.g. documented offline pujas) —
    // these figures appear in ads and must survive a "show me" request.
    statsOffsets: {
      type: new Schema(
        {
          verifiedPandits: { type: Number, default: 0, min: 0 },
          poojas: { type: Number, default: 0, min: 0 },
          families: { type: Number, default: 0, min: 0 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  { timestamps: true },
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema>;
export const SettingsModel = model("Settings", settingsSchema);
