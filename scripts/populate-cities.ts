/**
 * One-time content population — real, permanent City documents for the
 * core Delhi NCR service area (referenced throughout the site's copy but
 * never actually seeded into the database).
 * Idempotent: upserts by slug. Usage: pnpm exec tsx scripts/populate-cities.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { CityModel } from "../src/models/city.model.js";

const citiesData = [
  { name: "Delhi", slug: "delhi", state: "Delhi", sortOrder: 1 },
  { name: "Noida", slug: "noida", state: "Uttar Pradesh", sortOrder: 2 },
  { name: "Greater Noida", slug: "greater-noida", state: "Uttar Pradesh", sortOrder: 3 },
  { name: "Ghaziabad", slug: "ghaziabad", state: "Uttar Pradesh", sortOrder: 4 },
  { name: "Gurgaon", slug: "gurgaon", state: "Haryana", sortOrder: 5 },
  { name: "Faridabad", slug: "faridabad", state: "Haryana", sortOrder: 6 },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const data of citiesData) {
    const doc = await CityModel.findOneAndUpdate(
      { slug: data.slug },
      { ...data, isServiceable: true, status: "published" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Upserted city: ${doc.name}`);
  }

  console.log(`Done. ${citiesData.length} cities upserted.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
