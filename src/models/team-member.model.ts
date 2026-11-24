import { Schema, model, type InferSchemaType } from "mongoose";

// "Meet Our Team" on the About page — managed in Admin → Website CMS → Team.
const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    bio: { type: String, trim: true, default: "", maxlength: 240 },
    // Optional long-form profile, opened from the card ("View full profile").
    profile: { type: String, trim: true, default: "", maxlength: 4000 },
    // Shown as separate rows on the About page.
    group: { type: String, enum: ["leadership", "advisor"], default: "leadership" },
    // Portrait photo (4:5 works best). Uploaded via the media library, or a
    // site path such as /team/<name>.jpg.
    photo: { type: String, trim: true, default: "" },
    // Where the face sits when the card crops the photo: CSS object-position.
    photoPosition: { type: String, enum: ["top", "center", "bottom"], default: "top" },
    // Shown with a subtle highlight (e.g. the founder).
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

teamMemberSchema.index({ isActive: 1, sortOrder: 1 });

export type TeamMemberDocument = InferSchemaType<typeof teamMemberSchema>;
export const TeamMemberModel = model("TeamMember", teamMemberSchema);
