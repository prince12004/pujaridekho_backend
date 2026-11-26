// Griha Pravesh package inclusions (Nov 2026). Prices are NOT changed.
//   npx tsx scripts/apply-grah-pravesh-packages.ts           # dry run
//   npx tsx scripts/apply-grah-pravesh-packages.ts --apply   # write
import mongoose from "mongoose";
import { config } from "dotenv";

config({ override: true });
const apply = process.argv.includes("--apply");

const STANDARD = [
  "1 verified, experienced pandit",
  "Shubh muhurat guidance for your date",
  "Gauri Ganesh Puja",
  "Kalash Sthapana",
  "Punyahavachan (purification of the home)",
  "Navgraha Puja",
  "Vastu Purush Puja",
  "Griha Pravesh Havan",
  "Dwar (main door) puja and entry rituals",
  "Aarti and prasad",
];

const PREMIUM = [
  "Everything in the 1-pandit package",
  "2 verified pandits — fuller mantra recitation",
  "Detailed Vastu Shanti Puja",
  "Navgraha Shanti with havan ahutis for all nine planets",
  "Satyanarayan Katha",
  "Extended havan",
  "More time for family rituals and questions (4–5 hours)",
];

const PACKAGES: Record<string, { features: string[]; panditCount: number }> = {
  "Griha Pravesh with Havan (1 Pandit)": { features: STANDARD, panditCount: 1 },
  "Griha Pravesh with Havan (2 Pandits)": { features: PREMIUM, panditCount: 2 },
};

await mongoose.connect(process.env.MONGODB_URI!);
const col = mongoose.connection.db!.collection("poojas");
const pooja = await col.findOne({ slug: "grah-pravesh-puja" });
if (!pooja) throw new Error("grah-pravesh-puja not found");
const packages = (pooja.packages ?? []).map((p: { name: string; price: number; features?: string[]; panditCount?: number }) => {
  const next = PACKAGES[p.name];
  if (!next) { console.log(`  = ${p.name} (₹${p.price}) not in the list, unchanged`); return p; }
  console.log(`${apply ? "APPLY" : "DRY  "} ${p.name} — ₹${p.price} (price unchanged): ${next.features.length} inclusions, ${next.panditCount} pandit(s)`);
  return { ...p, features: next.features, panditCount: next.panditCount };
});
if (apply) await col.updateOne({ _id: pooja._id }, { $set: { packages, updatedAt: new Date() } });
await mongoose.disconnect();
