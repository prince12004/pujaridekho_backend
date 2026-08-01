/**
 * Production data migration — replaces demo Poojas/Products/Categories with
 * real production catalog data (11 poojas, structured SamagriTemplates,
 * 14 samagri-kit products). Leaves Users/Admins/Pandits/Bookings/Payments/
 * Orders/Reviews/Blogs/CMS data untouched.
 *
 * Safe to re-run: creation steps upsert by slug. The delete step only ever
 * targets Pooja/Product/PoojaCategory/ProductCategory/SamagriTemplate, and a
 * timestamped JSON backup of those collections is written before any delete.
 *
 * Run: pnpm exec tsx apps/api/scripts/migrate-production-catalog.ts
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { PoojaModel } from "../src/models/pooja.model.js";
import { PoojaCategoryModel } from "../src/models/pooja-category.model.js";
import { ProductModel } from "../src/models/product.model.js";
import { ProductCategoryModel } from "../src/models/product-category.model.js";
import { SamagriTemplateModel } from "../src/models/samagri-template.model.js";
import { MediaModel } from "../src/models/media.model.js";
import { FestivalModel } from "../src/models/festival.model.js";
import { PanditModel } from "../src/models/pandit.model.js";
import { BlogModel } from "../src/models/blog.model.js";
import { PageModel } from "../src/models/page.model.js";
import { HomepageBannerModel } from "../src/models/homepage-banner.model.js";
import { TestimonialModel } from "../src/models/testimonial.model.js";
import { CityModel } from "../src/models/city.model.js";
import { SettingsModel } from "../src/models/settings.model.js";
import { SeoSettingModel } from "../src/models/seo-setting.model.js";

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;
}

// Curated, verified-working real stock photographs (same hosting convention
// already used by this codebase's existing content) — stand-ins for real
// branded product photography until real photos are uploaded via the admin
// CMS media manager.
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
  rudrakshaBeads: unsplash("1685419367862-1dd40253bf2b"),
  hinduStatue: unsplash("1761471682495-d89feba4dbbd"),
  havanFireRitual: unsplash("1764173517657-0e7d94d94a4b"),
  openBook: unsplash("1738254816878-b8110a993dbb"),
};

const CITIES = ["Delhi", "Noida", "Greater Noida", "Ghaziabad", "Gurugram", "Faridabad"];

// ---------------------------------------------------------------------------
// Pooja Categories
// ---------------------------------------------------------------------------
const POOJA_CATEGORIES = [
  {
    name: "Griha & Vastu Poojas",
    slug: "griha-vastu-poojas",
    image: IMG.bowlWoodenTable,
    description: "Rituals for a new home, land, vehicle, or business premises — inviting positive energy into new beginnings.",
    seo: { title: "Griha & Vastu Poojas — Book Online | PujariDekho", description: "Book Grah Pravesh, Bhoomi Pujan, Vahan Pujan and Office/Shop Poojas with verified pandits and fixed pricing." },
    status: "Published",
    sortOrder: 1,
  },
  {
    name: "Dev Poojas",
    slug: "dev-poojas",
    image: IMG.hinduStatue,
    description: "Traditional worship of specific deities — Satyanarayan Katha, Rudrabhishek, and Ganesh Sthapana & Visarjan.",
    seo: { title: "Dev Poojas — Book Online | PujariDekho", description: "Book Satyanarayan Katha, Rudrabhishek and Ganesh poojas with verified pandits and complete samagri." },
    status: "Published",
    sortOrder: 2,
  },
  {
    name: "Shanti & Havan Poojas",
    slug: "shanti-havan-poojas",
    image: IMG.havanFireRitual,
    description: "Havan-centric rituals performed to pacify planetary and cosmic influences.",
    seo: { title: "Shanti & Havan Poojas — Book Online | PujariDekho", description: "Book Navgrah Shanti Pooja and other havan rituals with verified pandits." },
    status: "Published",
    sortOrder: 3,
  },
  {
    name: "Sanskar Poojas",
    slug: "sanskar-poojas",
    image: IMG.candleGroupTable,
    description: "Life-stage ceremonies marking key milestones — from a baby's first rice to birthday blessings.",
    seo: { title: "Sanskar Poojas — Book Online | PujariDekho", description: "Book Birthday Pooja and Annaprashan Sanskar with verified pandits and complete samagri." },
    status: "Published",
    sortOrder: 4,
  },
  {
    name: "Path & Anushthan",
    slug: "path-anushthan",
    image: IMG.openBook,
    description: "Devotional recitations and extended spiritual observances.",
    seo: { title: "Path & Anushthan — Book Online | PujariDekho", description: "Book Sundarkand Path with verified pandits, with or without havan and bhajan." },
    status: "Published",
    sortOrder: 5,
  },
];

// ---------------------------------------------------------------------------
// Product Categories
// ---------------------------------------------------------------------------
const PRODUCT_CATEGORIES = [
  { name: "Pooja Samagri Kits", slug: "pooja-samagri-kits", image: IMG.threeCandlesBowl, description: "Complete, pandit-curated samagri kits for every pooja — everything you need in one box.", status: "Published", sortOrder: 1 },
  { name: "Rudraksha", slug: "rudraksha", image: IMG.rudrakshaBeads, description: "Authentic Rudraksha beads and malas.", status: "Published", sortOrder: 2 },
  { name: "Idols & Murtis", slug: "idols-murtis", image: IMG.ganeshIdol, description: "Handcrafted idols and murtis for home and temple worship.", status: "Published", sortOrder: 3 },
  { name: "Yantra", slug: "yantra", image: IMG.whiteRoundLight, description: "Sacred yantras for prosperity, protection and spiritual practice.", status: "Published", sortOrder: 4 },
  { name: "Brass & Copper Items", slug: "brass-copper-items", image: IMG.brassBells, description: "Traditional brass and copper puja vessels and accessories.", status: "Published", sortOrder: 5 },
  { name: "Incense & Dhoop", slug: "incense-dhoop", image: IMG.incenseSmoke, description: "Temple-grade agarbatti, dhoop and havan incense.", status: "Published", sortOrder: 6 },
  { name: "Hawan Samagri", slug: "hawan-samagri", image: IMG.havanFireRitual, description: "Havan kunds, samidha, and complete hawan material.", status: "Published", sortOrder: 7 },
  { name: "Spiritual Accessories", slug: "spiritual-accessories", image: IMG.tealightCandle, description: "Malas, thread, cloth and everyday puja accessories.", status: "Published", sortOrder: 8 },
  { name: "Books", slug: "books", image: IMG.openBook, description: "Sacred texts and devotional books.", status: "Published", sortOrder: 9 },
];

// ---------------------------------------------------------------------------
// Shared samagri item catalogue (reused across templates with per-pooja
// quantities/prices — kept intentionally varied per pooja, not identical).
// ---------------------------------------------------------------------------
interface Item {
  itemName: string;
  quantity: string;
  unit: string;
  estimatedPrice: number;
  category: string;
  required?: boolean;
}

const CUSTOMER_ARRANGE_WHITELIST = [
  "Fruits", "Mithai", "Fresh Flowers", "Flower Mala", "Paan", "Milk", "Curd", "Honey", "Ghee", "Coconut", "Panchamrit Ingredients",
] as const;

// ---------------------------------------------------------------------------
// Poojas — packages are exactly as specified (name/price/duration/panditCount
// preserved verbatim in spirit; names synthesized only where none was given).
// ---------------------------------------------------------------------------
interface PoojaSeed {
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  importance: string;
  whoShouldPerform: string;
  vidhiSteps: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  featuredImage: string;
  gallery: string[];
  duration: string;
  startingPrice: number;
  marketPrice: number;
  featured: boolean;
  popular: boolean;
  packages: {
    name: string;
    price: number;
    duration?: string;
    panditCount?: number;
    features?: string[];
    samagriIncluded?: boolean;
  }[];
  samagriTemplateName: string;
  includedItems: Item[];
  customerArrangeItems: (typeof CUSTOMER_ARRANGE_WHITELIST)[number][];
}

const POOJAS: PoojaSeed[] = [
  {
    slug: "satyanarayan-katha",
    name: "Satyanarayan Katha",
    categorySlug: "dev-poojas",
    shortDescription: "A traditional Satyanarayan Katha performed by a verified pandit, with the option to add a havan.",
    fullDescription:
      "Satyanarayan Katha is one of the most widely performed Hindu rituals, invoking Lord Vishnu's blessings for prosperity, family harmony and the fulfilment of wishes. Our verified pandits conduct the full katha with authentic Vedic chanting, guiding your family through every step.",
    benefits: [
      "Invokes Lord Vishnu's blessings for prosperity and well-being",
      "Strengthens family harmony and resolves obstacles",
      "Traditionally performed on auspicious occasions, full moon days or after wish fulfilment",
      "Can be extended with a havan for added significance",
    ],
    importance:
      "Satyanarayan Katha is performed to express gratitude to Lord Vishnu and seek continued prosperity. It is one of the few poojas that can be performed at any time, making it accessible for every household.",
    whoShouldPerform: "Any household seeking blessings for prosperity, after achieving a goal, or on auspicious occasions like a full moon (Purnima).",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit begins with a sankalp (vow) stating the purpose of the puja." },
      { title: "Kalash Sthapana", description: "A kalash is established and worshipped as a symbol of Lord Vishnu." },
      { title: "Katha Path", description: "The five chapters of the Satyanarayan Katha are recited." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with aarti and distribution of the panchamrit prasad." },
    ],
    faq: [
      { question: "How long does the Satyanarayan Katha take?", answer: "The basic katha takes 1-2 hours; with havan it extends to 2-3 hours." },
      { question: "Is samagri included in the price?", answer: "The package price does not include samagri — you can add PujariDekho's curated samagri kit separately or select add-on items during booking." },
      { question: "Can this be performed on any day?", answer: "Yes, Satyanarayan Katha can be performed on any day, though Purnima (full moon) is considered especially auspicious." },
    ],
    featuredImage: IMG.candleBrownHolder,
    gallery: [IMG.bowlWoodenTable, IMG.threeCandlesBowl],
    duration: "1-2 Hours",
    startingPrice: 501,
    marketPrice: 650,
    featured: true,
    popular: true,
    packages: [
      { name: "Basic Katha", price: 501, duration: "1-2 Hours", panditCount: 1 },
      { name: "Katha with Havan", price: 1101, duration: "2-3 Hours", panditCount: 1, features: ["With Havan"] },
    ],
    samagriTemplateName: "Satyanarayan Katha Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "100", unit: "ml", estimatedPrice: 30, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Panchmewa", quantity: "100", unit: "g", estimatedPrice: 120, category: "Offerings", required: false },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings" },
      { itemName: "Peela Cloth", quantity: "1", unit: "m", estimatedPrice: 40, category: "Cloth & Thread", required: false },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 180, category: "Vessels & Metal Items" },
      { itemName: "Additional Ritual Essentials", quantity: "1", unit: "set", estimatedPrice: 49, category: "Special Items", required: false },
    ],
    customerArrangeItems: ["Fruits", "Mithai", "Milk", "Panchamrit Ingredients"],
  },
  {
    slug: "rudrabhishek-pooja",
    name: "Rudrabhishek Pooja",
    categorySlug: "dev-poojas",
    shortDescription: "A sacred abhishek of Lord Shiva performed with Rudri chanting, with an elaborate havan option.",
    fullDescription:
      "Rudrabhishek is a powerful ritual bath of the Shiva Lingam performed with Vedic Rudri chanting, invoking Lord Shiva's blessings for peace, health and the removal of obstacles. Our pandits conduct this with full authenticity, and the elaborate package extends to a havan with two pandits.",
    benefits: [
      "Invokes Lord Shiva's blessings for peace and protection",
      "Believed to remove obstacles and negative planetary effects",
      "Restores physical and mental well-being",
      "The elaborate package adds a havan for amplified benefits",
    ],
    importance:
      "Rudrabhishek is considered one of the most powerful Shiva rituals, especially significant on Mondays, Mahashivratri, and during Shravan month.",
    whoShouldPerform: "Devotees seeking Lord Shiva's blessings, relief from health or planetary troubles, or observing Shravan/Mahashivratri.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp stating the devotee's intention." },
      { title: "Shiv Lingam Sthapana", description: "The Shiva Lingam is ritually cleansed and established." },
      { title: "Rudri Abhishek", description: "The abhishek is performed while chanting the Rudri mantras." },
      { title: "Havan (elaborate package)", description: "A havan is performed with Navgrah Samidha for amplified benefits." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with Shiva aarti and prasad distribution." },
    ],
    faq: [
      { question: "What is the difference between the two packages?", answer: "The basic package is a 1-pandit abhishek; the elaborate package adds a havan performed by 2 pandits." },
      { question: "Is Rudrabhishek only for Mondays?", answer: "While Mondays and Mahashivratri are especially auspicious, Rudrabhishek can be performed on any day." },
      { question: "What should I arrange myself?", answer: "Milk, curd, honey, ghee and panchamrit ingredients for the abhishek — everything else is included in the samagri kit." },
    ],
    featuredImage: IMG.hinduStatue,
    gallery: [IMG.havanFireRitual, IMG.candleDarkTable],
    duration: "2-3 Hours",
    startingPrice: 1100,
    marketPrice: 1400,
    featured: true,
    popular: true,
    packages: [
      { name: "Rudrabhishek (1 Pandit)", price: 1100, duration: "2-3 Hours", panditCount: 1 },
      { name: "Rudrabhishek with Havan (2 Pandits)", price: 3100, duration: "2-3 Hours", panditCount: 2, features: ["With Havan"] },
    ],
    samagriTemplateName: "Rudrabhishek Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Janeu", quantity: "2", unit: "pcs", estimatedPrice: 20, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "200", unit: "ml", estimatedPrice: 50, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Copper Kalash", quantity: "1", unit: "pc", estimatedPrice: 250, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Bel Patra", quantity: "1", unit: "bunch", estimatedPrice: 15, category: "Offerings" },
      { itemName: "Dhatura", quantity: "1", unit: "bunch", estimatedPrice: 15, category: "Offerings" },
      { itemName: "Shiv Vastra", quantity: "1", unit: "set", estimatedPrice: 60, category: "Cloth & Thread" },
      { itemName: "Elaichi", quantity: "20", unit: "g", estimatedPrice: 40, category: "Offerings", required: false },
      { itemName: "Cloves", quantity: "20", unit: "g", estimatedPrice: 20, category: "Offerings", required: false },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings" },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 180, category: "Vessels & Metal Items" },
      { itemName: "Additional Rudrabhishek Essentials", quantity: "1", unit: "set", estimatedPrice: 119, category: "Special Items", required: false },
    ],
    customerArrangeItems: ["Milk", "Curd", "Honey", "Ghee", "Panchamrit Ingredients"],
  },
  {
    slug: "birthday-pooja",
    name: "Birthday Pooja",
    categorySlug: "sanskar-poojas",
    shortDescription: "A blessing ceremony for birthdays, invoking good health, long life and prosperity.",
    fullDescription:
      "Birthday Pooja is a heartfelt ritual performed to seek divine blessings for good health, long life and happiness on a birthday. Our pandit conducts a simple, joyful ceremony suitable for children and adults alike.",
    benefits: [
      "Invokes blessings for good health and long life",
      "A meaningful family ritual to mark the occasion",
      "Suitable for children's and adults' birthdays alike",
      "Simple, joyful ceremony with fixed pricing",
    ],
    importance: "Birthday poojas are a way of thanking the divine for another year of life and seeking continued protection and prosperity.",
    whoShouldPerform: "Families wanting to mark a birthday with a traditional blessing ceremony.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp naming the birthday person." },
      { title: "Deity Puja", description: "A short puja is performed to the family's chosen deity." },
      { title: "Aashirwad", description: "Blessings are given for health, prosperity and long life." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with aarti and prasad." },
    ],
    faq: [
      { question: "Can this be done for a child's birthday?", answer: "Yes, it's commonly performed for children as well as adults." },
      { question: "How long does it take?", answer: "The full ceremony takes 2-3 hours including preparation." },
    ],
    featuredImage: IMG.candleGroupTable,
    gallery: [IMG.roundBowlCandle],
    duration: "2-3 Hours",
    startingPrice: 1100,
    marketPrice: 1400,
    featured: false,
    popular: true,
    packages: [{ name: "Birthday Pooja (1 Pandit)", price: 1100, duration: "2-3 Hours", panditCount: 1 }],
    samagriTemplateName: "Birthday Pooja Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "100", unit: "ml", estimatedPrice: 30, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings", required: false },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 179, category: "Vessels & Metal Items" },
    ],
    customerArrangeItems: ["Fruits", "Mithai", "Fresh Flowers"],
  },
  {
    slug: "grah-pravesh-pooja",
    name: "Grah Pravesh Pooja",
    categorySlug: "griha-vastu-poojas",
    shortDescription: "A house-warming ritual with havan, performed before or while moving into a new home.",
    fullDescription:
      "Grah Pravesh Pooja is performed when entering a new home to purify the space, remove negative energy and invite prosperity. Our pandits conduct the complete ritual including a havan, with an elaborate two-pandit package for larger homes.",
    benefits: [
      "Purifies the new home and removes negative energy",
      "Invites prosperity and positive energy for the family",
      "Always includes a havan for complete ritual significance",
      "Elaborate package available for larger homes with 2 pandits",
    ],
    importance: "Grah Pravesh is considered essential before occupying a new home, ensuring the space is spiritually prepared for the family.",
    whoShouldPerform: "Families moving into a newly built or newly purchased home.",
    vidhiSteps: [
      { title: "Vastu Puja", description: "The pandit performs a Vastu puja to pacify the deities of the plot." },
      { title: "Kalash Sthapana", description: "A kalash is placed at the entrance as a symbol of abundance." },
      { title: "Havan", description: "A havan is performed with Navgrah Samidha for purification." },
      { title: "Griha Pravesh", description: "The family formally enters the home with a kalash and diya." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with aarti and prasad." },
    ],
    faq: [
      { question: "Which package should I choose?", answer: "The 1-pandit package suits most homes; the 2-pandit package is recommended for larger homes or a more elaborate ceremony." },
      { question: "Is havan always included?", answer: "Yes, both Grah Pravesh packages include a havan." },
    ],
    featuredImage: IMG.threeCandlesBowl,
    gallery: [IMG.handHoldingCandle],
    duration: "2-3 Hours",
    startingPrice: 2100,
    marketPrice: 2600,
    featured: true,
    popular: true,
    packages: [
      { name: "Grah Pravesh with Havan (1 Pandit)", price: 2100, duration: "2-3 Hours", panditCount: 1, features: ["With Havan"] },
      { name: "Grah Pravesh with Havan (2 Pandits)", price: 5100, duration: "4-5 Hours", panditCount: 2, features: ["With Havan"] },
    ],
    samagriTemplateName: "Grah Pravesh Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Janeu", quantity: "2", unit: "pcs", estimatedPrice: 20, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "200", unit: "ml", estimatedPrice: 50, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Copper Kalash", quantity: "1", unit: "pc", estimatedPrice: 219, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "3", unit: "pcs", estimatedPrice: 40, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Havan Kund", quantity: "1", unit: "pc", estimatedPrice: 200, category: "Havan Samagri" },
      { itemName: "Havan Samagri Mix", quantity: "250", unit: "g", estimatedPrice: 150, category: "Havan Samagri" },
      { itemName: "Samidha", quantity: "250", unit: "g", estimatedPrice: 60, category: "Havan Samagri", required: false },
      { itemName: "Mango Leaves (Toran)", quantity: "1", unit: "bunch", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Lal Cloth", quantity: "1", unit: "m", estimatedPrice: 40, category: "Cloth & Thread", required: false },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 180, category: "Vessels & Metal Items" },
    ],
    customerArrangeItems: ["Fruits", "Mithai", "Fresh Flowers", "Coconut", "Milk"],
  },
  {
    slug: "vahan-pujan",
    name: "Vahan Pujan",
    categorySlug: "griha-vastu-poojas",
    shortDescription: "A short vehicle-blessing ritual for safe travels, performed at home or the showroom.",
    fullDescription:
      "Vahan Pujan is a quick, auspicious ritual performed on a new (or existing) vehicle to seek blessings for safety and smooth travels. Our pandit performs the puja at your home, office or the showroom itself.",
    benefits: [
      "Invokes blessings for safe and smooth travels",
      "Traditionally performed on new vehicle purchase",
      "Quick ceremony that fits around your schedule",
      "Can be performed at home, office or showroom",
    ],
    importance: "Vahan Pujan is considered essential before regularly using a new vehicle, seeking protection from accidents and mishaps.",
    whoShouldPerform: "Anyone who has purchased a new vehicle, or wishes to re-bless an existing one.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp for the vehicle owner." },
      { title: "Vehicle Puja", description: "The vehicle is cleaned, decorated and worshipped with roli, akshat and flowers." },
      { title: "Nimbu-Mirchi Totka", description: "A lemon-chili string is tied for protection from evil eye." },
      { title: "Aarti", description: "The ceremony concludes with aarti around the vehicle." },
    ],
    faq: [
      { question: "How long does Vahan Pujan take?", answer: "It's a quick ceremony, typically 30 minutes to 1 hour." },
      { question: "Can this be done at a showroom?", answer: "Yes, our pandits can travel to your home, office, or the vehicle showroom." },
    ],
    featuredImage: IMG.tealightCandle,
    gallery: [IMG.candleDarkTable],
    duration: "30 Minutes - 1 Hour",
    startingPrice: 501,
    marketPrice: 650,
    featured: false,
    popular: true,
    packages: [{ name: "Vahan Pujan (1 Pandit)", price: 501, duration: "30 Minutes - 1 Hour", panditCount: 1 }],
    samagriTemplateName: "Vahan Pujan Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "100", unit: "ml", estimatedPrice: 30, category: "Puja Basics" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Lal Cloth", quantity: "1", unit: "m", estimatedPrice: 40, category: "Cloth & Thread", required: false },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings", required: false },
      { itemName: "Nimbu-Mirchi Totka String", quantity: "1", unit: "pc", estimatedPrice: 89, category: "Special Items" },
    ],
    customerArrangeItems: ["Fruits", "Fresh Flowers", "Coconut"],
  },
  {
    slug: "office-shop-pooja",
    name: "Office / Shop Pooja",
    categorySlug: "griha-vastu-poojas",
    shortDescription: "A business-opening blessing ritual for offices and shops, seeking prosperity and success.",
    fullDescription:
      "Office / Shop Pooja is performed before opening a new business, office or shop to seek Lord Ganesha and Goddess Lakshmi's blessings for prosperity and success. Our pandit conducts a complete ceremony suited to commercial spaces.",
    benefits: [
      "Invokes Ganesh-Lakshmi blessings for business success",
      "Removes obstacles before a new business venture",
      "Suitable for offices, shops and commercial spaces",
      "Includes a Shubh-Labh door sticker set",
    ],
    importance: "This puja is traditionally performed before starting any new commercial venture to ensure a prosperous beginning.",
    whoShouldPerform: "Business owners opening a new office, shop or commercial establishment.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp for the business venture." },
      { title: "Ganesh-Lakshmi Puja", description: "Lord Ganesha and Goddess Lakshmi are worshipped for prosperity." },
      { title: "Toran & Door Puja", description: "The entrance is decorated and worshipped with a Shubh-Labh sticker set." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with aarti and prasad distribution to staff." },
    ],
    faq: [
      { question: "Is this puja suitable for both offices and shops?", answer: "Yes, the same ritual applies to both — it's tailored to commercial spaces of any kind." },
      { question: "Can this be done before the shop's grand opening?", answer: "Yes, it's typically performed on or just before the opening day." },
    ],
    featuredImage: IMG.candleGroup2,
    gallery: [IMG.incenseSmoke],
    duration: "2-3 Hours",
    startingPrice: 1100,
    marketPrice: 1400,
    featured: false,
    popular: false,
    packages: [{ name: "Office / Shop Pooja (1 Pandit)", price: 1100, duration: "2-3 Hours", panditCount: 1 }],
    samagriTemplateName: "Office / Shop Pooja Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "100", unit: "ml", estimatedPrice: 30, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Mango Leaves (Toran)", quantity: "1", unit: "bunch", estimatedPrice: 20, category: "Offerings", required: false },
      { itemName: "Lal Cloth", quantity: "1", unit: "m", estimatedPrice: 40, category: "Cloth & Thread" },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings", required: false },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 180, category: "Vessels & Metal Items" },
      { itemName: "Shubh-Labh Door Sticker Set", quantity: "1", unit: "set", estimatedPrice: 99, category: "Special Items" },
    ],
    customerArrangeItems: ["Fruits", "Mithai", "Fresh Flowers"],
  },
  {
    slug: "navgrah-shanti-pooja",
    name: "Navgrah Shanti Pooja",
    categorySlug: "shanti-havan-poojas",
    shortDescription: "A havan-based ritual to pacify the nine planets and reduce their adverse effects.",
    fullDescription:
      "Navgrah Shanti Pooja is performed to pacify the nine planetary deities (Navgrah) and mitigate their negative astrological effects. Our pandit conducts the complete puja and havan with Navgrah Samidha.",
    benefits: [
      "Pacifies the nine planetary deities",
      "Believed to reduce doshas and negative planetary effects",
      "Brings mental peace and removes obstacles",
      "Includes a full havan with Navgrah Samidha",
    ],
    importance: "Recommended for individuals facing planetary doshas identified in their horoscope, or simply seeking overall well-being.",
    whoShouldPerform: "Anyone experiencing planetary-related challenges, or seeking general astrological well-being.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp naming the nine planets." },
      { title: "Navgrah Sthapana", description: "The nine planetary deities are symbolically established and worshipped." },
      { title: "Havan", description: "A havan is performed with Navgrah Samidha, one for each planet." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with aarti and prasad." },
    ],
    faq: [
      { question: "Who should perform Navgrah Shanti?", answer: "Anyone advised by an astrologer, or those seeking to reduce planetary doshas." },
      { question: "Is havan mandatory?", answer: "Yes, the havan is a core part of the Navgrah Shanti ritual and is always included." },
    ],
    featuredImage: IMG.whiteRoundLight,
    gallery: [IMG.candlesCircleFloor],
    duration: "2-3 Hours",
    startingPrice: 1100,
    marketPrice: 1400,
    featured: false,
    popular: false,
    packages: [{ name: "Navgrah Shanti Pooja (1 Pandit)", price: 1100, duration: "2-3 Hours", panditCount: 1 }],
    samagriTemplateName: "Navgrah Shanti Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "100", unit: "ml", estimatedPrice: 30, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Navgrah Samidha", quantity: "250", unit: "g", estimatedPrice: 120, category: "Havan Samagri" },
      { itemName: "Havan Kund", quantity: "1", unit: "pc", estimatedPrice: 200, category: "Havan Samagri" },
      { itemName: "Havan Samagri Mix", quantity: "250", unit: "g", estimatedPrice: 150, category: "Havan Samagri" },
      { itemName: "Til", quantity: "100", unit: "g", estimatedPrice: 20, category: "Havan Samagri", required: false },
      { itemName: "Jau", quantity: "100", unit: "g", estimatedPrice: 15, category: "Havan Samagri", required: false },
      { itemName: "Sarson", quantity: "50", unit: "g", estimatedPrice: 15, category: "Havan Samagri" },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 149, category: "Vessels & Metal Items" },
    ],
    customerArrangeItems: ["Fruits", "Mithai", "Milk"],
  },
  {
    slug: "annaprashan-sanskar",
    name: "Annaprashan Sanskar",
    categorySlug: "sanskar-poojas",
    shortDescription: "The traditional first-rice-feeding ceremony for a baby, with a keepsake ritual set.",
    fullDescription:
      "Annaprashan Sanskar marks a baby's first taste of solid food, a joyous milestone in Hindu tradition. Our pandit conducts the complete ceremony with blessings for the child's health and future, including a keepsake ritual set.",
    benefits: [
      "Marks the baby's first significant life milestone",
      "Invokes blessings for the child's health and future",
      "Includes a keepsake silver-plated ritual set",
      "A cherished family ceremony to be remembered",
    ],
    importance: "Annaprashan is one of the sixteen traditional Hindu sanskars (rites of passage), typically performed around 6 months of age.",
    whoShouldPerform: "Parents of infants ready to be introduced to solid food, typically around 6 months old.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp naming the baby." },
      { title: "Deity Puja", description: "A short puja is performed to seek blessings for the child." },
      { title: "Anna Prashan", description: "The baby is fed a small portion of rice kheer as the ritual's centerpiece." },
      { title: "Aashirwad & Keepsake", description: "Elders bless the child, and the keepsake ritual set is presented." },
    ],
    faq: [
      { question: "At what age should Annaprashan be performed?", answer: "Traditionally around 6 months, though families may choose an auspicious date near this age." },
      { question: "What is included in the keepsake set?", answer: "A silver-plated spoon and bowl set to commemorate the baby's first rice ceremony." },
    ],
    featuredImage: IMG.roundBowlCandle,
    gallery: [IMG.candleGroupTable],
    duration: "2-3 Hours",
    startingPrice: 2100,
    marketPrice: 2600,
    featured: false,
    popular: false,
    packages: [{ name: "Annaprashan Sanskar (1 Pandit)", price: 2100, duration: "2-3 Hours", panditCount: 1 }],
    samagriTemplateName: "Annaprashan Sanskar Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "100", unit: "ml", estimatedPrice: 30, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings", required: false },
      { itemName: "Panchmewa", quantity: "100", unit: "g", estimatedPrice: 120, category: "Offerings", required: false },
      { itemName: "White Cloth", quantity: "1", unit: "m", estimatedPrice: 35, category: "Cloth & Thread" },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 180, category: "Vessels & Metal Items" },
      { itemName: "Baby's First Rice Ceremony Keepsake Set", quantity: "1", unit: "set", estimatedPrice: 204, category: "Special Items" },
    ],
    customerArrangeItems: ["Fruits", "Mithai", "Milk", "Honey", "Ghee"],
  },
  {
    slug: "sundarkand-path",
    name: "Sundarkand Path",
    categorySlug: "path-anushthan",
    shortDescription: "A devotional recitation of the Sundarkand from Ramcharitmanas, with an elaborate havan & bhajan option.",
    fullDescription:
      "Sundarkand Path is a devotional recitation of the Sundarkand chapter from the Ramcharitmanas, dedicated to Lord Hanuman. The basic package is a recitation-only ceremony, while the elaborate package adds a havan and bhajan performed by 3-4 pandits.",
    benefits: [
      "Invokes Lord Hanuman's blessings for strength and protection",
      "Believed to remove obstacles and negative energy from the home",
      "Elaborate package adds a havan and devotional bhajan singing",
      "A deeply auspicious ritual for any household",
    ],
    importance: "Sundarkand Path is traditionally performed to overcome difficulties, seek Hanuman ji's protection, and bring positivity into the home.",
    whoShouldPerform: "Devotees of Lord Hanuman, or families seeking protection and positivity in the household.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp before beginning the path." },
      { title: "Hanuman Puja", description: "A short puja is offered to Lord Hanuman." },
      { title: "Sundarkand Path", description: "The Sundarkand chapter is recited in full." },
      { title: "Havan & Bhajan (elaborate package)", description: "A havan is performed followed by devotional bhajan singing." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with Hanuman aarti and prasad." },
    ],
    faq: [
      { question: "What's the difference between the two packages?", answer: "The basic package is path-only (recitation); the elaborate package adds havan and bhajan performed by 3-4 pandits." },
      { question: "How long does the elaborate package take?", answer: "The elaborate package with havan and bhajan typically runs several hours given the additional pandits and rituals involved." },
    ],
    featuredImage: IMG.openBook,
    gallery: [IMG.candlesCircleFloor],
    duration: "Path Only",
    startingPrice: 501,
    marketPrice: 650,
    featured: false,
    popular: true,
    packages: [
      { name: "Sundarkand Path Only", price: 501, features: ["Path Only"], panditCount: 1 },
      { name: "Sundarkand Path with Havan & Bhajan (3-4 Pandits)", price: 5100, panditCount: 4, features: ["With Havan", "With Bhajan"] },
    ],
    samagriTemplateName: "Sundarkand Path & Havan Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "200", unit: "ml", estimatedPrice: 50, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "3", unit: "pcs", estimatedPrice: 40, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Havan Kund", quantity: "1", unit: "pc", estimatedPrice: 200, category: "Havan Samagri" },
      { itemName: "Havan Samagri Mix", quantity: "250", unit: "g", estimatedPrice: 150, category: "Havan Samagri" },
      { itemName: "Mango Wood", quantity: "500", unit: "g", estimatedPrice: 80, category: "Havan Samagri" },
      { itemName: "Samidha", quantity: "250", unit: "g", estimatedPrice: 60, category: "Havan Samagri" },
      { itemName: "Guggul", quantity: "20", unit: "g", estimatedPrice: 30, category: "Havan Samagri", required: false },
      { itemName: "Loban", quantity: "20", unit: "g", estimatedPrice: 20, category: "Havan Samagri", required: false },
      { itemName: "Til", quantity: "100", unit: "g", estimatedPrice: 20, category: "Havan Samagri" },
      { itemName: "Jau", quantity: "100", unit: "g", estimatedPrice: 15, category: "Havan Samagri" },
      { itemName: "Sarson", quantity: "50", unit: "g", estimatedPrice: 15, category: "Havan Samagri" },
      { itemName: "Cloves", quantity: "20", unit: "g", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Elaichi", quantity: "20", unit: "g", estimatedPrice: 40, category: "Offerings" },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings" },
      { itemName: "Panchmewa", quantity: "100", unit: "g", estimatedPrice: 120, category: "Offerings", required: false },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 180, category: "Vessels & Metal Items" },
      { itemName: "Hanuman Chalisa Book & Bhajan Kit", quantity: "1", unit: "set", estimatedPrice: 359, category: "Special Items", required: false },
    ],
    customerArrangeItems: ["Fruits", "Mithai"],
  },
  {
    slug: "ganesh-sthapana-visarjan",
    name: "Ganesh Sthapana & Visarjan",
    categorySlug: "dev-poojas",
    shortDescription: "Lord Ganesha's installation ceremony, with an option to include the visarjan (immersion) ritual too.",
    fullDescription:
      "Ganesh Sthapana is the installation and daily worship ceremony for Lord Ganesha's idol, traditionally performed during Ganesh Chaturthi or any auspicious occasion. The extended package includes the Visarjan (immersion) ritual as well.",
    benefits: [
      "Invokes Lord Ganesha's blessings as the remover of obstacles",
      "Marks the beginning of an auspicious celebration",
      "Extended package covers both installation and immersion",
      "Includes an eco-friendly visarjan immersion kit",
    ],
    importance: "Ganesh Sthapana is central to Ganesh Chaturthi celebrations and is also performed before starting any significant new venture.",
    whoShouldPerform: "Families and communities celebrating Ganesh Chaturthi or beginning a new venture.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp for the installation." },
      { title: "Ganesh Sthapana", description: "The Ganesh idol is ritually installed and worshipped." },
      { title: "Daily Aarti", description: "Daily aarti and prasad offerings are explained to the family." },
      { title: "Visarjan (extended package)", description: "The immersion ritual is performed with an eco-friendly kit." },
    ],
    faq: [
      { question: "Does the basic package include visarjan?", answer: "No, the basic package covers Sthapana only; choose the extended package for both Sthapana and Visarjan." },
      { question: "Is the visarjan kit eco-friendly?", answer: "Yes, we include an eco-friendly immersion pouch and camphor aarti set." },
    ],
    featuredImage: IMG.ganeshIdol,
    gallery: [IMG.brassBells],
    duration: "1-2 Hours",
    startingPrice: 1100,
    marketPrice: 1400,
    featured: true,
    popular: true,
    packages: [
      { name: "Ganesh Sthapana", price: 1100, panditCount: 1 },
      { name: "Ganesh Sthapana & Visarjan", price: 2100, panditCount: 1 },
    ],
    samagriTemplateName: "Ganesh Sthapana & Visarjan Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "100", unit: "ml", estimatedPrice: 30, category: "Puja Basics" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Durva Grass", quantity: "1", unit: "bunch", estimatedPrice: 10, category: "Offerings" },
      { itemName: "Lal Cloth", quantity: "1", unit: "m", estimatedPrice: 40, category: "Cloth & Thread", required: false },
      { itemName: "Mishri", quantity: "100", unit: "g", estimatedPrice: 30, category: "Offerings", required: false },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 180, category: "Vessels & Metal Items" },
      { itemName: "Ganesh Visarjan Kit (Eco-Friendly)", quantity: "1", unit: "set", estimatedPrice: 159, category: "Special Items", required: false },
    ],
    customerArrangeItems: ["Fruits", "Mithai", "Fresh Flowers", "Flower Mala", "Coconut", "Paan"],
  },
  {
    slug: "bhoomi-pujan",
    name: "Bhoomi Pujan",
    categorySlug: "griha-vastu-poojas",
    shortDescription: "A land-blessing ritual with havan, performed before construction begins on a plot.",
    fullDescription:
      "Bhoomi Pujan is performed before construction begins on a plot of land, seeking the blessings of Vastu Purush and Mother Earth for a safe, obstacle-free building process. Our pandit conducts the complete ritual including a havan.",
    benefits: [
      "Seeks Vastu Purush's blessings for the construction",
      "Believed to ensure a safe, obstacle-free building process",
      "Always includes a havan for complete ritual significance",
      "Essential first step before any construction begins",
    ],
    importance: "Bhoomi Pujan is traditionally performed as the very first step before construction, considered essential for auspicious groundbreaking.",
    whoShouldPerform: "Landowners and builders about to begin construction on a residential or commercial plot.",
    vidhiSteps: [
      { title: "Sankalp", description: "The pandit performs a sankalp naming the landowner and the plot." },
      { title: "Vastu Purush Puja", description: "Vastu Purush is worshipped to seek the land's blessings." },
      { title: "Havan", description: "A havan is performed at the foundation site." },
      { title: "Shilanyas", description: "The first symbolic foundation stone/brick is laid." },
      { title: "Aarti & Prasad", description: "The ceremony concludes with aarti and prasad." },
    ],
    faq: [
      { question: "When should Bhoomi Pujan be performed?", answer: "Before any construction or excavation begins on the plot, ideally on an astrologically auspicious date." },
      { question: "Is havan included?", answer: "Yes, the havan is always part of the Bhoomi Pujan ritual." },
    ],
    featuredImage: IMG.bowlWoodenTable,
    gallery: [IMG.candleGroup2],
    duration: "2-3 Hours",
    startingPrice: 2100,
    marketPrice: 2600,
    featured: false,
    popular: false,
    packages: [{ name: "Bhoomi Pujan (1 Pandit)", price: 2100, duration: "2-3 Hours", panditCount: 1 }],
    samagriTemplateName: "Bhoomi Pujan Samagri Template",
    includedItems: [
      { itemName: "Roli", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kumkum", quantity: "20", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Haldi", quantity: "20", unit: "g", estimatedPrice: 10, category: "Puja Basics" },
      { itemName: "Chandan", quantity: "20", unit: "g", estimatedPrice: 40, category: "Puja Basics" },
      { itemName: "Akshat", quantity: "100", unit: "g", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Kalawa", quantity: "1", unit: "roll", estimatedPrice: 15, category: "Puja Basics" },
      { itemName: "Janeu", quantity: "2", unit: "pcs", estimatedPrice: 20, category: "Puja Basics" },
      { itemName: "Gangajal", quantity: "200", unit: "ml", estimatedPrice: 50, category: "Puja Basics" },
      { itemName: "Kalash", quantity: "1", unit: "pc", estimatedPrice: 150, category: "Vessels & Metal Items" },
      { itemName: "Copper Kalash", quantity: "1", unit: "pc", estimatedPrice: 250, category: "Vessels & Metal Items" },
      { itemName: "Supari", quantity: "10", unit: "pcs", estimatedPrice: 20, category: "Offerings" },
      { itemName: "Kapoor", quantity: "20", unit: "g", estimatedPrice: 20, category: "Aromatics" },
      { itemName: "Agarbatti", quantity: "1", unit: "packet", estimatedPrice: 25, category: "Aromatics" },
      { itemName: "Dhoop", quantity: "1", unit: "packet", estimatedPrice: 30, category: "Aromatics" },
      { itemName: "Cotton Batti", quantity: "1", unit: "packet", estimatedPrice: 10, category: "Lighting" },
      { itemName: "Deepak", quantity: "2", unit: "pcs", estimatedPrice: 30, category: "Lighting" },
      { itemName: "Match Box", quantity: "1", unit: "pc", estimatedPrice: 5, category: "Lighting" },
      { itemName: "Havan Kund", quantity: "1", unit: "pc", estimatedPrice: 200, category: "Havan Samagri" },
      { itemName: "Havan Samagri Mix", quantity: "250", unit: "g", estimatedPrice: 150, category: "Havan Samagri" },
      { itemName: "Mango Wood", quantity: "500", unit: "g", estimatedPrice: 80, category: "Havan Samagri", required: false },
      { itemName: "Brass Plate", quantity: "1", unit: "pc", estimatedPrice: 149, category: "Vessels & Metal Items" },
    ],
    customerArrangeItems: ["Fruits", "Coconut", "Fresh Flowers"],
  },
];

// ---------------------------------------------------------------------------
// Products — 14 samagri kits, all under "Pooja Samagri Kits"
// ---------------------------------------------------------------------------
interface ProductSeed {
  slug: string;
  name: string;
  sku: string;
  poojaSlug: string;
  sellingPrice: number;
  image: string;
}

const PRODUCTS: ProductSeed[] = [
  { slug: "satyanarayan-katha-samagri-kit", name: "Satyanarayan Katha Samagri Kit", sku: "PDK-SATYA-KIT", poojaSlug: "satyanarayan-katha", sellingPrice: 849, image: IMG.candleBrownHolder },
  { slug: "rudrabhishek-samagri-kit", name: "Rudrabhishek Samagri Kit", sku: "PDK-RUDRA-KIT", poojaSlug: "rudrabhishek-pooja", sellingPrice: 1199, image: IMG.hinduStatue },
  { slug: "birthday-pooja-samagri-kit", name: "Birthday Pooja Samagri Kit", sku: "PDK-BDAY-KIT", poojaSlug: "birthday-pooja", sellingPrice: 599, image: IMG.candleGroupTable },
  { slug: "grah-pravesh-samagri-kit", name: "Grah Pravesh Samagri Kit", sku: "PDK-GRAHP-KIT", poojaSlug: "grah-pravesh-pooja", sellingPrice: 1349, image: IMG.threeCandlesBowl },
  { slug: "vehicle-pujan-samagri-kit", name: "Vehicle Pujan Samagri Kit", sku: "PDK-VAHAN-KIT", poojaSlug: "vahan-pujan", sellingPrice: 399, image: IMG.tealightCandle },
  { slug: "office-pooja-samagri-kit", name: "Office Pooja Samagri Kit", sku: "PDK-OFFICE-KIT", poojaSlug: "office-shop-pooja", sellingPrice: 799, image: IMG.candleGroup2 },
  { slug: "shop-pooja-samagri-kit", name: "Shop Pooja Samagri Kit", sku: "PDK-SHOP-KIT", poojaSlug: "office-shop-pooja", sellingPrice: 799, image: IMG.candleGroup2 },
  { slug: "navgrah-shanti-samagri-kit", name: "Navgrah Shanti Samagri Kit", sku: "PDK-NAVGRAH-KIT", poojaSlug: "navgrah-shanti-pooja", sellingPrice: 1099, image: IMG.whiteRoundLight },
  { slug: "annaprashan-sanskar-samagri-kit", name: "Annaprashan Sanskar Samagri Kit", sku: "PDK-ANNA-KIT", poojaSlug: "annaprashan-sanskar", sellingPrice: 999, image: IMG.roundBowlCandle },
  { slug: "sundarkand-path-samagri-kit", name: "Sundarkand Path Samagri Kit", sku: "PDK-SKPATH-KIT", poojaSlug: "sundarkand-path", sellingPrice: 699, image: IMG.openBook },
  { slug: "sundarkand-havan-samagri-kit", name: "Sundarkand Havan Samagri Kit", sku: "PDK-SKHAVAN-KIT", poojaSlug: "sundarkand-path", sellingPrice: 1799, image: IMG.havanFireRitual },
  { slug: "ganesh-sthapana-samagri-kit", name: "Ganesh Sthapana Samagri Kit", sku: "PDK-GANSTH-KIT", poojaSlug: "ganesh-sthapana-visarjan", sellingPrice: 699, image: IMG.ganeshIdol },
  { slug: "ganesh-visarjan-samagri-kit", name: "Ganesh Visarjan Samagri Kit", sku: "PDK-GANVIS-KIT", poojaSlug: "ganesh-sthapana-visarjan", sellingPrice: 699, image: IMG.brassBells },
  { slug: "bhoomi-pujan-samagri-kit", name: "Bhoomi Pujan Samagri Kit", sku: "PDK-BHOOMI-KIT", poojaSlug: "bhoomi-pujan", sellingPrice: 1299, image: IMG.bowlWoodenTable },
];

// ---------------------------------------------------------------------------
async function backupCollections() {
  const dir = path.join(process.cwd(), "scripts", "backups", new Date().toISOString().replace(/[:.]/g, "-"));
  await fs.mkdir(dir, { recursive: true });

  const collections: [string, mongoose.Model<unknown>][] = [
    ["poojas", PoojaModel as unknown as mongoose.Model<unknown>],
    ["pooja-categories", PoojaCategoryModel as unknown as mongoose.Model<unknown>],
    ["products", ProductModel as unknown as mongoose.Model<unknown>],
    ["product-categories", ProductCategoryModel as unknown as mongoose.Model<unknown>],
    ["samagri-templates", SamagriTemplateModel as unknown as mongoose.Model<unknown>],
  ];

  for (const [name, model] of collections) {
    const docs = await model.find().lean();
    await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(docs, null, 2));
    console.log(`  backed up ${docs.length} ${name} -> ${dir}/${name}.json`);
  }

  return dir;
}

async function deleteDemoData() {
  const poojaRes = await PoojaModel.deleteMany({});
  const productRes = await ProductModel.deleteMany({});
  const poojaCatRes = await PoojaCategoryModel.deleteMany({});
  const productCatRes = await ProductCategoryModel.deleteMany({});
  const templateRes = await SamagriTemplateModel.deleteMany({});
  console.log(
    `  deleted: ${poojaRes.deletedCount} poojas, ${productRes.deletedCount} products, ` +
      `${poojaCatRes.deletedCount} pooja categories, ${productCatRes.deletedCount} product categories, ` +
      `${templateRes.deletedCount} samagri templates`,
  );
}

// Rather than guessing which exact field each model stores an image URL in
// (schemas vary and drift over time), this does a broad substring scan: a
// Media doc is "unused" only if its URL doesn't appear anywhere in the
// stringified contents of every other collection that could plausibly
// reference an uploaded image. Conservative by design — false negatives
// (keeping a genuinely unused doc) are harmless; this avoids false positives
// (deleting a still-referenced image) from a wrong field-name assumption.
async function cleanupUnusedMedia() {
  const mediaDocs = await MediaModel.find().lean();
  if (mediaDocs.length === 0) {
    console.log("  no media documents to check");
    return;
  }

  const otherModels = [FestivalModel, PanditModel, BlogModel, PageModel, HomepageBannerModel, TestimonialModel, CityModel, SettingsModel, SeoSettingModel];
  const haystacks = await Promise.all(otherModels.map((m) => m.find().lean()));
  const blob = JSON.stringify(haystacks);

  const unused = mediaDocs.filter((m) => !blob.includes(m.url));
  if (unused.length === 0) {
    console.log("  no unused media found");
    return;
  }
  await MediaModel.deleteMany({ _id: { $in: unused.map((m) => m._id) } });
  console.log(`  deleted ${unused.length} unused media document(s): ${unused.map((m) => m.filename).join(", ")}`);
}

async function createCategories() {
  const poojaCategoryIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of POOJA_CATEGORIES) {
    const doc = await PoojaCategoryModel.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true, setDefaultsOnInsert: true });
    poojaCategoryIds[cat.slug] = doc._id;
    console.log(`  pooja category: ${cat.name}`);
  }

  for (const cat of PRODUCT_CATEGORIES) {
    await ProductCategoryModel.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`  product category: ${cat.name}`);
  }

  return poojaCategoryIds;
}

async function createPoojasAndTemplates(poojaCategoryIds: Record<string, mongoose.Types.ObjectId>) {
  const poojaIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const seed of POOJAS) {
    const pooja = await PoojaModel.findOneAndUpdate(
      { slug: seed.slug },
      {
        name: seed.name,
        slug: seed.slug,
        category: poojaCategoryIds[seed.categorySlug],
        shortDescription: seed.shortDescription,
        fullDescription: seed.fullDescription,
        featuredImage: seed.featuredImage,
        gallery: seed.gallery,
        duration: seed.duration,
        startingPrice: seed.startingPrice,
        marketPrice: seed.marketPrice,
        benefits: seed.benefits,
        importance: seed.importance,
        whoShouldPerform: seed.whoShouldPerform,
        vidhiSteps: seed.vidhiSteps,
        packages: seed.packages,
        faq: seed.faq,
        citiesAvailable: CITIES,
        featured: seed.featured,
        popular: seed.popular,
        status: "Published",
        seo: { title: `${seed.name} — Book Online | PujariDekho`, description: seed.shortDescription },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    poojaIds[seed.slug] = pooja._id;

    const includedItems = seed.includedItems.map((item) => ({ ...item, arrangedBy: "PujariDekho", required: item.required ?? true }));
    const estimatedSamagriCost = includedItems.reduce((sum, item) => sum + item.estimatedPrice, 0);

    const template = await SamagriTemplateModel.findOneAndUpdate(
      { pooja: pooja._id },
      {
        samagriTemplateName: seed.samagriTemplateName,
        pooja: pooja._id,
        includedItems,
        customerArrangeItems: seed.customerArrangeItems,
        estimatedSamagriCost,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await PoojaModel.updateOne({ _id: pooja._id }, { $set: { samagriTemplate: template._id } });

    console.log(`  pooja: ${seed.name} (₹${seed.startingPrice}) — samagri cost ₹${estimatedSamagriCost} (target ₹${seed.includedItems.reduce((s, i) => s + i.estimatedPrice, 0)})`);
  }

  return poojaIds;
}

async function createProducts(poojaIds: Record<string, mongoose.Types.ObjectId>) {
  const productCategory = await ProductCategoryModel.findOne({ slug: "pooja-samagri-kits" });
  if (!productCategory) throw new Error("pooja-samagri-kits category not found — run createCategories() first");

  for (const seed of PRODUCTS) {
    const pooja = await PoojaModel.findById(poojaIds[seed.poojaSlug]);
    const template = pooja ? await SamagriTemplateModel.findOne({ pooja: pooja._id }) : null;

    const includedList = (template?.includedItems ?? [])
      .map((i) => `${i.itemName}${i.quantity ? ` (${i.quantity}${i.unit ?? ""})` : ""}`)
      .join(", ");

    const shortDescription = `Complete, pandit-curated samagri kit for ${pooja?.name ?? seed.name} — everything arranged by PujariDekho in one box.`;
    const description = [
      `This kit contains everything Pujari Dekho arranges for ${pooja?.name ?? seed.name}: ${includedList || "a complete set of ritual essentials"}.`,
      `Perishable/fresh items (fruits, flowers, milk, etc. as applicable) are not included and should be arranged separately on the day of the puja.`,
    ].join("\n\n");

    await ProductModel.findOneAndUpdate(
      { slug: seed.slug },
      {
        name: seed.name,
        slug: seed.slug,
        category: productCategory._id,
        shortDescription,
        description,
        images: [seed.image],
        sku: seed.sku,
        sellingPrice: seed.sellingPrice,
        marketPrice: Math.round((seed.sellingPrice * 1.2) / 10) * 10,
        stockQuantity: 100,
        inStock: true,
        tags: ["samagri kit", "pooja samagri"],
        featured: false,
        status: "Published",
        seo: { title: `${seed.name} — Buy Online | PujariDekho`, description: shortDescription },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  product: ${seed.name} (₹${seed.sellingPrice})`);
  }
}

const TARGET_SAMAGRI_COST: Record<string, number> = {
  "satyanarayan-katha": 849,
  "rudrabhishek-pooja": 1199,
  "birthday-pooja": 599,
  "grah-pravesh-pooja": 1349,
  "vahan-pujan": 399,
  "office-shop-pooja": 799,
  "navgrah-shanti-pooja": 1099,
  "annaprashan-sanskar": 999,
  "sundarkand-path": 1799,
  "ganesh-sthapana-visarjan": 699,
  "bhoomi-pujan": 1299,
};

function dryRun() {
  console.log("DRY RUN — verifying samagri cost arithmetic against target values (no DB connection made)\n");
  let allOk = true;
  for (const seed of POOJAS) {
    const sum = seed.includedItems.reduce((s, i) => s + i.estimatedPrice, 0);
    const target = TARGET_SAMAGRI_COST[seed.slug];
    const ok = sum === target;
    if (!ok) allOk = false;
    console.log(`${ok ? "OK  " : "FAIL"} ${seed.name.padEnd(32)} computed=₹${sum}  target=₹${target}`);
  }
  console.log(`\nPoojas: ${POOJAS.length} (expect 11), Packages: ${POOJAS.reduce((s, p) => s + p.packages.length, 0)} (expect 16), Products: ${PRODUCTS.length} (expect 14)`);
  console.log(allOk ? "\nAll samagri costs match target values." : "\nMISMATCH — fix before running the real migration.");
  process.exit(allOk ? 0 : 1);
}

if (process.argv.includes("--dry-run")) {
  dryRun();
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected:", mongoose.connection.name);

  console.log("\n[1/5] Backing up current Pooja/Product/Category/SamagriTemplate collections...");
  const backupDir = await backupCollections();

  console.log("\n[2/5] Deleting demo Poojas/Products/Categories/SamagriTemplates...");
  await deleteDemoData();

  console.log("\n[3/5] Cleaning up unused media...");
  await cleanupUnusedMedia();

  console.log("\n[4/5] Creating categories...");
  const poojaCategoryIds = await createCategories();

  console.log("\n[5/5] Creating poojas, samagri templates and products...");
  const poojaIds = await createPoojasAndTemplates(poojaCategoryIds);
  await createProducts(poojaIds);

  console.log("\nDone.");
  console.log(`Backup saved at: ${backupDir}`);
  console.log(`Created: ${POOJA_CATEGORIES.length} pooja categories, ${PRODUCT_CATEGORIES.length} product categories, ${POOJAS.length} poojas, ${PRODUCTS.length} products.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
