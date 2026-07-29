/**
 * One-time content population script — inserts real, permanent documents
 * into MongoDB (not seed-only demo data kept out of the DB). Content is
 * migrated from the site's original hardcoded showcase copy so quality
 * matches what was already written, now backed by real Pooja/Pandit/
 * Product/Blog collections that the Admin Panel manages going forward.
 *
 * Idempotent: safe to re-run — upserts by slug/name, does not duplicate.
 *
 * Usage: pnpm exec tsx scripts/populate-content.ts
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { PoojaCategoryModel } from "../src/models/pooja-category.model.js";
import { PoojaModel } from "../src/models/pooja.model.js";
import { PanditModel } from "../src/models/pandit.model.js";
import { ProductCategoryModel } from "../src/models/product-category.model.js";
import { ProductModel } from "../src/models/product.model.js";
import { BlogCategoryModel } from "../src/models/blog-category.model.js";
import { BlogModel } from "../src/models/blog.model.js";

function unsplash(id: string, params = "w=1600&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

const IMG = {
  incenseSmoke: unsplash("1758903846845-e8ae224a5047"),
  marigold: unsplash("1574267498814-ebfb802ec01e"),
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

const PORTRAIT = [
  unsplash("1507003211169-0a1dd7228f2d", "w=600&h=600&auto=format&fit=crop"),
  unsplash("1500648767791-00dcc994a43e", "w=600&h=600&auto=format&fit=crop"),
  unsplash("1519345182560-3f2917c472ef", "w=600&h=600&auto=format&fit=crop"),
  unsplash("1506794778202-cad84cf45f1d", "w=600&h=600&auto=format&fit=crop"),
  unsplash("1552058544-f2b08422138a", "w=600&h=600&auto=format&fit=crop"),
  unsplash("1560250097-0b93528c311a", "w=600&h=600&auto=format&fit=crop"),
];

const defaultFaqExtra = [
  {
    question: "Is samagri really included, or do I need to buy anything?",
    answer:
      "Samagri is not bundled into the price by default — on the pooja page you can see the price with and without samagri, and select exactly which items you'd like us to arrange.",
  },
  {
    question: "What if I need to reschedule?",
    answer: "Free rescheduling up to 24 hours before the scheduled time, per our Refund Policy.",
  },
];

function priceSamagri(name: string): number {
  const lower = name.toLowerCase();
  if (/(kalash|vessel|idol|murti|copper|brass)/.test(lower)) return 350;
  if (/(havan|navratna|gems)/.test(lower)) return 300;
  if (/(cloth|mala|yantra|coconut)/.test(lower)) return 200;
  if (/(ghee|milk|fruit|dry fruit)/.test(lower)) return 120;
  if (/(diya|wick|incense)/.test(lower)) return 60;
  return 80;
}

function toSamagriItems(names: string[]) {
  return names.map((name) => ({ name, price: priceSamagri(name), includedByDefault: false }));
}

const poojaCategoriesData = [
  { name: "Home Poojas", slug: "home-poojas" },
  { name: "Griha Pravesh & Vastu", slug: "griha-pravesh-and-vastu" },
  { name: "Astrology & Graha Shanti", slug: "astrology-and-graha-shanti" },
  { name: "Wealth & Prosperity", slug: "wealth-and-prosperity" },
  { name: "Ganpati Poojas", slug: "ganpati-poojas" },
  { name: "Marriage & Life Events", slug: "marriage-and-life-events" },
  { name: "Vehicle & Business", slug: "vehicle-and-business" },
];

const poojasData = [
  {
    slug: "satyanarayan-puja",
    name: "Satyanarayan Puja",
    category: "home-poojas",
    duration: "2–3 hrs",
    startingPrice: 2100,
    marketPrice: 2800,
    featuredImage: IMG.roundBowlCandle,
    gallery: [IMG.candleBrownHolder, IMG.bowlWoodenTable],
    overview:
      'Satyanarayan Puja honours Lord Vishnu in his form as Satyanarayan — "the embodiment of truth." It\'s one of the most frequently performed home poojas, typically done on full moon days or to mark a happy occasion, resolve a difficulty, or simply as a periodic act of gratitude.',
    benefits: [
      "Invokes prosperity, harmony and truthfulness within the household",
      "Traditionally performed to mark the successful completion of an important task",
      "Strengthens family bonds through a shared ritual and the Satyanarayan Katha (story)",
    ],
    importance:
      "The puja is centred around the Satyanarayan Katha, a story illustrating the rewards of truth and devotion, and the consequences of breaking a vow made to the divine. It's considered auspicious enough to be repeated at any life stage.",
    whoShouldPerform:
      "Any householder can sponsor this puja — no specific eligibility is required. It's commonly performed by the head of the family, with the full household present for the katha and prasad.",
    samagri: ["Panchamrit (milk, curd, honey, ghee, sugar) and fresh fruits", "Banana leaves/stalks for the mandap", "Turmeric, kumkum, akshat and betel nuts", "Ghee, cotton wicks and a brass diya", "Wheat flour and jaggery for the prasad (sheera)"],
    vidhiSteps: [
      { title: "Sankalpa", description: "The householder takes a formal vow (sankalpa) stating the intention behind the puja." },
      { title: "Ganesh & Kalash Puja", description: "Lord Ganesh is invoked first, followed by installation and worship of the kalash." },
      { title: "Satyanarayan Katha", description: "The pandit narrates the five chapters of the Satyanarayan Katha aloud to those present." },
      { title: "Aarti & Prasad", description: "The puja concludes with aarti and distribution of the sheera prasad to all attendees." },
    ],
    packages: [
      { name: "Essential", price: 2100, duration: "2 hrs", features: ["Pandit ji", "Satyanarayan Katha", "Prasad for up to 10 people"] },
      { name: "Complete", price: 3200, duration: "3 hrs", features: ["Everything in Essential", "Havan included", "Prasad for up to 25 people"] },
    ],
    faq: [{ question: "Can this puja be done in the evening?", answer: "Yes, it's commonly performed in the evening, especially on Purnima (full moon)." }, ...defaultFaqExtra],
    featured: true,
    popular: true,
  },
  {
    slug: "griha-pravesh",
    name: "Griha Pravesh Puja",
    category: "griha-pravesh-and-vastu",
    duration: "3–4 hrs",
    startingPrice: 3500,
    marketPrice: 4500,
    featuredImage: IMG.candlesCircleFloor,
    gallery: [IMG.threeCandlesBowl, IMG.handHoldingCandle],
    overview:
      'Griha Pravesh — "entering the house" — is the ceremony performed before a family moves into a new home. It invokes Vastu Purusha, neutralises residual negative energy from construction, and sets an auspicious tone for the years ahead.',
    benefits: [
      "Ritually purifies and consecrates a new or previously-owned home before you move in",
      "Pacifies Vastu Purusha, the presiding energy of the dwelling",
      "Marks a clear, auspicious beginning for the household in its new home",
    ],
    importance:
      "There are three recognised types — Apoorva (a newly built home, first entry), Sapoorva (returning after a long absence) and Dwandwah (a previously-owned home) — each with small variations your pandit will confirm at booking.",
    whoShouldPerform:
      "The family moving into the home should be present throughout, particularly the head of household and whoever will cross the threshold first (traditionally the woman of the house, carrying a kalash).",
    samagri: ["Kalash, coconut, mango leaves and a copper vessel", "Raw rice, turmeric, kumkum and akshat", "Ghee, cotton wicks and a brass diya", "Fresh milk for the traditional boiling-over ritual", "Havan samagri and a Ganesh idol for sthapana"],
    vidhiSteps: [
      { title: "Ganesh Puja", description: "Removes obstacles before the main ceremony begins." },
      { title: "Vastu Shanti Puja", description: "Invokes and pacifies Vastu Purusha at the Brahmasthan (centre) of the home." },
      { title: "Navagraha Puja", description: "The nine planetary deities are worshipped for planetary harmony." },
      { title: "Milk-Boiling & Threshold Entry", description: "Milk is boiled over as the family enters, right foot forward, carrying a kalash." },
      { title: "Havan", description: "A closing fire ceremony with offerings for prosperity and protection." },
    ],
    packages: [
      { name: "Essential", price: 3500, duration: "3 hrs", features: ["Pandit + full samagri", "Vastu Shanti + Navagraha Puja", "Milk-boiling & threshold ritual"] },
      { name: "Complete", price: 4800, duration: "4 hrs", features: ["Everything in Essential", "Extended havan", "Satyanarayan Katha included"] },
    ],
    faq: [{ question: "Can Griha Pravesh be performed at night?", answer: "It's traditionally performed in the morning or early afternoon, aligned with an auspicious muhurat." }, ...defaultFaqExtra],
    featured: true,
    popular: true,
  },
  {
    slug: "vastu-shanti",
    name: "Vastu Shanti Puja",
    category: "griha-pravesh-and-vastu",
    duration: "2 hrs",
    startingPrice: 2800,
    marketPrice: 3600,
    featuredImage: IMG.candleGroup2,
    gallery: [IMG.candleDarkTable, IMG.whiteRoundLight],
    overview:
      "Vastu Shanti Puja pacifies Vastu Purusha — the deity believed to preside over a plot of land or dwelling — to neutralise structural or directional imbalances and restore harmony to the home.",
    benefits: ["Addresses Vastu-related concerns without structural renovation", "Recommended after purchasing a previously-owned home", "Often performed alongside Griha Pravesh, but can be done independently"],
    importance:
      "Even homes that are structurally sound per Vastu principles benefit from this puja as a periodic reset — many families perform it every few years or after any major renovation.",
    whoShouldPerform: "Any resident of the home, ideally the person who holds the property title, with as many household members present as possible.",
    samagri: ["Kalash and copper vessel", "Nine-coloured cloth (Navagraha), rice and turmeric", "Ghee, cotton wicks and diya", "Havan samagri"],
    vidhiSteps: [
      { title: "Sankalpa", description: "A formal vow stating the intention to pacify Vastu Purusha." },
      { title: "Vastu Purusha Puja", description: "Worship performed at the Brahmasthan (centre) of the home." },
      { title: "Havan", description: "A concluding fire ceremony for protection and balance." },
    ],
    packages: [{ name: "Essential", price: 2800, duration: "2 hrs", features: ["Pandit + full samagri", "Vastu Purusha Puja", "Havan included"] }],
    faq: [...defaultFaqExtra],
    featured: false,
    popular: false,
  },
  {
    slug: "navgraha-shanti",
    name: "Navgraha Shanti Puja",
    category: "astrology-and-graha-shanti",
    duration: "2–3 hrs",
    startingPrice: 3100,
    marketPrice: 4000,
    featuredImage: IMG.whiteRoundLight,
    gallery: [IMG.candleGroupTable, IMG.holiColors],
    overview:
      "Navgraha Shanti Puja pacifies the nine celestial bodies of Vedic astrology — Surya, Chandra, Mangal, Budh, Guru, Shukra, Shani, Rahu and Ketu — each believed to influence different life areas through your birth chart.",
    benefits: ["Recommended before a difficult planetary period (dasha)", "Often performed ahead of marriage or a major business decision", "Complements a Kundli reading when specific doshas are diagnosed"],
    importance: "This isn't a puja for every minor setback — it's most meaningful when grounded in an actual birth chart reading, not a generic recommendation.",
    whoShouldPerform: "The individual whose chart shows the relevant planetary period, ideally after reviewing a real Kundli to confirm it's actually indicated.",
    samagri: ["Nine-grain mix (navadhanya)", "Nine-coloured cloth for each planet", "Ghee, cotton wicks and diya", "Havan samagri specific to afflicted planets"],
    vidhiSteps: [
      { title: "Kundli Review", description: "Confirming which planetary placements need pacification." },
      { title: "Navagraha Sthapana", description: "Installing representations of all nine planets for worship." },
      { title: "Individual Graha Puja", description: "Targeted mantras and offerings for the specific afflicted planet(s)." },
      { title: "Havan", description: "A closing fire ceremony sealing the remedial offerings." },
    ],
    packages: [{ name: "Essential", price: 3100, duration: "2.5 hrs", features: ["Pandit + full samagri", "All nine planets worshipped", "Havan included"] }],
    faq: [{ question: "How long does Navgraha Shanti take?", answer: "Typically 2–3 hours depending on how many planets require specific remedial offerings." }, ...defaultFaqExtra],
    featured: false,
    popular: true,
  },
  {
    slug: "lakshmi-puja",
    name: "Lakshmi Puja",
    category: "wealth-and-prosperity",
    duration: "1–2 hrs",
    startingPrice: 1800,
    marketPrice: 2400,
    featuredImage: IMG.bowlWoodenTable,
    gallery: [IMG.candleGroupTable, IMG.roundBowlCandle],
    overview:
      "Lakshmi Puja invokes Goddess Lakshmi, the deity of wealth and prosperity. It's performed on Fridays, during Diwali, or whenever a family wants to invite abundance into a home or new venture.",
    benefits: ["Traditionally performed when starting a new business or financial year", "A central ritual during Diwali across most Hindu households", "Believed to remove obstacles to financial stability"],
    importance:
      "During Diwali specifically, Lakshmi Puja is performed during Pradosh Kaal — the two hours following sunset — considered the most auspicious window of the year for this puja.",
    whoShouldPerform: "Any household member, though it's traditionally led by the woman of the house alongside the family priest.",
    samagri: ["Lakshmi and Ganesh idols/images", "Lotus flowers and marigold", "Coins, rice and kumkum", "Ghee diyas and cotton wicks"],
    vidhiSteps: [
      { title: "Ganesh Puja", description: "Invoked first, as with most household poojas." },
      { title: "Lakshmi Avahan", description: "Formal invocation of Goddess Lakshmi into the home." },
      { title: "Aarti & Prasad", description: "Closing aarti with prasad distributed to the household." },
    ],
    packages: [{ name: "Essential", price: 1800, duration: "1.5 hrs", features: ["Pandit + full samagri", "Lakshmi & Ganesh Puja", "Aarti included"] }],
    faq: [...defaultFaqExtra],
    featured: false,
    popular: false,
  },
  {
    slug: "ganesh-puja",
    name: "Ganesh Puja",
    category: "ganpati-poojas",
    duration: "1–2 hrs",
    startingPrice: 1500,
    marketPrice: 2000,
    featuredImage: IMG.ganeshIdol,
    gallery: [IMG.threeCandlesBowl, IMG.brassBells],
    overview:
      "Ganesh Puja invokes Lord Ganesh, the remover of obstacles, and is traditionally performed before any new beginning — a new home, business, vehicle, or another puja itself.",
    benefits: ["Clears obstacles before starting something new", "A short, accessible ritual suitable for any occasion", "Often the opening ritual within a larger ceremony"],
    importance: "Nearly every Hindu ritual opens with an invocation to Ganesh — this standalone version is for occasions where a full Ganesh Chaturthi-style sthapana isn't needed.",
    whoShouldPerform: "Anyone marking a new beginning — no specific eligibility required.",
    samagri: ["Ganesh idol or image", "Modak or ladoo for prasad", "Durva grass and red flowers", "Ghee diya and incense"],
    vidhiSteps: [
      { title: "Sankalpa", description: "Stating the intention behind the puja." },
      { title: "Ganesh Avahan", description: "Invocation and worship of Lord Ganesh." },
      { title: "Aarti & Prasad", description: "Closing aarti with modak prasad." },
    ],
    packages: [{ name: "Essential", price: 1500, duration: "1.5 hrs", features: ["Pandit + full samagri", "Ganesh Avahan & Aarti", "Modak prasad included"] }],
    faq: [...defaultFaqExtra],
    featured: true,
    popular: false,
  },
  {
    slug: "marriage-puja",
    name: "Vivah (Marriage) Puja",
    category: "marriage-and-life-events",
    duration: "Full Day",
    startingPrice: 15000,
    marketPrice: 19000,
    featuredImage: IMG.handHoldingCandle,
    gallery: [IMG.candleBrownHolder, IMG.marigold],
    overview:
      "A traditional Vedic wedding ceremony, conducted per the specific rituals of the families' region and tradition — from the initial Ganesh Puja through Kanyadaan, Saptapadi and Sindoor Daan.",
    benefits: [
      "A fully guided, correctly-sequenced ceremony for one of life's most important rituals",
      "The pandit coordinates directly with your families ahead of the date",
      "Available across common regional traditions found in Delhi NCR",
    ],
    importance: "Muhurat (the exact auspicious time) matters more for this ceremony than almost any other — we strongly recommend booking a consultation to confirm timing well before the wedding date.",
    whoShouldPerform: "The couple, with both families present for the relevant rituals.",
    samagri: ["Complete havan and mandap samagri", "Mangalsutra and sindoor (if not separately arranged)", "Rice, turmeric and kumkum for all rituals", "Seven-step Saptapadi materials"],
    vidhiSteps: [
      { title: "Ganesh Puja & Mandap Muhurat", description: "Opens the ceremony and consecrates the wedding mandap." },
      { title: "Kanyadaan", description: "The formal giving away of the bride by her family." },
      { title: "Saptapadi", description: "Seven steps taken together, each with a specific vow." },
      { title: "Sindoor Daan & Mangalsutra", description: "The concluding rituals marking the couple as married." },
    ],
    packages: [
      { name: "Ceremony Only", price: 15000, duration: "Full Day", features: ["Pandit + full samagri", "Complete Vedic ceremony", "Coordination call before the date"] },
      { name: "Ceremony + Pre-Wedding Poojas", price: 22000, duration: "2 Days", features: ["Everything in Ceremony Only", "Haldi & Mehendi puja", "Griha Pravesh for the new couple (optional)"] },
    ],
    faq: [{ question: "Can the pandit travel outside Delhi NCR for a destination wedding?", answer: "In some cases yes — contact support with your venue location and we'll confirm availability and travel charges." }, ...defaultFaqExtra],
    featured: false,
    popular: false,
  },
  {
    slug: "vehicle-puja",
    name: "Vehicle Puja",
    category: "vehicle-and-business",
    duration: "30–45 min",
    startingPrice: 800,
    marketPrice: 1100,
    featuredImage: IMG.tealightCandle,
    gallery: [IMG.candleDarkTable, IMG.citySkyline],
    overview: "A short blessing ceremony for a new (or newly purchased used) vehicle, invoking safety and good fortune for its journeys ahead.",
    benefits: ["Quick, focused ritual specifically for vehicle safety", "Can be performed at home or at the showroom on delivery day", "Suitable for cars, two-wheelers and commercial vehicles"],
    importance: "A small but widely observed ritual — most families perform this before a new vehicle's first drive.",
    whoShouldPerform: "The vehicle's owner, ideally present for the puja and the first drive afterward.",
    samagri: ["Coconut, lemon and flowers", "Kumkum and rice for the tilak", "Ghee diya and incense"],
    vidhiSteps: [
      { title: "Vehicle Tilak", description: "A kumkum tilak applied to the vehicle." },
      { title: "Aarti", description: "A short aarti performed around the vehicle." },
      { title: "Lemon Ritual", description: "A lemon placed under the front wheel, traditionally driven over for the first start." },
    ],
    packages: [{ name: "Essential", price: 800, duration: "30 min", features: ["Pandit + full samagri", "Tilak & Aarti", "Suitable for showroom delivery"] }],
    faq: [...defaultFaqExtra],
    featured: false,
    popular: false,
  },
  {
    slug: "office-puja",
    name: "Office / Shop Opening Puja",
    category: "vehicle-and-business",
    duration: "1–2 hrs",
    startingPrice: 2200,
    marketPrice: 2900,
    featuredImage: IMG.scentedCandle,
    gallery: [IMG.candleGroup2, IMG.incenseSmoke],
    overview:
      "A puja performed before opening a new office, shop or commercial space — combining Ganesh Puja, Vastu Shanti and Lakshmi Puja to bless the venture from day one.",
    benefits: ["Sets an auspicious tone for a new business venture", "Combines obstacle removal, Vastu balance and prosperity invocation in one visit", "Suitable for offices, retail shops and warehouses"],
    importance: "Commonly performed on the day of possession or the first official day of business, ideally at a muhurat confirmed in advance.",
    whoShouldPerform: "The business owner or a senior partner, with staff welcome to attend.",
    samagri: ["Ganesh and Lakshmi idols/images", "Kalash and coconut", "Rice, turmeric and kumkum", "Ghee diya and havan samagri"],
    vidhiSteps: [
      { title: "Ganesh Puja", description: "Removes obstacles before the venture begins." },
      { title: "Vastu Shanti", description: "Balances the energy of the commercial space." },
      { title: "Lakshmi Puja", description: "Invokes prosperity for the new business." },
    ],
    packages: [{ name: "Essential", price: 2200, duration: "1.5 hrs", features: ["Pandit + full samagri", "Ganesh, Vastu & Lakshmi Puja", "Suitable for shops & offices"] }],
    faq: [...defaultFaqExtra],
    featured: false,
    popular: false,
  },
];

const panditsData = [
  { fullName: "Pandit Ramesh Sharma Ji", mobile: "9810000001", specializations: ["Vedic Rituals", "Griha Pravesh"], experienceYears: 18, languages: ["Hindi", "Sanskrit", "English"], rating: 4.9, completedPoojas: 2400, cities: ["Delhi", "Noida"] },
  { fullName: "Pandit Suresh Trivedi Ji", mobile: "9810000002", specializations: ["Satyanarayan Puja", "Navgraha Shanti"], experienceYears: 22, languages: ["Hindi", "Sanskrit"], rating: 4.8, completedPoojas: 3100, cities: ["Delhi", "Gurgaon"] },
  { fullName: "Pandit Devendra Pathak Ji", mobile: "9810000003", specializations: ["Marriage Puja", "Muhurat Selection"], experienceYears: 25, languages: ["Hindi", "Sanskrit", "Bhojpuri"], rating: 5.0, completedPoojas: 4000, cities: ["Delhi", "Ghaziabad"] },
  { fullName: "Pandit Anil Shastri Ji", mobile: "9810000004", specializations: ["Vastu Shanti", "Yantra Sthapana"], experienceYears: 15, languages: ["Hindi", "English", "Punjabi"], rating: 4.9, completedPoojas: 1850, cities: ["Noida", "Greater Noida"] },
  { fullName: "Pandit Vinod Mishra Ji", mobile: "9810000005", specializations: ["Rudrabhishek", "Shiv Puja"], experienceYears: 12, languages: ["Hindi", "Sanskrit"], rating: 4.7, completedPoojas: 1200, cities: ["Delhi", "Faridabad"] },
  { fullName: "Pandit Ashok Tiwari Ji", mobile: "9810000006", specializations: ["Kundli & Astrology", "Navgraha Shanti"], experienceYears: 20, languages: ["Hindi", "English", "Sanskrit"], rating: 4.9, completedPoojas: 2700, cities: ["Delhi", "Rohini"] },
  { fullName: "Pandit Mahesh Joshi Ji", mobile: "9810000007", specializations: ["Kundli Reading", "Vastu Shanti"], experienceYears: 17, languages: ["Hindi", "Sanskrit"], rating: 4.8, completedPoojas: 1950, cities: ["Noida", "Indirapuram"] },
  { fullName: "Pandit Rajendra Pandey Ji", mobile: "9810000008", specializations: ["Griha Pravesh", "Marriage Puja"], experienceYears: 19, languages: ["Hindi", "Sanskrit", "English"], rating: 4.8, completedPoojas: 2200, cities: ["Gurgaon", "Dwarka"] },
  { fullName: "Pandit Sunil Dubey Ji", mobile: "9810000009", specializations: ["Satyanarayan Puja", "Lakshmi Puja"], experienceYears: 14, languages: ["Hindi", "Sanskrit"], rating: 4.7, completedPoojas: 1600, cities: ["Ghaziabad", "Vaishali"] },
  { fullName: "Pandit Vijay Shukla Ji", mobile: "9810000010", specializations: ["Rudrabhishek", "Navgraha Shanti"], experienceYears: 21, languages: ["Hindi", "Sanskrit", "English"], rating: 4.9, completedPoojas: 2850, cities: ["Delhi", "Faridabad"] },
];

const productCategoriesData = [
  { name: "Puja Kits", slug: "puja-kits" },
  { name: "Rudraksha & Mala", slug: "rudraksha-and-mala" },
  { name: "Idols & Yantras", slug: "idols-and-yantras" },
  { name: "Incense & Havan", slug: "incense-and-havan" },
];

const productsData = [
  { name: "Premium Puja Thali Set (Brass)", slug: "puja-thali-set", category: "puja-kits", sellingPrice: 1299, marketPrice: 1599, image: IMG.brassBells, description: "A complete brass puja thali with diya, bell, kumkum holder and incense stand — everything needed for daily aarti." },
  { name: "Panchmukhi Rudraksha Mala", slug: "panchmukhi-rudraksha-mala", category: "rudraksha-and-mala", sellingPrice: 899, marketPrice: 1199, image: IMG.candleBrownHolder, description: "108-bead Panchmukhi Rudraksha mala, suitable for daily japa and general wellbeing." },
  { name: "Brass Ganesh Murti (6 inch)", slug: "brass-ganesh-murti", category: "idols-and-yantras", sellingPrice: 1650, marketPrice: 2100, image: IMG.ganeshIdol, description: "Hand-finished 6-inch brass Ganesh murti, ideal for home mandirs and new beginnings." },
  { name: "Havan Kund with Full Samagri", slug: "havan-kund-samagri", category: "puja-kits", sellingPrice: 749, marketPrice: 999, image: IMG.candleGroup2, description: "Pyramid-shaped havan kund bundled with a complete havan samagri pack." },
  { name: "Sri Yantra (Pure Copper)", slug: "sri-yantra-copper", category: "idols-and-yantras", sellingPrice: 599, marketPrice: 799, image: IMG.whiteRoundLight, description: "Pure copper Sri Yantra for prosperity and positive energy in the home or workplace." },
  { name: "Sandalwood Dhoop & Incense Pack", slug: "sandalwood-dhoop-pack", category: "incense-and-havan", sellingPrice: 299, marketPrice: 399, image: IMG.incenseSmoke, description: "Natural sandalwood dhoop sticks and incense cones, hand-rolled in small batches." },
  { name: "Panchpatra & Achmani Set (Silver-Plated)", slug: "panchpatra-achmani-set", category: "puja-kits", sellingPrice: 899, marketPrice: 1099, image: IMG.roundBowlCandle, description: "Traditional silver-plated panchpatra and achmani set used for daily sankalpa and abhishek." },
  { name: "Cotton Bati / Wicks Pack (500 pcs)", slug: "cotton-wicks-pack", category: "incense-and-havan", sellingPrice: 149, marketPrice: 199, image: IMG.tealightCandle, description: "Hand-rolled cotton wicks for diyas — a pack of 500, enough for months of daily aarti." },
  { name: "Copper Kalash with Coconut Stand", slug: "copper-kalash-coconut-stand", category: "puja-kits", sellingPrice: 999, marketPrice: 1299, image: IMG.candleGroupTable, description: "Pure copper kalash with a matching coconut stand, essential for Griha Pravesh and Vastu poojas." },
  { name: "Ashtagandha & Chandan Tika Pack", slug: "ashtagandha-chandan-pack", category: "incense-and-havan", sellingPrice: 249, marketPrice: 329, image: IMG.scentedCandle, description: "Ashtagandha and sandalwood tika paste pack for daily tilak and puja rituals." },
];

const blogCategoriesData = [
  { name: "Guides", slug: "guides" },
  { name: "Astrology", slug: "astrology" },
  { name: "Festivals", slug: "festivals" },
  { name: "Products", slug: "products" },
];

const blogsData = [
  {
    title: "Griha Pravesh 2026: Auspicious Dates & Complete Vidhi",
    slug: "griha-pravesh-2026-vidhi-guide",
    category: "guides",
    excerpt: "Everything you need to know before entering your new home — dates, samagri, and the full step-by-step vidhi.",
    coverImage: IMG.candlesCircleFloor,
    author: "Pandit Ramesh Sharma Ji",
    publishedAt: new Date("2026-06-02"),
    content: `<h2 id="overview">Overview</h2><p>Griha Pravesh — literally "entering the house" — is the Vedic ceremony performed before a family moves into a new home. It's not just a ritual formality: it's meant to invoke Vastu Purusha (the presiding deity of the dwelling), neutralise any residual negative energy from construction, and set an auspicious tone for the years the family will spend there.</p><p>There are three recognised types depending on the situation: <strong>Apoorva</strong> (moving into a newly built home for the first time), <strong>Sapoorva</strong> (moving back in after a long absence), and <strong>Dwandwah</strong> (moving into a previously-owned home). Each has small variations in vidhi, which your pandit will confirm at booking.</p><h2 id="auspicious-dates">Auspicious Dates in 2026</h2><p>Griha Pravesh should avoid the Shunya Maas (inauspicious transition months) and is traditionally not performed during Chaturmas (roughly July to November) or on a Tuesday, Saturday or during Rahu Kaal.</p><h2 id="items-required">Items Required (Samagri)</h2><ul><li>Kalash, coconut, mango leaves and a copper vessel</li><li>Raw rice, turmeric, kumkum, and akshat</li><li>Ghee, cotton wicks and a brass diya</li><li>Fresh milk (for the traditional boiling-over ritual at the threshold)</li><li>Havan samagri and a Ganesh idol for sthapana</li></ul><h2 id="step-by-step-vidhi">Step-by-Step Vidhi</h2><ol><li><strong>Ganesh Puja</strong> — performed first, to remove obstacles before the main ceremony begins.</li><li><strong>Vastu Shanti Puja</strong> — invokes and pacifies Vastu Purusha, typically at the Brahmasthan.</li><li><strong>Navagraha Puja</strong> — the nine planetary deities are worshipped for planetary harmony.</li><li><strong>Milk-Boiling Ritual</strong> — fresh milk is boiled over as the family enters, symbolising abundance.</li><li><strong>Havan</strong> — a small fire ceremony closes the puja, with offerings for prosperity.</li></ol>`,
  },
  {
    title: "Navgraha Shanti: When Do You Actually Need It?",
    slug: "navgraha-shanti-when-you-need-it",
    category: "astrology",
    excerpt: "A clear-eyed look at when this puja is genuinely recommended — and when it's not necessary.",
    coverImage: IMG.whiteRoundLight,
    author: "Acharya Devraj Joshi",
    publishedAt: new Date("2026-05-18"),
    content: `<h2 id="what-is-navgraha">What Is Navgraha Shanti?</h2><p>Navgraha Shanti Puja pacifies the nine celestial bodies recognised in Vedic astrology — Surya, Chandra, Mangal, Budh, Guru, Shukra, Shani, Rahu and Ketu — each believed to influence different areas of life through their positions in your birth chart.</p><h2 id="when-you-need-it">When Do You Actually Need It?</h2><p>It's traditionally recommended when a birth chart (Kundli) shows a difficult planetary period (dasha) approaching, before major life events like marriage or a new business, or when a Kaal Sarp or Pitra Dosh has been diagnosed alongside challenging planetary placements.</p><h2 id="how-to-know">How to Know If It Applies to You</h2><p>The most reliable way is a proper Kundli reading — not a generic online quiz. PujariDekho's Kundli tool computes real planetary positions, and our team can review it with you on a live consultation before you commit to a Navgraha Shanti booking.</p>`,
  },
  {
    title: "Sawan Somwar 2026: Fasting Rules & Puja Vidhi Explained",
    slug: "sawan-somwar-2026-fasting-rules",
    category: "festivals",
    excerpt: "Fasting rules, puja vidhi, and the significance of Shiva's most sacred month.",
    coverImage: IMG.candleDarkTable,
    author: "Pandit Vinod Mishra Ji",
    publishedAt: new Date("2026-07-06"),
    content: `<h2 id="why-sawan-matters">Why Sawan Somwar Matters</h2><p>Sawan (Shravan) is considered Lord Shiva's most beloved month, and Mondays (Somwar) within it are held especially auspicious for Shiv Puja and fasting.</p><h2 id="fasting-rules">Fasting Rules</h2><p>Most observers follow a Nirjala (no water) or Phalahari (fruits-only) fast depending on personal capacity, breaking it only after evening Shiv Puja.</p><h2 id="puja-vidhi">Puja Vidhi</h2><p>A simple Sawan Somwar puja involves Jal Abhishek (pouring water, milk or Gangajal over the Shiva Lingam), offering Bel Patra, and chanting the Mahamrityunjaya Mantra or Om Namah Shivaya 108 times using a Rudraksha mala.</p>`,
  },
  {
    title: "Satyanarayan Puja: Complete Vidhi and Benefits",
    slug: "satyanarayan-puja-vidhi-and-benefits",
    category: "guides",
    excerpt: "Why this is the most frequently booked puja on PujariDekho, and how the ceremony actually unfolds.",
    coverImage: IMG.roundBowlCandle,
    author: "Pandit Suresh Trivedi Ji",
    publishedAt: new Date("2026-04-22"),
    content: `<h2 id="overview">Overview</h2><p>Satyanarayan Puja honours Lord Vishnu in his form as Satyanarayan — "the one who is the embodiment of truth." It's typically performed on full moon days (Purnima) or to mark a happy occasion.</p><h2 id="benefits">Benefits</h2><p>Families commonly perform this puja after resolving a difficulty, before starting something new, or simply as a periodic act of gratitude.</p>`,
  },
  {
    title: "Kaal Sarp Dosh: Myths and Facts",
    slug: "kaal-sarp-dosh-myths-and-facts",
    category: "astrology",
    excerpt: "Separating what's astrologically meaningful from what's exaggerated for fear-based sales.",
    coverImage: IMG.candleGroup2,
    author: "Acharya Devraj Joshi",
    publishedAt: new Date("2026-03-14"),
    content: `<h2 id="what-it-is">What It Actually Is</h2><p>Kaal Sarp Dosh occurs when all seven visible planets fall between Rahu and Ketu in a birth chart. It is one of several chart configurations, not an automatic curse.</p><h2 id="myths">Common Myths</h2><p>Not every difficulty in life should be attributed to this dosha — a proper reading looks at the whole chart, not one isolated configuration.</p>`,
  },
  {
    title: "Rudraksha Guide: Mukhi Types and What They Mean",
    slug: "rudraksha-guide-mukhi-and-meaning",
    category: "products",
    excerpt: "A practical guide to choosing a Rudraksha mala that actually matches your intention.",
    coverImage: IMG.candleBrownHolder,
    author: "Kavita Desai",
    publishedAt: new Date("2026-02-27"),
    content: `<h2 id="what-is-mukhi">What Does "Mukhi" Mean?</h2><p>Mukhi refers to the natural lines or facets on a Rudraksha seed — most commonly 1 to 21 lines, each associated with a different intention.</p><h2 id="choosing-one">Choosing the Right One</h2><p>5-Mukhi is the most common and considered suitable for general wellbeing; specific mukhis are chosen based on individual astrological guidance.</p>`,
  },
  {
    title: "Mundan Ceremony: Right Age and Vidhi",
    slug: "mundan-ceremony-right-age-and-vidhi",
    category: "guides",
    excerpt: "When families traditionally perform a child's first haircut, and what the ceremony involves.",
    coverImage: IMG.handHoldingCandle,
    author: "Pandit Devendra Pathak Ji",
    publishedAt: new Date("2026-01-30"),
    content: `<h2 id="right-age">The Right Age</h2><p>Mundan is traditionally performed between a child's first and third year, on an odd-numbered birthday, though family tradition varies.</p><h2 id="the-ceremony">The Ceremony</h2><p>A short puja precedes the haircut itself, typically performed by a family elder or the presiding pandit.</p>`,
  },
  {
    title: "5 Vastu Tips for Your Main Entrance",
    slug: "vastu-tips-for-main-entrance",
    category: "guides",
    excerpt: "Simple, non-disruptive adjustments that align with traditional Vastu principles.",
    coverImage: IMG.scentedCandle,
    author: "Pandit Anil Shastri Ji",
    publishedAt: new Date("2025-12-19"),
    content: `<h2 id="tip-1">Keep It Well-Lit</h2><p>The main entrance is considered the entry point for energy into the home — good lighting is a simple, universally-agreed Vastu principle.</p><h2 id="tip-2">Avoid Direct Obstruction</h2><p>Avoid placing heavy furniture or a staircase directly opposite the main door.</p>`,
  },
  {
    title: "Diwali 2026: Lakshmi Puja Muhurat and Vidhi",
    slug: "diwali-2026-lakshmi-puja-muhurat",
    category: "festivals",
    excerpt: "The most auspicious window for Lakshmi Puja this Diwali, and how to prepare your home.",
    coverImage: IMG.candleGroupTable,
    author: "Pandit Suresh Trivedi Ji",
    publishedAt: new Date("2026-10-05"),
    content: `<h2 id="muhurat">The Muhurat</h2><p>Lakshmi Puja is performed during Pradosh Kaal on Diwali night, typically in the two hours following sunset.</p><h2 id="preparation">Preparing Your Home</h2><p>Clean the home thoroughly, light diyas at every entrance, and keep the main door slightly open during the puja to symbolically welcome Goddess Lakshmi.</p>`,
  },
];

async function upsertPoojaCategories() {
  const map = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of poojaCategoriesData) {
    const doc = await PoojaCategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: { ...cat, status: "published" } },
      { upsert: true, new: true },
    );
    map.set(cat.slug, doc._id);
  }
  return map;
}

async function upsertPoojas(categoryMap: Map<string, mongoose.Types.ObjectId>) {
  for (const p of poojasData) {
    const existing = await PoojaModel.findOne({ slug: p.slug });
    if (existing) continue;
    await PoojaModel.create({
      name: p.name,
      slug: p.slug,
      category: categoryMap.get(p.category),
      shortDescription: p.overview.split(".")[0] + ".",
      fullDescription: p.overview,
      featuredImage: p.featuredImage,
      heroBanner: p.featuredImage,
      gallery: p.gallery,
      duration: p.duration,
      startingPrice: p.startingPrice,
      marketPrice: p.marketPrice,
      benefits: p.benefits,
      importance: p.importance,
      whoShouldPerform: p.whoShouldPerform,
      vidhiSteps: p.vidhiSteps,
      samagri: toSamagriItems(p.samagri),
      packages: p.packages.map((pkg) => ({ ...pkg, samagriIncluded: false, dakshinaIncluded: false })),
      faq: p.faq,
      featured: p.featured,
      popular: p.popular,
      status: "published",
    });
  }
}

async function upsertPandits() {
  for (const [i, p] of panditsData.entries()) {
    const existing = await PanditModel.findOne({ mobile: p.mobile });
    if (existing) continue;
    await PanditModel.create({
      photo: PORTRAIT[i % PORTRAIT.length],
      fullName: p.fullName,
      mobile: p.mobile,
      specializations: p.specializations,
      experienceYears: p.experienceYears,
      languages: p.languages,
      cities: p.cities,
      rating: p.rating,
      completedPoojas: p.completedPoojas,
      verificationStatus: "verified",
      accountStatus: "active",
      featured: i < 4,
    });
  }
}

async function upsertProductCategories() {
  const map = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of productCategoriesData) {
    const doc = await ProductCategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: { ...cat, status: "published" } },
      { upsert: true, new: true },
    );
    map.set(cat.slug, doc._id);
  }
  return map;
}

async function upsertProducts(categoryMap: Map<string, mongoose.Types.ObjectId>) {
  for (const p of productsData) {
    const existing = await ProductModel.findOne({ slug: p.slug });
    if (existing) continue;
    await ProductModel.create({
      name: p.name,
      slug: p.slug,
      category: categoryMap.get(p.category),
      shortDescription: p.description,
      description: p.description,
      images: [p.image],
      sellingPrice: p.sellingPrice,
      marketPrice: p.marketPrice,
      stockQuantity: 50,
      inStock: true,
      featured: false,
      status: "published",
    });
  }
}

async function upsertBlogCategories() {
  const map = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of blogCategoriesData) {
    const doc = await BlogCategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: { ...cat, status: "published" } },
      { upsert: true, new: true },
    );
    map.set(cat.slug, doc._id);
  }
  return map;
}

async function upsertBlogs(categoryMap: Map<string, mongoose.Types.ObjectId>) {
  for (const b of blogsData) {
    const existing = await BlogModel.findOne({ slug: b.slug });
    if (existing) continue;
    await BlogModel.create({
      title: b.title,
      slug: b.slug,
      category: categoryMap.get(b.category),
      excerpt: b.excerpt,
      content: b.content,
      coverImage: b.coverImage,
      author: b.author,
      publishedAt: b.publishedAt,
      status: "published",
    });
  }
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const poojaCategoryMap = await upsertPoojaCategories();
  await upsertPoojas(poojaCategoryMap);
  console.log(`Poojas: ${await PoojaModel.countDocuments()} in database`);

  await upsertPandits();
  console.log(`Pandits: ${await PanditModel.countDocuments()} in database`);

  const productCategoryMap = await upsertProductCategories();
  await upsertProducts(productCategoryMap);
  console.log(`Products: ${await ProductModel.countDocuments()} in database`);

  const blogCategoryMap = await upsertBlogCategories();
  await upsertBlogs(blogCategoryMap);
  console.log(`Blogs: ${await BlogModel.countDocuments()} in database`);

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
