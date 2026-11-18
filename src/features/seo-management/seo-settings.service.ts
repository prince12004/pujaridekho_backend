import { SeoSettingsModel } from "../../models/seo-settings.model.js";

// Starting copy shown until an admin edits it. Everything here is editable in
// Admin → SEO Management → Page Content Settings; saved values always win.
// Placeholders: {place} = location / city name.
export const DEFAULT_SEO_SETTINGS = {
  landing: {
    bookButtonLabel: "Book Pandit Ji",
    whatsappButtonLabel: "Book on WhatsApp",
    whatsappMessage: "Namaste, I want to book a pandit in {place}.",
    servicesEyebrow: "Popular Pujas",
    businessServicesEyebrow: "Business Pujas",
    servicesHeading: "Pujas we perform in {place}",
    servicesHeadingNoPlace: "Pujas for this occasion",
    coverageHeading: "Areas we cover in {place}",
    whyEyebrow: "Why PujariDekho",
    whyHeading: "Why families book with us",
    whyItems: [
      { title: "Verified pandits", text: "Every pandit ji is verified before being assigned to a booking." },
      { title: "Price shown upfront", text: "You see the puja price before you pay — no surprises on the day." },
      { title: "Samagri optional", text: "Add the samagri while booking and it comes with the pandit ji." },
      { title: "WhatsApp support", text: "Questions about muhurat or vidhi? Message our team any time." },
    ],
    stepsEyebrow: "How It Works",
    stepsHeading: "Book in four simple steps",
    steps: [
      { title: "Choose your puja", text: "Pick the puja and package that suits the occasion." },
      { title: "Add address & date", text: "Enter where the puja will happen and your preferred date." },
      { title: "Confirm online", text: "Pay the ₹99 booking amount or the full amount to confirm." },
      { title: "Pandit ji arrives", text: "Your assigned pandit ji performs the puja at your place." },
    ],
    reviewsEyebrow: "Reviews",
    reviewsHeading: "What our customers say",
    faqEyebrow: "FAQs",
    faqHeading: "Questions about booking a pandit in {place}",
    faqHeadingNoPlace: "Frequently asked questions",
    relatedHeadingHome: "Office & business pujas",
    relatedHeadingBusiness: "Related puja services",
    nearbyHeading: "Nearby locations",
    citiesHeading: "Available in these cities",
    finalCtaEyebrow: "Book Now",
    finalCtaHeading: "Book your pandit in {place}",
    finalCtaHeadingNoPlace: "Book your pandit ji today",
    finalCtaText: "Choose your puja, pick a date and confirm online — or message our team on WhatsApp.",
    // Basic page for a city that has no written SEO page yet (always noindex).
    cityFallbackHeading: "Book a Pandit in {place}",
    cityFallbackIntro:
      "Book an experienced, verified pandit ji in {place} for puja at home, in your society or at your office. Choose your puja below — the price is shown before you book.",
    cityFallbackMetaTitle: "Pandit in {place} | Book Pandit Ji Online – PujariDekho",
    cityFallbackMetaDescription: "Book a verified pandit in {place} for Griha Pravesh, Satyanarayan Katha, Rudrabhishek and more. Clear pricing and easy online booking.",
  },
  directory: {
    title: "Explore Pandit Booking Locations in Delhi NCR",
    description:
      "Find and book experienced Pandit Ji for Hindu puja ceremonies across Noida, Greater Noida, Ghaziabad, Delhi and Gurugram. Explore our location-wise services covering residential sectors, popular societies and commercial areas.",
    officeGroupTitle: "Office Puja Locations",
    servicesGroupTitle: "Office & Business Puja Services",
    emptyText: "Location pages are being prepared. Please check back soon.",
  },
  footer: {
    blurb:
      "PujariDekho connects families and businesses across Noida, Greater Noida, Greater Noida West, Ghaziabad, Delhi and Gurugram with verified, experienced pandits for every ritual — with the price shown before you book.",
    bookButtonLabel: "Book Pandit Ji",
    bookButtonUrl: "/poojas",
    newsletterTitle: "Subscribe to Our Newsletter",
    newsletterText: "Vidhi guides, festival muhurat dates and special offers — straight to your inbox.",
    trustBadges: ["Verified & Experienced Pandits", "Secure & Encrypted Payments", "Trusted by Thousands of Families", "24/7 Customer Support"],
    copyright: "© {year} PujariDekho. All rights reserved.",
    showAllLocationsLink: true,
  },
};

export type SeoSettings = typeof DEFAULT_SEO_SETTINGS;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Saved values over defaults. Empty strings / empty lists fall back to the default. */
function mergeDefaults<T>(defaults: T, saved: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(saved)) {
    if (saved === undefined || saved === null) return defaults;
    if (typeof saved === "string" && !saved.trim()) return defaults;
    if (Array.isArray(saved) && saved.length === 0) return defaults;
    return saved as T;
  }
  const out: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(defaults)) out[key] = mergeDefaults((defaults as Record<string, unknown>)[key], saved[key]);
  return out as T;
}

let cache: { at: number; data: SeoSettings } | null = null;
const TTL_MS = 60_000;

export async function getSeoSettings(): Promise<SeoSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const doc = await SeoSettingsModel.findOne({ key: "global" }).lean();
  const data = mergeDefaults(DEFAULT_SEO_SETTINGS, doc ?? {});
  cache = { at: Date.now(), data };
  return data;
}

export async function saveSeoSettings(input: Partial<SeoSettings>) {
  await SeoSettingsModel.updateOne({ key: "global" }, { $set: { ...input, key: "global" } }, { upsert: true });
  cache = null;
  return getSeoSettings();
}

export async function resetSeoSettings() {
  await SeoSettingsModel.deleteOne({ key: "global" });
  cache = null;
  return getSeoSettings();
}
