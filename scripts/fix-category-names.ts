// Spelling fix from the SEO audit: "Puja's" -> "Pujas" in puja category names.
//   npx tsx scripts/fix-category-names.ts           # dry run
//   npx tsx scripts/fix-category-names.ts --apply   # write
import mongoose from "mongoose";
import { config } from "dotenv";

config({ override: true });
const apply = process.argv.includes("--apply");
await mongoose.connect(process.env.MONGODB_URI!);
const col = mongoose.connection.db!.collection("poojacategories");
for (const c of await col.find({ name: /Puja's|Pooja's/ }).toArray()) {
  const name = String(c.name).replace(/Puja's/g, "Pujas").replace(/Pooja's/g, "Poojas");
  console.log(`${apply ? "APPLY" : "DRY  "} ${c.name} -> ${name}`);
  if (apply) await col.updateOne({ _id: c._id }, { $set: { name, updatedAt: new Date() } });
}
await mongoose.disconnect();
