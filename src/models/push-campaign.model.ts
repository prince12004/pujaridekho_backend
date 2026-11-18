import { Schema, model, type InferSchemaType } from "mongoose";

// History of manual pushes sent from Admin → Push notifications.
const pushCampaignSchema = new Schema(
  {
    audience: {
      type: { type: String, enum: ["all", "city", "customer"], required: true },
      city: { type: String },
      customer: { type: Schema.Types.ObjectId, ref: "Customer" },
      label: { type: String },
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    imageUrl: { type: String },
    saveInApp: { type: Boolean, default: true },
    customerCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    pushConfigured: { type: Boolean, default: true },
    sentBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    sentByName: { type: String },
  },
  { timestamps: true },
);

pushCampaignSchema.index({ createdAt: -1 });

export type PushCampaignDocument = InferSchemaType<typeof pushCampaignSchema>;
export const PushCampaignModel = model("PushCampaign", pushCampaignSchema);
