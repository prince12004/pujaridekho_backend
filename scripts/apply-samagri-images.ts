// Approved photo update (Nov 2026): samagri item photos, shop product photos,
// and two new shop products (Sindoor, Bhasam). The image files ship with the
// website (apps/web/public/samagri, apps/web/public/products), so run this only
// AFTER the website is deployed.
//
//   npx tsx scripts/apply-samagri-images.ts                 # dry run
//   npx tsx scripts/apply-samagri-images.ts --apply         # write
//   --base=https://pujaridekho.com (default) sets the image host.
import mongoose from "mongoose";
import { config } from "dotenv";

config({ override: true });
const apply = process.argv.includes("--apply");
const base = (process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] ?? "https://pujaridekho.com").replace(/\/$/, "");
const url = (path: string) => `${base}${path}`;
const log = (msg: string) => console.log(`${apply ? "APPLY" : "DRY  "} ${msg}`);

// Samagri item name (as in the kits) -> photo. Items not listed keep no photo.
const SAMAGRI: Record<string, string> = {
  "Agarbatti": "/samagri/agarbatti.jpg",
  "Akshat": "/samagri/akshat.jpg",
  "Bhang": "/samagri/bhang.jpg",
  "Brass Plate": "/samagri/brass-plate.jpg",
  "Chandan": "/samagri/chandan.jpg",
  "Cloves": "/samagri/cloves.jpg",
  "Cloves(laung)": "/samagri/cloves-laung.jpg",
  "Coconut": "/samagri/coconut.jpg",
  "Copper Kalash": "/samagri/copper-kalash.jpg",
  "Cotton Batti": "/samagri/cotton-batti.jpg",
  "Deepak": "/samagri/deepak.jpg",
  "Dhoop": "/samagri/dhoop.jpg",
  "Dona": "/samagri/dona.jpg",
  "Durva Grass": "/samagri/durva-grass.jpg",
  "Elaichi": "/samagri/elaichi.jpg",
  "Gangajal": "/samagri/gangajal.jpg",
  "Gari Gola/Dry Coconut": "/samagri/gari-gola-dry-coconut.jpg",
  "Guggal": "/samagri/guggal.jpg",
  "Guggul": "/samagri/guggul.jpg",
  "Haldi": "/samagri/haldi.jpg",
  "Havan Kund": "/samagri/havan-kund.jpg",
  "Havan Samagri Mix": "/samagri/havan-samagri-mix.jpg",
  "Hawan samagri": "/samagri/hawan-samagri.jpg",
  "Honey": "/samagri/honey.jpg",
  "Itr (Attar)": "/samagri/itr-attar.jpg",
  "Janeu": "/samagri/janeu.jpg",
  "Jau": "/samagri/jau.jpg",
  "Kalash": "/samagri/kalash.jpg",
  "Kalawa": "/samagri/kalawa.jpg",
  "Kapoor": "/samagri/kapoor.jpg",
  "Kapoor(Bheemsen)": "/samagri/kapoor-bheemsen.jpg",
  "Kumkum": "/samagri/kumkum.jpg",
  "Lal Cloth": "/samagri/lal-cloth.jpg",
  "Loban": "/samagri/loban.jpg",
  "Mango Leaves (Toran)": "/samagri/mango-leaves-toran.jpg",
  "Mango Wood": "/samagri/mango-wood.jpg",
  "Match Box": "/samagri/match-box.jpg",
  "Mishri": "/samagri/mishri.jpg",
  "Navgrah Samidha": "/samagri/navgrah-samidha.jpg",
  "Panchmewa": "/samagri/panchmewa.jpg",
  "Peela Cloth": "/samagri/peela-cloth.jpg",
  "Roli": "/samagri/roli.jpg",
  "Rudraksha mala": "/samagri/rudraksha-mala.jpg",
  "Samidha": "/samagri/samidha.jpg",
  "Sarson": "/samagri/sarson.jpg",
  "Shiv Vastra": "/samagri/shiv-vastra.jpg",
  "Supari": "/samagri/supari.jpg",
  "Til": "/samagri/til.jpg",
  "White Cloth": "/samagri/white-cloth.jpg",
  "Shubh-Labh Door Sticker Set": "/samagri/shubh-labh-door-sticker-set.jpg",
  "Hanuman Chalisa Book & Bhajan Kit": "/samagri/hanuman-chalisa-book-bhajan-kit.jpg",
  "Ganesh Visarjan Kit (Eco-Friendly)": "/samagri/ganesh-visarjan-kit-eco-friendly.jpg",
  "Baby's First Rice Ceremony Keepsake Set": "/samagri/baby-s-first-rice-ceremony-keepsake-set.jpg",
  "Additional Ritual Essentials": "/samagri/additional-ritual-essentials.jpg"
};

