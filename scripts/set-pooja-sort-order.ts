/**
 * One-off: sets initial display order for the 11 production poojas, matching
 * the order they were originally specified in. Admins can change this anytime
 * via the "Display Order" field on the pooja edit page.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { PoojaModel } from "../src/models/pooja.model.js";

const ORDER = [
  "satyanarayan-katha",
  "rudrabhishek-pooja",
  "birthday-pooja",
  "grah-pravesh-pooja",
  "vahan-pujan",
  "office-shop-pooja",
  "navgrah-shanti-pooja",
  "annaprashan-sanskar",
  "sundarkand-path",
  "ganesh-sthapana-visarjan",
  "bhoomi-pujan",
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  for (let i = 0; i < ORDER.length; i++) {
    const res = await PoojaModel.updateOne({ slug: ORDER[i] }, { $set: { sortOrder: i + 1 } });
    console.log(`${ORDER[i]} -> sortOrder ${i + 1} (${res.modifiedCount ? "updated" : "no match"})`);
  }
  await mongoose.disconnect();
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
