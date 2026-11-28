// SEO audit 1.1: show only evidenced numbers — remove the display boosts added
// to the homepage counters (Admin → Settings → Stats offsets can set them again).
//   npx tsx scripts/fix-stats-offsets.ts           # dry run
//   npx tsx scripts/fix-stats-offsets.ts --apply   # write
import mongoose from "mongoose";
import { config } from "dotenv";

config({ override: true });
const apply = process.argv.includes("--apply");
await mongoose.connect(process.env.MONGODB_URI!);
const col = mongoose.connection.db!.collection("settings");
const s = await col.findOne({});
console.log(`${apply ? "APPLY" : "DRY  "} statsOffsets ${JSON.stringify(s?.statsOffsets)} -> {"verifiedPandits":0,"poojas":0,"families":0}`);
if (apply && s) await col.updateOne({ _id: s._id }, { $set: { statsOffsets: { verifiedPandits: 0, poojas: 0, families: 0 } } });
await mongoose.disconnect();
