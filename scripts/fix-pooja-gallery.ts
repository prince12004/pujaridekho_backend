/**
 * One-off fix: the initial content population accidentally duplicated each
 * pooja's hero image as gallery[0], which visually looked like a broken
 * gallery (same photo shown twice in a row). This pushes corrected,
 * distinct gallery arrays for the 9 already-seeded poojas.
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { PoojaModel } from "../src/models/pooja.model.js";

function unsplash(id: string, params = "w=1600&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

const IMG = {
  incenseSmoke: unsplash("1758903846845-e8ae224a5047"),
  marigold: unsplash("1574267498814-ebfb802ec01e"),
  holiColors: unsplash("1756661921244-35636963e096"),
  citySkyline: unsplash("1589829973523-e4ddcbbd40e7"),
  candleBrownHolder: unsplash("1605292356183-a77d0a9c9d1d"),
  bowlWoodenTable: unsplash("1602305361939-806b254e9f47"),
  threeCandlesBowl: unsplash("1636619773834-c7e0762ddfe1"),
  whiteRoundLight: unsplash("1605378229010-11aedbb01b24"),
  tealightCandle: unsplash("1575989762363-c7ce0137427a"),
  candleGroupTable: unsplash("1636737512034-518389c47764"),
  roundBowlCandle: unsplash("1551077095-ba46221b51ee"),
  candleGroup2: unsplash("1662720868850-e60cefb03201"),
  candleDarkTable: unsplash("1636266513371-acdf50931253"),
  candlesCircleFloor: unsplash("1635192592106-77a5aacbe1a3"),
  handHoldingCandle: unsplash("1700403455026-3559b076ff03"),
  scentedCandle: unsplash("1574266742257-41460b7992ee"),
  ganeshIdol: unsplash("1759674885815-14f62ee2802b"),
  brassBells: unsplash("1523613002-bbcd22be7f02"),
};

const galleryFixBySlug: Record<string, string[]> = {
  "satyanarayan-puja": [IMG.candleBrownHolder, IMG.bowlWoodenTable],
  "griha-pravesh": [IMG.threeCandlesBowl, IMG.handHoldingCandle],
  "vastu-shanti": [IMG.candleDarkTable, IMG.whiteRoundLight],
  "navgraha-shanti": [IMG.candleGroupTable, IMG.holiColors],
  "lakshmi-puja": [IMG.candleGroupTable, IMG.roundBowlCandle],
  "ganesh-puja": [IMG.threeCandlesBowl, IMG.brassBells],
  "marriage-puja": [IMG.candleBrownHolder, IMG.marigold],
  "vehicle-puja": [IMG.candleDarkTable, IMG.citySkyline],
  "office-puja": [IMG.candleGroup2, IMG.incenseSmoke],
};

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected:", mongoose.connection.name);

  for (const [slug, gallery] of Object.entries(galleryFixBySlug)) {
    const res = await PoojaModel.updateOne({ slug }, { $set: { gallery } });
    console.log(slug, "->", res.modifiedCount ? "updated" : "no match/no change");
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
