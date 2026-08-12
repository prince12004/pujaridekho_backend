
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { ProductCategoryModel } from "../src/models/product-category.model.js";
import { ProductModel } from "../src/models/product.model.js";

const categories = [
  { name: "Puja Kits", slug: "puja-kits" },
  { name: "Incense & Dhoop", slug: "incense-dhoop" },
  { name: "Murti & Idols", slug: "murti-idols" },
  { name: "Sacred Books", slug: "sacred-books" },
  { name: "Yantra", slug: "yantra" },
  { name: "Rudraksha", slug: "rudraksha" },
  { name: "Mala & Japa Beads", slug: "mala-japa-beads" },
  { name: "Havan Samagri", slug: "havan-samagri" },
];

const productCategoryBySlug: Record<string, string> = {
  "puja-thali-set": "puja-kits",
  "panchmukhi-rudraksha-mala": "rudraksha",
  "brass-ganesh-murti": "murti-idols",
  "havan-kund-samagri": "havan-samagri",
  "sri-yantra-copper": "yantra",
  "sandalwood-dhoop-pack": "incense-dhoop",
  "panchpatra-achmani-set": "puja-kits",
  "cotton-wicks-pack": "incense-dhoop",
  "copper-kalash-coconut-stand": "puja-kits",
  "ashtagandha-chandan-pack": "incense-dhoop",
};

const obsoleteSlugs = ["rudraksha-and-mala", "idols-and-yantras", "incense-and-havan"];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected:", mongoose.connection.name);

  const slugToId = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of categories) {
    const doc = await ProductCategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: { ...cat, status: "Published" } },
      { upsert: true, new: true },
    );
    slugToId.set(cat.slug, doc._id);
  }

  for (const [productSlug, categorySlug] of Object.entries(productCategoryBySlug)) {
    await ProductModel.updateOne({ slug: productSlug }, { $set: { category: slugToId.get(categorySlug) } });
  }

  const removed = await ProductCategoryModel.deleteMany({ slug: { $in: obsoleteSlugs } });
  console.log("Removed obsolete categories:", removed.deletedCount);

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
