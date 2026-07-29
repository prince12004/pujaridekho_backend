/**
 * One-time content population — real, permanent Testimonial documents.
 * Idempotent: matches by name+quote, safe to re-run.
 * Usage: pnpm exec tsx scripts/populate-testimonials.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { TestimonialModel } from "../src/models/testimonial.model.js";

const testimonialsData = [
  {
    name: "Ritika Malhotra",
    location: "Noida",
    rating: 5,
    quote:
      "Booked a Griha Pravesh puja for our new flat — the pandit ji arrived on time, carried all the samagri himself and explained every step in simple Hindi for the family. Genuinely stress-free.",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Sanjay Verma",
    location: "Gurgaon",
    rating: 5,
    quote:
      "Fixed pricing was the biggest relief — no last-minute demands for extra dakshina like we've faced before. The Satyanarayan Katha was performed properly and the prasad was ready on time.",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Anjali Sharma",
    location: "Delhi",
    rating: 4,
    quote:
      "Used PujariDekho for my son's Vehicle Puja before he took delivery of his new car. Booking on the app took two minutes and the pandit reached within the promised window.",
    featured: true,
    sortOrder: 3,
  },
  {
    name: "Deepak Chaudhary",
    location: "Greater Noida",
    rating: 5,
    quote:
      "We've done three poojas through PujariDekho now — Vastu Shanti, Navgraha Shanti and Ganesh Puja for Chaturthi. Same reliability every single time, which is rare.",
    featured: false,
    sortOrder: 4,
  },
  {
    name: "Priya Nair",
    location: "Ghaziabad",
    rating: 5,
    quote:
      "The kundli feature helped us pick a proper muhurat before booking our office opening puja. Everything from the panchang to the actual pandit visit lined up perfectly.",
    featured: true,
    sortOrder: 5,
  },
  {
    name: "Rohit Aggarwal",
    location: "Faridabad",
    rating: 4,
    quote:
      "Customer support responded quickly on WhatsApp when I needed to reschedule our Lakshmi Puja by a day. No extra charges, no hassle.",
    featured: false,
    sortOrder: 6,
  },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const data of testimonialsData) {
    const doc = await TestimonialModel.findOneAndUpdate(
      { name: data.name, quote: data.quote },
      { ...data, status: "published" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Upserted testimonial: ${doc.name}`);
  }

  console.log(`Done. ${testimonialsData.length} testimonials upserted.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
