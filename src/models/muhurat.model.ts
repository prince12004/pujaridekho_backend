import { Schema, model, type InferSchemaType } from "mongoose";

const muhuratTimeSlotSchema = new Schema(
  {
    startTime: { type: String, required: true }, // "HH:mm", 24h
    endTime: { type: String, required: true },
    capacity: { type: Number, min: 0 }, // undefined/null = unlimited
    bookedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const muhuratSchema = new Schema(
  {
    pooja: { type: Schema.Types.ObjectId, ref: "Pooja", required: true },
    date: { type: Date, required: true },
    slots: { type: [muhuratTimeSlotSchema], default: [] },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

muhuratSchema.index({ pooja: 1, date: 1 }, { unique: true });

export type MuhuratDocument = InferSchemaType<typeof muhuratSchema>;
export const MuhuratModel = model("Muhurat", muhuratSchema);
