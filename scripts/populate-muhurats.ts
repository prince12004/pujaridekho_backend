
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { MuhuratModel } from "../src/models/muhurat.model.js";
import { PoojaModel } from "../src/models/pooja.model.js";

const SLOTS = [
  { startTime: "07:00", endTime: "08:00" },
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "12:00", endTime: "13:00" },
  { startTime: "16:00", endTime: "17:00" },
];

const YEAR = 2026;
const MONTH = 8; // August

function daysInAugust() {
  const dates: Date[] = [];
  const last = new Date(YEAR, MONTH, 0).getDate(); // 31
  for (let day = 1; day <= last; day++) {
    dates.push(new Date(YEAR, MONTH - 1, day, 0, 0, 0, 0));
  }
  return dates;
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const poojas = await PoojaModel.find({ status: "published" }).select("_id name slug");
  console.log(`Found ${poojas.length} published poojas`);

  const dates = daysInAugust();
  let created = 0;
  let backfilled = 0;

  for (const pooja of poojas) {
    for (const date of dates) {
      const existing = await MuhuratModel.findOne({ pooja: pooja._id, date });
      if (!existing) {
        await MuhuratModel.create({
          pooja: pooja._id,
          date,
          slots: SLOTS.map((s) => ({ ...s, bookedCount: 0, isActive: true })),
          isActive: true,
        });
        created++;
        continue;
      }
      // Backfill any slot times introduced after this schedule was first created.
      const existingTimes = new Set(existing.slots.map((s) => s.startTime));
      const missing = SLOTS.filter((s) => !existingTimes.has(s.startTime));
      if (missing.length > 0) {
        for (const s of missing) existing.slots.push({ ...s, bookedCount: 0, isActive: true } as never);
        await existing.save();
        backfilled++;
      }
    }
    console.log(`Processed August muhurats for: ${pooja.name} (${pooja.slug})`);
  }

  console.log(`Done. ${created} new schedules created, ${backfilled} existing schedules backfilled with new slots, across ${poojas.length} poojas.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
