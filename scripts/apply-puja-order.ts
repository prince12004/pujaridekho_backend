// Puja display order (Nov 2026): fixed top 3, then by season and demand for
// Dec–Feb (Margashirsha/Paush Purnima, New Year, Makar Sankranti, Maha Shivratri).
//   npx tsx scripts/apply-puja-order.ts           # dry run
//   npx tsx scripts/apply-puja-order.ts --apply   # write
import mongoose from "mongoose";
import { config } from "dotenv";

config({ override: true });
const apply = process.argv.includes("--apply");

const ORDER = [
  "grah-pravesh-puja", //        requested #1
  "office-shop-puja", //         requested #2
  "bhoomi-pujan", //             requested #3
  "satyanarayan-katha", //       Purnima (24 Dec, 23 Jan), New Year — highest year-round demand
  "vahan-pujan", //              requested #5 — year-end and New Year vehicle purchases
  "sundarkand-path", //          weekly (Tue/Sat) demand, New Year paths
  "rudrabhishek-pooja", //       Maha Shivratri coming (Feb), Monday demand
  "navgrah-shanti-puja", //      start of the new year, Makar Sankranti (Sun enters Capricorn)
  "birthday-puja", //            year-round
  "annaprashan-sanskar", //      year-round sanskar
  "ganesh-sthapana-visarjan", // Ganesh Chaturthi is in September
  "diwali-office-puja", //       Diwali has passed (8 Nov 2026)
];

await mongoose.connect(process.env.MONGODB_URI!);
const col = mongoose.connection.db!.collection("poojas");
const all = await col.find({}).project({ slug: 1, sortOrder: 1 }).toArray();
const rest = all.filter((p) => !ORDER.includes(p.slug)).map((p) => p.slug);
for (const [i, slug] of [...ORDER, ...rest].entries()) {
  const p = all.find((x) => x.slug === slug);
  if (!p) { console.log(`  ! ${slug} not found`); continue; }
  console.log(`${apply ? "APPLY" : "DRY  "} ${String(i + 1).padStart(2)}. ${slug} (was ${p.sortOrder})`);
  if (apply) await col.updateOne({ _id: p._id }, { $set: { sortOrder: i + 1 } });
}
await mongoose.disconnect();
