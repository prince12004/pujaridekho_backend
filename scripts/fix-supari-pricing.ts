
import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { SamagriTemplateModel } from "../src/models/samagri-template.model.js";
import "../src/models/pooja.model.js";

const NEW_SUPARI_TOTAL = 80; // 20 pcs @ ₹4

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected:", mongoose.connection.name);

  const templates = await SamagriTemplateModel.find().populate("pooja", "name");

  for (const template of templates) {
    const supari = template.includedItems.find((i) => i.itemName === "Supari");
    if (!supari) continue;
    if (supari.estimatedPrice === NEW_SUPARI_TOTAL) {
      console.log(`  SKIP ${(template.pooja as unknown as { name: string })?.name} — already ₹${NEW_SUPARI_TOTAL}`);
      continue;
    }

    const delta = NEW_SUPARI_TOTAL - supari.estimatedPrice;
    const oldSupariPrice = supari.estimatedPrice;
    const before = template.estimatedSamagriCost;

    supari.quantity = "20";
    supari.unit = "pcs";
    supari.estimatedPrice = NEW_SUPARI_TOTAL;

    // Absorb the delta so the template's total is unchanged: prefer Brass
    // Plate (has headroom in every template that has it), else the
    // "Special Items" filler item.
    const absorber =
      template.includedItems.find((i) => i.itemName === "Brass Plate") ??
      template.includedItems.find((i) => i.category === "Special Items" && i.itemName !== "Supari");

    if (!absorber) {
      console.log(`  WARN ${(template.pooja as unknown as { name: string })?.name} — no absorber item found, total will shift by ₹${delta}`);
    } else {
      absorber.estimatedPrice -= delta;
    }

    template.estimatedSamagriCost = template.includedItems.reduce((sum, i) => sum + i.estimatedPrice, 0);
    await template.save();

    const name = (template.pooja as unknown as { name: string })?.name ?? String(template.pooja);
    console.log(
      `  ${name}: Supari ₹${oldSupariPrice} -> ₹${NEW_SUPARI_TOTAL} (20pcs @ ₹4), ` +
        `${absorber ? `${absorber.itemName} adjusted by -₹${delta}` : "no absorber"}, total ₹${before} -> ₹${template.estimatedSamagriCost}`,
    );
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
