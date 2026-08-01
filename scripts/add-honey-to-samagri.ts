/**
 * One-off: adds "Honey" as a Pujari-Dekho-included samagri item to every
 * pooja's samagri template (previously it was only ever in the customer's
 * own "arrange yourself" list for a couple of poojas). Removes it from
 * customerArrangeItems wherever present to avoid the contradiction of an
 * item being both included and customer-arranged. Bumps the linked
 * Product's sellingPrice/marketPrice by the same amount so the shop kit
 * price still reflects what's actually in the box. Idempotent.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { SamagriTemplateModel } from "../src/models/samagri-template.model.js";
import { ProductModel } from "../src/models/product.model.js";
import "../src/models/pooja.model.js";

const HONEY_PRICE = 60; // 100ml

// Poojas aren't linked to shop products by a DB foreign key — only by the
// naming convention set up in migrate-production-catalog.ts. Mirrored here.
const POOJA_TO_PRODUCT_SLUGS: Record<string, string[]> = {
  "satyanarayan-katha": ["satyanarayan-katha-samagri-kit"],
  "rudrabhishek-pooja": ["rudrabhishek-samagri-kit"],
  "birthday-pooja": ["birthday-pooja-samagri-kit"],
  "grah-pravesh-pooja": ["grah-pravesh-samagri-kit"],
  "vahan-pujan": ["vehicle-pujan-samagri-kit"],
  "office-shop-pooja": ["office-pooja-samagri-kit", "shop-pooja-samagri-kit"],
  "navgrah-shanti-pooja": ["navgrah-shanti-samagri-kit"],
  "annaprashan-sanskar": ["annaprashan-sanskar-samagri-kit"],
  "sundarkand-path": ["sundarkand-path-samagri-kit", "sundarkand-havan-samagri-kit"],
  "ganesh-sthapana-visarjan": ["ganesh-sthapana-samagri-kit", "ganesh-visarjan-samagri-kit"],
  "bhoomi-pujan": ["bhoomi-pujan-samagri-kit"],
};

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected:", mongoose.connection.name);

  const templates = await SamagriTemplateModel.find().populate("pooja", "name slug");

  for (const template of templates) {
    const pooja = template.pooja as unknown as { name: string; slug: string };

    if (template.includedItems.some((i) => i.itemName === "Honey")) {
      console.log(`  SKIP ${pooja.name} — Honey already included`);
      continue;
    }

    template.includedItems.push({
      itemName: "Honey",
      quantity: "100",
      unit: "ml",
      estimatedPrice: HONEY_PRICE,
      category: "Offerings",
      arrangedBy: "PujariDekho",
      required: true,
    });

    const removedFromCustomerList = template.customerArrangeItems.includes("Honey" as never);
    template.customerArrangeItems = template.customerArrangeItems.filter((i) => i !== "Honey") as typeof template.customerArrangeItems;

    const oldTotal = template.estimatedSamagriCost;
    template.estimatedSamagriCost = template.includedItems.reduce((sum, i) => sum + i.estimatedPrice, 0);
    await template.save();

    const productSlugs = POOJA_TO_PRODUCT_SLUGS[pooja.slug] ?? [];
    const updatedProducts: string[] = [];
    for (const slug of productSlugs) {
      const product = await ProductModel.findOne({ slug });
      if (!product) continue;
      product.sellingPrice += HONEY_PRICE;
      if (product.marketPrice) product.marketPrice += HONEY_PRICE;
      await product.save();
      updatedProducts.push(`${slug} -> ₹${product.sellingPrice}`);
    }

    console.log(
      `  ${pooja.name}: +Honey ₹${HONEY_PRICE}, total ₹${oldTotal} -> ₹${template.estimatedSamagriCost}` +
        `${removedFromCustomerList ? " (removed from customer-arrange list)" : ""}` +
        `${updatedProducts.length ? `, products: ${updatedProducts.join(", ")}` : ""}`,
    );
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
