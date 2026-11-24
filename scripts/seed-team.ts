// One-off: adds the About page team members (skips anyone already present by name).
// Usage: npx tsx scripts/seed-team.ts [--apply]
import mongoose from "mongoose";
import { config } from "dotenv";
import { TeamMemberModel } from "../src/models/team-member.model.js";

config({ override: true });
const apply = process.argv.includes("--apply");

const members = [
  { name: "Akhilanand Mishra", designation: "Founder", photo: "/team/akhilanand-mishra.jpg", featured: true },
  { name: "Aditya Tondon", designation: "Mentor", photo: "/team/aditya-tondon.jpg" },
  { name: "Shrirama Kaudoor", designation: "Mentor", photo: "/team/shrirama-kaudoor.jpg" },
  { name: "Prince Kushwah", designation: "Frontend Developer", photo: "/team/prince-kushwah.jpg" },
  { name: "Anurag Pandey", designation: "App Developer", photo: "/team/anurag-pandey.jpg" },
];

await mongoose.connect(process.env.MONGODB_URI!);
const existing = await TeamMemberModel.find().lean();
console.log(`Existing team members: ${existing.length}`);
let order = existing.reduce((max, m) => Math.max(max, m.sortOrder ?? 0), 0);
for (const m of members) {
  if (existing.some((e) => e.name.toLowerCase() === m.name.toLowerCase())) {
    console.log(`skip   ${m.name} (already exists)`);
    continue;
  }
  order += 1;
  console.log(`${apply ? "insert" : "would insert"} #${order} ${m.name} — ${m.designation}`);
  if (apply) await TeamMemberModel.create({ ...m, photoPosition: "top", sortOrder: order, isActive: true });
}
await mongoose.disconnect();
