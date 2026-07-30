/**
 * One-time data fix: some Pooja/Festival/Product/Blog/City documents ended
 * up with a lowercase "published" status (likely from a raw DB restore/
 * import that bypassed Mongoose validation) instead of the "Published"
 * value every model's schema and every public-facing query actually
 * expects. Those documents were valid, complete, admin-visible content —
 * just invisible on the public site because of the casing mismatch.
 *
 * Idempotent: only touches documents whose status is the lowercase variant.
 *
 * Usage: pnpm exec tsx scripts/fix-status-casing.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { PoojaModel } from "../src/models/pooja.model.js";
import { FestivalModel } from "../src/models/festival.model.js";
import { ProductModel } from "../src/models/product.model.js";
import { BlogModel } from "../src/models/blog.model.js";
import { CityModel } from "../src/models/city.model.js";

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const targets = [
    { name: "Poojas", model: PoojaModel },
    { name: "Festivals", model: FestivalModel },
    { name: "Products", model: ProductModel },
    { name: "Blogs", model: BlogModel },
    { name: "Cities", model: CityModel },
  ];

  for (const { name, model } of targets) {
    const result = await model.updateMany({ status: "published" }, { $set: { status: "Published" } });
    console.log(`${name}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
