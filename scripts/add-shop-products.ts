/**
 * Adds real standalone shop products under the Incense & Dhoop, Rudraksha,
 * and Hawan Samagri categories (created empty by the earlier catalog
 * migration, since only samagri kits were specified there). Idempotent —
 * upserts by slug, safe to re-run.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { ProductModel } from "../src/models/product.model.js";
import { ProductCategoryModel } from "../src/models/product-category.model.js";

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;
}

const IMG = {
  incenseSmoke: unsplash("1758903846845-e8ae224a5047"),
  rudrakshaBeads: unsplash("1685419367862-1dd40253bf2b"),
  havanFireRitual: unsplash("1764173517657-0e7d94d94a4b"),
};

interface ProductSeed {
  slug: string;
  name: string;
  sku: string;
  categorySlug: string;
  sellingPrice: number;
  marketPrice: number;
  shortDescription: string;
  description: string;
  image: string;
}

const PRODUCTS: ProductSeed[] = [
  {
    slug: "premium-dhoop-batti-pack",
    name: "Premium Dhoop Batti Pack",
    sku: "PDK-DHOOP-01",
    categorySlug: "incense-dhoop",
    sellingPrice: 149,
    marketPrice: 179,
    shortDescription: "Temple-grade dhoop batti with a rich, long-lasting fragrance for daily puja.",
    description: "A pack of premium dhoop batti made with natural resins and fragrant oils, perfect for daily aarti and puja. Long burn time with a rich, temple-like aroma.",
    image: IMG.incenseSmoke,
  },
  {
    slug: "sandalwood-agarbatti-pack",
    name: "Sandalwood Agarbatti Pack",
    sku: "PDK-AGAR-01",
    categorySlug: "incense-dhoop",
    sellingPrice: 99,
    marketPrice: 119,
    shortDescription: "Classic sandalwood-scented incense sticks for a calm, sacred atmosphere.",
    description: "Hand-rolled sandalwood agarbatti with a smooth, long-lasting fragrance. Ideal for daily puja, meditation, and creating a calm, sacred atmosphere at home.",
    image: IMG.incenseSmoke,
  },
  {
    slug: "loban-guggul-dhoop-cups",
    name: "Loban & Guggul Dhoop Cups",
    sku: "PDK-DHOOP-02",
    categorySlug: "incense-dhoop",
    sellingPrice: 129,
    marketPrice: 149,
    shortDescription: "Ready-to-light loban and guggul dhoop cups — no charcoal needed.",
    description: "Convenient self-igniting dhoop cups made with pure loban and guggul. No charcoal needed — just light and place for an instant, powerful fragrance during havan or daily puja.",
    image: IMG.incenseSmoke,
  },
  {
    slug: "5-mukhi-rudraksha-mala-108-beads",
    name: "5 Mukhi Rudraksha Mala (108 Beads)",
    sku: "PDK-RUDR-01",
    categorySlug: "rudraksha",
    sellingPrice: 499,
    marketPrice: 649,
    shortDescription: "Authentic 5 Mukhi Rudraksha mala with 108 beads, ideal for daily japa.",
    description: "A genuine 5 Mukhi Rudraksha mala strung with 108 beads on a durable thread, traditionally worn or used for daily mantra japa. Associated with Lord Shiva and believed to bring calm and focus.",
    image: IMG.rudrakshaBeads,
  },
  {
    slug: "original-5-mukhi-rudraksha-single-bead",
    name: "Original 5 Mukhi Rudraksha (Single Bead)",
    sku: "PDK-RUDR-02",
    categorySlug: "rudraksha",
    sellingPrice: 149,
    marketPrice: 199,
    shortDescription: "A single authentic 5 Mukhi Rudraksha bead, ideal for pendants or personal wear.",
    description: "A single genuine 5 Mukhi Rudraksha bead, lab-verified for authenticity. Can be worn as a pendant or added to your own mala.",
    image: IMG.rudrakshaBeads,
  },
  {
    slug: "rudraksha-bracelet",
    name: "Rudraksha Bracelet",
    sku: "PDK-RUDR-03",
    categorySlug: "rudraksha",
    sellingPrice: 299,
    marketPrice: 379,
    shortDescription: "An elastic Rudraksha bead bracelet for everyday wear.",
    description: "A comfortable, elastic bracelet strung with authentic Rudraksha beads — easy to wear every day for spiritual protection and calm.",
    image: IMG.rudrakshaBeads,
  },
  {
    slug: "complete-hawan-samagri-kit-500g",
    name: "Complete Hawan Samagri Kit (500g)",
    sku: "PDK-HAVAN-01",
    categorySlug: "hawan-samagri",
    sellingPrice: 249,
    marketPrice: 299,
    shortDescription: "A ready-to-use 500g hawan samagri mix with all essential havan ingredients.",
    description: "A complete 500g hawan samagri mix containing herbs, wood chips, ghee-soaked cotton, guggul and other traditional ingredients — everything you need for a standard havan.",
    image: IMG.havanFireRitual,
  },
  {
    slug: "havan-kund-portable-copper-coated",
    name: "Havan Kund (Portable, Copper-Coated)",
    sku: "PDK-HAVAN-02",
    categorySlug: "hawan-samagri",
    sellingPrice: 399,
    marketPrice: 499,
    shortDescription: "A sturdy, copper-coated portable havan kund for home rituals.",
    description: "A durable, copper-coated portable havan kund sized for home use — easy to set up and clean, suitable for regular havan and puja rituals.",
    image: IMG.havanFireRitual,
  },
  {
    slug: "navgrah-samidha-pack",
    name: "Navgrah Samidha Pack",
    sku: "PDK-HAVAN-03",
    categorySlug: "hawan-samagri",
    sellingPrice: 199,
    marketPrice: 249,
    shortDescription: "Nine sacred woods for Navgrah havan, one for each planetary deity.",
    description: "A curated pack of nine sacred samidha woods, one for each of the Navgrah (nine planetary deities) — used specifically in Navgrah Shanti havan and similar rituals.",
    image: IMG.havanFireRitual,
  },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected:", mongoose.connection.name);

  for (const seed of PRODUCTS) {
    const category = await ProductCategoryModel.findOne({ slug: seed.categorySlug });
    if (!category) {
      console.log(`  SKIP ${seed.name} — category "${seed.categorySlug}" not found`);
      continue;
    }
    await ProductModel.findOneAndUpdate(
      { slug: seed.slug },
      {
        name: seed.name,
        slug: seed.slug,
        category: category._id,
        shortDescription: seed.shortDescription,
        description: seed.description,
        images: [seed.image],
        sku: seed.sku,
        sellingPrice: seed.sellingPrice,
        marketPrice: seed.marketPrice,
        stockQuantity: 100,
        inStock: true,
        tags: [seed.categorySlug],
        featured: false,
        status: "Published",
        seo: { title: `${seed.name} — Buy Online | PujariDekho`, description: seed.shortDescription },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  product: ${seed.name} (₹${seed.sellingPrice}) -> ${seed.categorySlug}`);
  }

  console.log(`\nDone. Created/updated ${PRODUCTS.length} products.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
