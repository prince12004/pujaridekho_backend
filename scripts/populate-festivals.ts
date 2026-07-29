/**
 * One-time content population script — inserts real, permanent Festival
 * documents into MongoDB (not seed-only demo data). Mirrors the same
 * quality/shape as scripts/populate-content.ts's pooja data.
 *
 * Festival dates for 2026 are best-estimate calendar dates (Hindu festivals
 * are tithi-based and can shift by a day depending on regional panchang) —
 * verify/adjust via Admin → Festival Poojas if needed.
 *
 * Idempotent: safe to re-run — upserts by slug, does not duplicate.
 *
 * Usage: pnpm exec tsx scripts/populate-festivals.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { FestivalModel } from "../src/models/festival.model.js";

function unsplash(id: string, params = "w=1600&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

const IMG = {
  incenseSmoke: unsplash("1758903846845-e8ae224a5047"),
  marigold: unsplash("1574267498814-ebfb802ec01e"),
  holiColors: unsplash("1756661921244-35636963e096"),
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

const CITIES = ["Delhi", "Noida", "Greater Noida", "Ghaziabad", "Gurgaon"];

function priceSamagri(name: string): number {
  const lower = name.toLowerCase();
  if (/(kalash|vessel|idol|murti|copper|brass|silver)/.test(lower)) return 350;
  if (/(havan|navratna|gems|kund)/.test(lower)) return 300;
  if (/(cloth|mala|yantra|coconut|chowki)/.test(lower)) return 200;
  if (/(ghee|milk|fruit|dry fruit|sweets|prasad)/.test(lower)) return 120;
  if (/(diya|wick|incense|colors|gulal)/.test(lower)) return 60;
  return 80;
}

function toSamagriItems(names: string[]) {
  return names.map((name) => ({ name, price: priceSamagri(name), includedByDefault: false }));
}

const commonFaq = [
  {
    question: "Is samagri included in the price?",
    answer:
      "Samagri is not bundled by default — on the festival page you can see the fixed pandit fee and separately choose exactly which samagri items you'd like us to arrange, each priced individually.",
  },
  {
    question: "Can I book a pandit for the same day?",
    answer: "Same-day booking is available in most of our serviceable cities, subject to pandit availability closer to the festival date.",
  },
];

const festivalsData = [
  {
    slug: "makar-sankranti-puja",
    name: "Makar Sankranti Puja",
    festivalDate: new Date("2026-01-14"),
    dateLabel: "14 January 2026",
    featuredImage: IMG.marigold,
    gallery: [IMG.bowlWoodenTable, IMG.brassBells],
    startingPrice: 2200,
    marketPrice: 2900,
    shortDescription: "A home puja marking the Sun's transition into Capricorn — thanksgiving, charity and the start of the harvest season.",
    fullDescription:
      "Makar Sankranti marks the Sun's entry into Makara Rashi (Capricorn) and the start of its northward journey (Uttarayan). Celebrated across India under different names — Pongal, Lohri, Uttarayan — the home puja focuses on Surya worship, gratitude for the harvest, and charity (daan) to the less fortunate.",
    benefits: [
      "Invokes Surya Dev's blessings for health, vitality and clarity of mind",
      "Marks an auspicious start to new ventures as Uttarayan begins",
      "Strengthens family bonds through shared prasad and charitable giving",
    ],
    importance:
      "Uttarayan is considered spiritually significant — the six months following Makar Sankranti are seen as favourable for auspicious ceremonies. The puja typically includes Surya Namaskar, til-gud (sesame-jaggery) offerings, and khichdi as prasad.",
    vidhiSteps: [
      { title: "Sankalpa", description: "The householder states the intention behind the Surya puja for the day." },
      { title: "Surya Puja", description: "Formal worship of Surya Dev with til, gud, and red flowers, facing the rising sun." },
      { title: "Havan", description: "A short havan is performed invoking Surya and Agni for health and prosperity." },
      { title: "Prasad & Daan", description: "Til-gud and khichdi prasad is distributed; charitable giving (daan) concludes the ritual." },
    ],
    samagri: toSamagriItems(["Til (sesame seeds) and gud (jaggery)", "Copper kalash", "Red flowers and akshat", "Ghee and cotton wicks", "Khichdi ingredients for prasad"]),
    packages: [
      { name: "Essential", price: 2200, duration: "1.5 hrs", features: ["Pandit ji", "Surya Puja", "Prasad for up to 10 people"] },
      { name: "Complete", price: 3100, duration: "2.5 hrs", features: ["Everything in Essential", "Havan included", "Prasad for up to 25 people"] },
    ],
    faq: commonFaq,
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "maha-shivratri-puja",
    name: "Maha Shivratri Puja",
    festivalDate: new Date("2026-02-15"),
    dateLabel: "15 February 2026",
    featuredImage: IMG.candleDarkTable,
    gallery: [IMG.threeCandlesBowl, IMG.whiteRoundLight],
    startingPrice: 2500,
    marketPrice: 3300,
    shortDescription: "A night-long home puja and Rudrabhishek dedicated to Lord Shiva, observed on the darkest night of the lunar month.",
    fullDescription:
      "Maha Shivratri commemorates the divine union of Shiva and Parvati and is observed with fasting, an all-night vigil, and Rudrabhishek — the ceremonial bathing of the Shivling with milk, water, honey and bael leaves. It's one of the most widely observed festivals for Shiva devotees across India.",
    benefits: [
      "Rudrabhishek is believed to remove obstacles and negative influences",
      "Fasting and the night vigil are considered a powerful spiritual discipline",
      "Invokes Shiva's blessings for inner peace and family well-being",
    ],
    importance:
      "Shastras describe Maha Shivratri as the night Shiva performed the cosmic dance of creation, preservation and destruction. Devotees observe a strict fast and chant the Maha Mrityunjaya Mantra through the night's four prahars.",
    vidhiSteps: [
      { title: "Sankalpa", description: "The vow to observe the Shivratri fast and puja is taken at sunrise." },
      { title: "Rudrabhishek", description: "The Shivling is bathed with milk, curd, honey, ghee and Gangajal amid Rudra chants." },
      { title: "Bilva Patra & Puja", description: "Bael (bilva) leaves, dhatura and white flowers are offered to Lord Shiva." },
      { title: "Night Vigil & Aarti", description: "Aarti is performed through the four prahars of the night, concluding with prasad at dawn." },
    ],
    samagri: toSamagriItems(["Bilva patra (bael leaves)", "Raw milk and Gangajal", "Dhatura and white flowers", "Rudraksha mala", "Ghee lamp and camphor"]),
    packages: [
      { name: "Essential", price: 2500, duration: "2 hrs", features: ["Pandit ji", "Rudrabhishek", "Prasad for up to 10 people"] },
      { name: "Complete", price: 3600, duration: "4 hrs", features: ["Everything in Essential", "Night-long vigil support", "Maha Mrityunjaya Havan"] },
    ],
    faq: commonFaq,
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "holi-puja",
    name: "Holi Puja & Holika Dahan",
    festivalDate: new Date("2026-03-03"),
    dateLabel: "3–4 March 2026",
    featuredImage: IMG.holiColors,
    gallery: [IMG.marigold, IMG.candleGroup2],
    startingPrice: 1800,
    marketPrice: 2400,
    shortDescription: "Holika Dahan puja on the eve of Holi, celebrating the triumph of devotion over evil through the legend of Prahlad.",
    fullDescription:
      "Holika Dahan is performed on the night before Holi, commemorating the legend of Prahlad and Holika — a celebration of good triumphing over evil. Families gather around a bonfire for the puja before the colour celebrations of Holi begin the next morning.",
    benefits: [
      "Symbolically burns away negativity and ill will from the year past",
      "Brings the family together for a joyous, communal ritual",
      "Considered auspicious for starting the new season with a clean slate",
    ],
    importance:
      "The Holika Dahan puja involves circling the bonfire, offering raw cotton thread, moong dal, and coconut into the fire while invoking Lord Vishnu's protection — mirroring the story of Prahlad's unwavering devotion.",
    vidhiSteps: [
      { title: "Sankalpa", description: "The family states their intent for the Holika Dahan puja at dusk." },
      { title: "Holika Puja", description: "The Holika effigy/bonfire site is worshipped with water, roli, and flowers." },
      { title: "Parikrama", description: "Family members circle the fire seven times, offering raw thread and grains." },
      { title: "Agni Pradakshina", description: "The bonfire is lit at an auspicious muhurat, concluding the ritual with prasad." },
    ],
    samagri: toSamagriItems(["Raw cotton thread (kacha soot)", "Moong dal and til", "Dried coconut and cow dung cakes", "Roli, akshat and flowers", "Gulal and colors for the next day"]),
    packages: [
      { name: "Essential", price: 1800, duration: "1 hr", features: ["Pandit ji", "Holika Puja", "Muhurat guidance for Dahan"] },
      { name: "Complete", price: 2600, duration: "1.5 hrs", features: ["Everything in Essential", "Narsimha/Vishnu Puja", "Prasad for up to 20 people"] },
    ],
    faq: commonFaq,
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "raksha-bandhan-puja",
    name: "Raksha Bandhan Puja",
    festivalDate: new Date("2026-08-28"),
    dateLabel: "28 August 2026",
    featuredImage: IMG.brassBells,
    gallery: [IMG.candleBrownHolder, IMG.roundBowlCandle],
    startingPrice: 1600,
    marketPrice: 2100,
    shortDescription: "A short home puja preceding the rakhi ceremony, invoking blessings for the bond between siblings.",
    fullDescription:
      "While Raksha Bandhan itself is a sibling ritual, many families invite a pandit for a brief puja beforehand to seek divine blessings for the family's health and protection before the rakhi-tying ceremony (Rakhi Bandhan).",
    benefits: [
      "Invokes protection and well-being for the entire family",
      "Adds a formal, auspicious start to the rakhi ceremony",
      "An opportunity for a short family puja alongside the sibling tradition",
    ],
    importance:
      "The puja typically includes a brief invocation to Lord Ganesh and the family's ishta devta (chosen deity), followed by an aarti — after which the rakhi-tying ceremony between siblings takes place.",
    vidhiSteps: [
      { title: "Sankalpa", description: "A short sankalpa is taken for the family's protection and well-being." },
      { title: "Ganesh Vandana", description: "Lord Ganesh is invoked first to remove obstacles." },
      { title: "Aarti", description: "A family aarti is performed before the rakhi ceremony begins." },
    ],
    samagri: toSamagriItems(["Rakhi thread and roli", "Rice (akshat) and sweets", "Diya and cotton wicks", "Fresh flowers"]),
    packages: [
      { name: "Essential", price: 1600, duration: "45 mins", features: ["Pandit ji", "Ganesh Vandana", "Family Aarti"] },
      { name: "Complete", price: 2300, duration: "1.5 hrs", features: ["Everything in Essential", "Satyanarayan Katha (short)", "Prasad for up to 15 people"] },
    ],
    faq: commonFaq,
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "krishna-janmashtami-puja",
    name: "Krishna Janmashtami Puja",
    festivalDate: new Date("2026-09-04"),
    dateLabel: "4 September 2026",
    featuredImage: IMG.tealightCandle,
    gallery: [IMG.candlesCircleFloor, IMG.handHoldingCandle],
    startingPrice: 2400,
    marketPrice: 3200,
    shortDescription: "A midnight puja celebrating the birth of Lord Krishna, with abhishek, jhulan (cradle) rituals and bhajans.",
    fullDescription:
      "Krishna Janmashtami celebrates the birth of Lord Krishna, traditionally observed with a day-long fast broken at midnight — the believed hour of his birth. The puja includes abhishek of the Bal Gopal idol, placing the deity in a decorated cradle (jhulan), and devotional singing.",
    benefits: [
      "Invokes Krishna's blessings for joy, wisdom and protection",
      "A meaningful family tradition, especially cherished by children",
      "The midnight puja is considered highly auspicious for new beginnings",
    ],
    importance:
      "The Bhagavata Purana describes Krishna's birth at midnight in Mathura. Devotees fast through the day, perform abhishek of the Bal Gopal murti at midnight with panchamrit, and sing bhajans before breaking the fast with prasad.",
    vidhiSteps: [
      { title: "Sankalpa & Fast", description: "The family observes a day-long fast with the sankalpa for Janmashtami." },
      { title: "Bal Gopal Abhishek", description: "The Bal Gopal idol is ceremonially bathed in panchamrit at midnight." },
      { title: "Jhulan (Cradle) Ritual", description: "The idol is dressed, decorated, and placed in a swing (jhulan)." },
      { title: "Bhajan & Prasad", description: "Devotional bhajans are sung, followed by aarti and prasad to break the fast." },
    ],
    samagri: toSamagriItems(["Bal Gopal idol/murti", "Panchamrit ingredients", "Cradle (jhulan) decorations", "Butter, makhana and sweets for prasad", "Tulsi leaves and flowers"]),
    packages: [
      { name: "Essential", price: 2400, duration: "2 hrs", features: ["Pandit ji", "Bal Gopal Abhishek", "Prasad for up to 15 people"] },
      { name: "Complete", price: 3500, duration: "3.5 hrs", features: ["Everything in Essential", "Jhulan decoration", "Bhajan sandhya support"] },
    ],
    faq: commonFaq,
    featured: false,
    sortOrder: 5,
  },
  {
    slug: "ganesh-chaturthi-puja",
    name: "Ganesh Chaturthi Puja",
    festivalDate: new Date("2026-09-14"),
    dateLabel: "14 September 2026",
    featuredImage: IMG.ganeshIdol,
    gallery: [IMG.marigold, IMG.incenseSmoke],
    startingPrice: 2600,
    marketPrice: 3400,
    shortDescription: "Ganpati Sthapana and daily aarti for the 10-day home celebration welcoming Lord Ganesh.",
    fullDescription:
      "Ganesh Chaturthi celebrates the birth of Lord Ganesh with the installation (sthapana) of a clay idol at home for anywhere from 1.5 to 10 days, with daily aarti, modak offerings and a Visarjan (immersion) ceremony marking the close of the festival.",
    benefits: [
      "Removes obstacles (Vighnaharta) and brings prosperity to the household",
      "A joyous, community-oriented festival bringing families together daily",
      "The Sthapana and Visarjan mark a complete, auspicious ritual cycle",
    ],
    importance:
      "Ganesh is invoked first in nearly all Hindu rituals as the remover of obstacles. The multi-day home celebration involves daily puja and aarti, culminating in Visarjan — the ceremonial immersion of the idol, symbolising the cycle of creation and dissolution.",
    vidhiSteps: [
      { title: "Ganpati Sthapana", description: "The clay Ganesh idol is ceremonially installed with pran pratishtha (invocation of life)." },
      { title: "Shodashopachara Puja", description: "16-step traditional worship offering flowers, durva grass, and modak." },
      { title: "Daily Aarti", description: "Morning and evening aarti is performed for the duration of the celebration." },
      { title: "Visarjan", description: "The idol is ceremonially immersed, concluding the festival with a farewell puja." },
    ],
    samagri: toSamagriItems(["Eco-friendly clay Ganesh idol", "Durva grass and red hibiscus", "Modak and coconut for prasad", "Ghee lamp and incense", "Decoration (mandap, flowers)"]),
    packages: [
      { name: "Essential", price: 2600, duration: "1.5 hrs", features: ["Pandit ji", "Sthapana Puja", "Prasad for up to 15 people"] },
      { name: "Complete", price: 4200, duration: "Full celebration", features: ["Sthapana + daily Aarti (up to 5 days)", "Visarjan Puja included", "Decoration guidance"] },
    ],
    faq: commonFaq,
    featured: true,
    sortOrder: 6,
  },
  {
    slug: "durga-puja-navratri",
    name: "Navratri & Durga Puja",
    festivalDate: new Date("2026-10-11"),
    dateLabel: "11–20 October 2026",
    featuredImage: IMG.candleGroupTable,
    gallery: [IMG.threeCandlesBowl, IMG.brassBells],
    startingPrice: 3000,
    marketPrice: 4000,
    shortDescription: "Nine nights of Navratri puja honouring the nine forms of Goddess Durga, from Kalash Sthapana to Dussehra.",
    fullDescription:
      "Sharad Navratri spans nine nights dedicated to the nine forms of Goddess Durga (Navadurga), beginning with Kalash Sthapana and Akhand Jyoti, and concluding with Durga Visarjan and Dussehra — celebrating the victory of good over evil.",
    benefits: [
      "Invokes Durga's protection, strength and removal of negative energies",
      "The nine-night observance is considered deeply purifying and auspicious",
      "Kanya Puja on Ashtami/Navami is a cherished family tradition",
    ],
    importance:
      "Each of the nine nights is dedicated to a different form of Durga. The festival culminates on Vijayadashami (Dussehra), commemorating both Durga's victory over Mahishasura and Lord Rama's victory over Ravana.",
    vidhiSteps: [
      { title: "Kalash Sthapana", description: "A sacred kalash is installed and an Akhand Jyoti (unbroken lamp) is lit for nine days." },
      { title: "Navadurga Puja", description: "Each night, one of the nine forms of Durga is invoked and worshipped." },
      { title: "Kanya Puja", description: "On Ashtami or Navami, young girls are honoured as living forms of the Goddess." },
      { title: "Durga Visarjan", description: "The festival concludes with Vijayadashami puja and immersion rituals." },
    ],
    samagri: toSamagriItems(["Kalash and akhand jyoti oil", "Navadurga idol/photo set", "Red chunri and bangles", "Coconut and mango leaves", "Kanya Puja gifts and prasad"]),
    packages: [
      { name: "Essential", price: 3000, duration: "1.5 hrs/day", features: ["Pandit ji for Kalash Sthapana", "Daily Aarti guidance", "Prasad for up to 15 people"] },
      { name: "Complete", price: 5200, duration: "9 nights", features: ["Full 9-night Navadurga Puja", "Kanya Puja on Ashtami", "Visarjan & Dussehra Puja"] },
    ],
    faq: commonFaq,
    featured: true,
    sortOrder: 7,
  },
  {
    slug: "diwali-lakshmi-puja",
    name: "Diwali — Lakshmi Ganesh Puja",
    festivalDate: new Date("2026-11-08"),
    dateLabel: "8 November 2026",
    featuredImage: IMG.candleGroup2,
    gallery: [IMG.tealightCandle, IMG.whiteRoundLight],
    startingPrice: 3200,
    marketPrice: 4200,
    shortDescription: "The most-booked home puja of the year — Lakshmi Ganesh Puja on Diwali night, inviting wealth and prosperity home.",
    fullDescription:
      "Diwali's central ritual is the Lakshmi Ganesh Puja, performed at homes and businesses on Amavasya night to welcome Goddess Lakshmi (wealth and prosperity) and Lord Ganesh (wisdom, new beginnings) into the household for the year ahead.",
    benefits: [
      "Invites prosperity, abundance and good fortune into the home for the year ahead",
      "One of the most auspicious nights of the year for new beginnings",
      "A cherished family tradition bringing everyone together for aarti",
    ],
    importance:
      "Performed at an auspicious muhurat on Amavasya (new moon) night, the puja includes invoking Ganesh first, then Lakshmi, along with Kubera (the treasurer of wealth) — accompanied by diyas lit throughout the home.",
    vidhiSteps: [
      { title: "Sankalpa & Ganesh Puja", description: "Lord Ganesh is invoked first to remove obstacles before Lakshmi Puja begins." },
      { title: "Lakshmi Avahan", description: "Goddess Lakshmi is ceremonially invited and worshipped with lotus flowers and coins." },
      { title: "Kubera & Chopda Puja", description: "For business owners, account books (chopda) and cash boxes are also worshipped." },
      { title: "Aarti & Diya Lighting", description: "The puja concludes with aarti and lighting diyas throughout the home." },
    ],
    samagri: toSamagriItems(["Lakshmi-Ganesh idol/photo set", "Lotus flowers and gold/silver coins", "Diyas, cotton wicks and ghee", "Kumkum, akshat and sweets", "Rangoli colors"]),
    packages: [
      { name: "Essential", price: 3200, duration: "1.5 hrs", features: ["Pandit ji", "Lakshmi Ganesh Puja", "Muhurat guidance"] },
      { name: "Complete", price: 4800, duration: "2.5 hrs", features: ["Everything in Essential", "Kubera & Chopda Puja", "Havan included"] },
    ],
    faq: commonFaq,
    featured: true,
    sortOrder: 8,
  },
  {
    slug: "chhath-puja",
    name: "Chhath Puja",
    festivalDate: new Date("2026-11-15"),
    dateLabel: "15–16 November 2026",
    featuredImage: IMG.roundBowlCandle,
    gallery: [IMG.candleDarkTable, IMG.candlesCircleFloor],
    startingPrice: 2000,
    marketPrice: 2600,
    shortDescription: "Guidance and puja support for the rigorous four-day Chhath fast, honouring Surya Dev at sunset and sunrise.",
    fullDescription:
      "Chhath Puja is a four-day festival of thanksgiving to Surya Dev (the Sun God) and Chhathi Maiya, involving a strict fast (Nirjala Vrat) and ritual offerings (Arghya) made while standing in water at sunset and the following sunrise.",
    benefits: [
      "Deeply revered for health, longevity and family well-being",
      "The sunrise Arghya is considered one of the most powerful blessings of the year",
      "A profound spiritual discipline observed with the whole family's support",
    ],
    importance:
      "Unlike most festivals, Chhath has no idol worship — Surya is worshipped directly. The rites span four days: Nahay Khay, Kharna, Sandhya Arghya (evening offering), and Usha Arghya (morning offering) at a riverbank or water body.",
    vidhiSteps: [
      { title: "Nahay Khay", description: "The observer bathes and eats a single sattvic meal to begin the fast." },
      { title: "Kharna", description: "A day-long fast is broken at sunset with kheer and roti offered to the family." },
      { title: "Sandhya Arghya", description: "Offerings are made to the setting sun while standing in water at dusk." },
      { title: "Usha Arghya", description: "The fast concludes the next dawn with offerings to the rising sun." },
    ],
    samagri: toSamagriItems(["Bamboo baskets (soop) and daura", "Thekua and seasonal fruits", "Sugarcane and coconut", "Diya, wicks and vermilion", "Puja thali set"]),
    packages: [
      { name: "Essential", price: 2000, duration: "Guidance + evening support", features: ["Puja guidance", "Sandhya Arghya support", "Prasad arrangement"] },
      { name: "Complete", price: 2900, duration: "Full 4-day support", features: ["Everything in Essential", "Usha Arghya support", "Ghat/riverside logistics help"] },
    ],
    faq: commonFaq,
    featured: false,
    sortOrder: 9,
  },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  for (const data of festivalsData) {
    const { faq, ...rest } = data;
    const doc = await FestivalModel.findOneAndUpdate(
      { slug: data.slug },
      {
        ...rest,
        faq,
        citiesAvailable: CITIES,
        status: "published",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Upserted festival: ${doc.name} (${doc.slug})`);
  }

  console.log(`Done. ${festivalsData.length} festivals upserted.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