const PRODUCT_IMAGES: Record<string, string[]> = {
  "complete-hawan-samagri-kit-500g": ["/products/complete-hawan-samagri-kit.jpg"],
  "navgrah-samidha-pack": ["/products/navgrah-samidha-pack.jpg"],
  "loban-guggul-dhoop-cups": ["/products/loban-guggul-dhoop-cups.jpg"],
  "sundarkand-path-samagri-kit": ["/products/sundarkand-path-samagri-kit.jpg"],
  // Wikimedia Commons photos — credited on /image-credits
  "5-mukhi-rudraksha-mala-108-beads": ["/products/rudraksha-mala-108.jpg"],
  "original-5-mukhi-rudraksha-single-bead": ["/products/rudraksha-single-bead.jpg"],
};

const NEW_PRODUCTS = [
  {
    slug: "sindoor-hanuman-ji-chola",
    name: "Sindoor for Hanuman Ji Chola",
    sku: "PDK-SINDOOR-01",
    sellingPrice: 25,
    marketPrice: 25,
    images: ["/products/hanuman-sindoor.jpg", "/products/sindoor-balaji-chola.jpg"],
    shortDescription: "Orange sindoor for Hanuman Ji and Shri Balaji chola — 10 g.",
    description:
      "Traditional orange sindoor used to offer chola to Hanuman Ji and Shri Balaji, especially on Tuesdays and Saturdays. Mix with a little jasmine oil or ghee before applying. For worship use only. Net weight 10 g.",
    tags: ["sindoor", "hanuman"],
  },
  {
    slug: "bhasam",
    name: "Bhasam (Vibhuti)",
    sku: "PDK-BHASAM-01",
    sellingPrice: 30,
    marketPrice: 30,
    images: ["/products/bhasam.jpg"],
    shortDescription: "Sacred bhasam (vibhuti) for Shiv puja and tilak — 30 g.",
    description:
      "Sacred bhasam (vibhuti) used in Shiv puja, Rudrabhishek and for applying tilak. For external and worship use only. Net weight 30 g.",
    tags: ["bhasam", "vibhuti", "shiv-puja"],
  },
];

await mongoose.connect(process.env.MONGODB_URI!);
const db = mongoose.connection.db!;
console.log("image host:", base);

// 1. Samagri item photos (every kit that contains the item)
let itemUpdates = 0;
for (const t of await db.collection("samagritemplates").find({}).toArray()) {
  let changed = 0;
  const items = (t.includedItems ?? []).map((it: { itemName: string; image?: string }) => {
    const path = SAMAGRI[it.itemName];
    if (!path || it.image === url(path)) return it;
    changed++;
    return { ...it, image: url(path) };
  });
  if (!changed) continue;
  itemUpdates += changed;
  log(`${t.samagriTemplateName}: ${changed} item photo(s)`);
  if (apply) await db.collection("samagritemplates").updateOne({ _id: t._id }, { $set: { includedItems: items, updatedAt: new Date() } });
}
log(`samagri item photos: ${itemUpdates} in total`);

// 2. Shop product photos
for (const [slug, images] of Object.entries(PRODUCT_IMAGES)) {
  const p = await db.collection("products").findOne({ slug });
  if (!p) { console.log(`  ! product ${slug} not found`); continue; }
  log(`product ${p.name}: image -> ${images.map(url).join(", ")}`);
  if (apply) await db.collection("products").updateOne({ _id: p._id }, { $set: { images: images.map(url), updatedAt: new Date() } });
}

// 3. New shop products (skipped if the slug already exists)
const category = await db.collection("productcategories").findOne({ slug: "spiritual-accessories" });
if (!category) throw new Error("Category spiritual-accessories not found");
for (const np of NEW_PRODUCTS) {
  if (await db.collection("products").findOne({ slug: np.slug })) { console.log(`  = product ${np.slug} already exists, skipped`); continue; }
  log(`new product ${np.name} — ₹${np.sellingPrice} in ${category.name}`);
  if (apply) {
    const now = new Date();
    await db.collection("products").insertOne({
      ...np,
      images: np.images.map(url),
      category: category._id,
      featured: false,
      inStock: true,
      stockQuantity: 100,
      sortOrder: 0,
      status: "published",
      seo: { title: `${np.name} — Buy Online | PujariDekho`, description: np.shortDescription },
      createdAt: now,
      updatedAt: now,
      __v: 0,
    });
  }
}
await mongoose.disconnect();
