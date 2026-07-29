import { Schema, model, type InferSchemaType } from "mongoose";

const panditApplicationSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    city: { type: String },
    experience: { type: String },
    specialization: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "under_review", "more_info_requested", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String },
    convertedPandit: { type: Schema.Types.ObjectId, ref: "Pandit", default: null },
  },
  { timestamps: true },
);

export type PanditApplicationDocument = InferSchemaType<typeof panditApplicationSchema>;
export const PanditApplicationModel = model("PanditApplication", panditApplicationSchema);
