// SEO Phase 2 (Nov 2026): unique content for 10 priority area pages and make
// them indexable (they were live but noindex while they only had template text).
//   npx tsx scripts/apply-area-pages.ts           # dry run
//   npx tsx scripts/apply-area-pages.ts --apply   # write
//
// Content uses public geography and PujariDekho's real service details only —
// no invented reviews, counts or response-time promises.
import mongoose from "mongoose";
import { config } from "dotenv";

config({ override: true });
const apply = process.argv.includes("--apply");

const BOOKING_FAQ = {
  question: "How do I book a pandit?",
  answer:
    "Choose your puja on the website, pick a date and enter your address. The price is shown before you pay; you can confirm with the ₹99 booking fee or pay in full. Our team then confirms an available verified pandit. You can also book on WhatsApp.",
};
const SAMAGRI_FAQ = {
  question: "Is puja samagri included?",
  answer:
    "Samagri is optional. Add the complete samagri kit while booking and it comes with the pandit ji, or arrange it yourself — the pandit ji shares the list in advance.",
};

type Page = {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  heroTagline: string;
  intro: string;
  content: string;
  coverageNote: string;
  faqs: { question: string; answer: string }[];
};

const PAGES: Page[] = [
  {
    slug: "pandit-in-gaur-city",
    h1: "Book a Pandit in Gaur City, Greater Noida West",
    metaTitle: "Pandit in Gaur City (Gaur City 1 & 2) – PujariDekho",
    metaDescription:
      "Book a verified pandit in Gaur City, Greater Noida West — Griha Pravesh, Satyanarayan Katha, Rudrabhishek and society pujas. Prices shown before you book.",
    heroTagline: "Gaur City 1, Gaur City 2 and the Gaur Chowk area",
    intro:
      "Gaur City is the largest township in Greater Noida West, spread across Gaur City 1 and Gaur City 2 on either side of Gaur Chowk. PujariDekho's own office is at Gaur City Center, so this is the area we know best.",
    content: `<h2>Pujas in Gaur City towers</h2>
<p>Thousands of families have moved into Gaur City's avenues over the last few years, which is why Griha Pravesh, Vastu Shanti and Satyanarayan Katha are among the most booked pujas here. When you book, mention your avenue, tower and flat number so the pandit ji can get the gate pass arranged and reach on time.</p>
<h2>Havan in a high-rise flat</h2>
<p>Many families want a havan with their Griha Pravesh. In a flat this is usually done with a small havan kund on the balcony or in a well-ventilated room. If your society has rules about havan or open flame, tell us while booking and the pandit ji will plan the vidhi accordingly.</p>
<h2>Shops and offices around Gaur City Center</h2>
<p>New shops in the Gaur City markets and offices around Gaur City Center book opening pujas, Lakshmi-Ganesh puja and Diwali puja. The process is the same as for a home puja — pick the puja, choose the date and confirm online.</p>`,
    coverageNote: "Gaur City 1, Gaur City 2, Gaur Chowk and nearby Greater Noida West societies.",
    faqs: [
      BOOKING_FAQ,
      { question: "Do you serve both Gaur City 1 and Gaur City 2?", answer: "Yes. We serve all avenues of Gaur City 1 and Gaur City 2, along with the neighbouring societies of Greater Noida West." },
      { question: "Can a havan be done in a Gaur City flat?", answer: "Usually yes, with a small havan kund on the balcony or in a ventilated room. Check your society's rules and let us know while booking so the pandit ji can plan for it." },
      { question: "Where is PujariDekho's office?", answer: "On the 7th floor of Gaur City Center, Greater Noida West, Uttar Pradesh 201318." },
      SAMAGRI_FAQ,
    ],
  },
  {
    slug: "pandit-in-gaur-city-1",
    h1: "Book a Pandit in Gaur City 1",
    metaTitle: "Pandit in Gaur City 1, Greater Noida West – PujariDekho",
    metaDescription:
      "Book a verified pandit in Gaur City 1 (Greater Noida West) for Griha Pravesh, Satyanarayan Katha, Rudrabhishek and other pujas, with optional samagri kit.",
    heroTagline: "All avenues of Gaur City 1",
    intro:
      "Gaur City 1 is the first phase of the Gaur City township in Greater Noida West, laid out in numbered avenues with high-rise towers, schools and a busy central market. Families here book pujas for new homes, birthdays and festivals throughout the year.",
    content: `<h2>Griha Pravesh in Gaur City 1</h2>
<p>For a Griha Pravesh, the pandit ji typically starts with Gauri-Ganesh puja and Kalash Sthapana, then Vastu and Navgraha puja and a havan, before the family's formal entry into the flat. Share your avenue and tower when booking so the visit can be planned around lift timings and the society gate.</p>
<h2>Festival and family pujas</h2>
<p>Satyanarayan Katha on Purnima, Rudrabhishek in Sawan and on Maha Shivratri, and Lakshmi puja on Diwali are booked regularly in Gaur City 1. For festival dates, book a few days ahead as slots fill quickly.</p>`,
    coverageNote: "Every avenue of Gaur City 1, Greater Noida West.",
    faqs: [
      BOOKING_FAQ,
      { question: "How early should I book for a Griha Pravesh?", answer: "Two to three days ahead is usually enough; for popular muhurat dates book a week ahead. Our team confirms an available verified pandit after you book." },
      SAMAGRI_FAQ,
      { question: "What if the pandit becomes unavailable?", answer: "We try to arrange another verified pandit for the same date and time. If we cannot, you can reschedule free of charge or cancel for a full refund." },
    ],
  },
  {
    slug: "pandit-in-gaur-city-2",
    h1: "Book a Pandit in Gaur City 2",
    metaTitle: "Pandit in Gaur City 2, Greater Noida West – PujariDekho",
    metaDescription:
      "Book a verified pandit in Gaur City 2, Greater Noida West — Griha Pravesh, Katha, Rudrabhishek, Navgrah Shanti and more. Fixed prices shown before you book.",
    heroTagline: "All avenues of Gaur City 2",
    intro:
      "Gaur City 2 is the second phase of the Gaur City township, across Gaur Chowk from Gaur City 1. Many of its towers were handed over recently, so new-home pujas are especially common here.",
    content: `<h2>New flat, first puja</h2>
<p>If you have just got possession in Gaur City 2, a Griha Pravesh or Vastu Shanti before moving in is the most common first booking. Choose a muhurat date, add the samagri kit if you don't want to shop for it, and confirm online.</p>
<h2>Pujas for the whole society</h2>
<p>Residents' groups in Gaur City 2 also organise collective Satyanarayan Katha, Sundarkand Path and festival pujas in the clubhouse. Message us on WhatsApp with the number of families and the date, and we will suggest how many pandits are needed.</p>`,
    coverageNote: "Every avenue of Gaur City 2 and the Gaur Chowk area.",
    faqs: [
      BOOKING_FAQ,
      { question: "Can our tower or society book a community puja?", answer: "Yes. Send us the puja, the expected number of families and the date on WhatsApp, and we will plan the pandits and samagri needed." },
      SAMAGRI_FAQ,
      { question: "Is the price fixed?", answer: "Yes. The package price is shown before you pay, plus a ₹99 booking fee. The samagri kit is optional and its price is shown when you add it." },
    ],
  },
  {
    slug: "pandit-in-sector-137-noida",
    h1: "Book a Pandit in Sector 137, Noida",
    metaTitle: "Pandit in Sector 137 Noida (Expressway) – PujariDekho",
    metaDescription:
      "Book a verified pandit in Sector 137, Noida on the Noida–Greater Noida Expressway — Griha Pravesh, Satyanarayan Katha and more, with optional samagri kit.",
    heroTagline: "Societies along the Noida–Greater Noida Expressway",
    intro:
      "Sector 137 sits on the Noida–Greater Noida Expressway, with large residential societies such as Paras Tierea, Logix Blossom County and Supertech Ecociti, and its own station on the Aqua Line metro.",
    content: `<h2>Pujas in Expressway societies</h2>
<p>Families in Sector 137 book Griha Pravesh when moving in, Satyanarayan Katha for family occasions, and Navgrah Shanti and Rudrabhishek at important times. Mention your society and tower while booking — most societies here need a visitor entry at the gate.</p>
<h2>Working families, weekend pujas</h2>
<p>Because many residents work in Noida's offices, weekends and holidays are the busiest puja days in Sector 137. Book a few days ahead for a Saturday or Sunday, and tell us your preferred time.</p>`,
    coverageNote: "Sector 137 and nearby Expressway sectors in Noida.",
    faqs: [
      BOOKING_FAQ,
      { question: "Can I book a puja for a weekend morning?", answer: "Yes. Choose your preferred date and time while booking; weekends fill up first, so booking a few days ahead helps." },
      SAMAGRI_FAQ,
      { question: "Do you serve other Expressway sectors?", answer: "Yes — we serve sectors across Noida along the Expressway as well as Sector 137. Enter your address while booking to check." },
    ],
  },
  {
    slug: "pandit-in-alpha-greater-noida",
    h1: "Book a Pandit in Alpha, Greater Noida",
    metaTitle: "Pandit in Alpha 1 & Alpha 2, Greater Noida – PujariDekho",
    metaDescription:
      "Book a verified pandit in Alpha 1 and Alpha 2, Greater Noida — Griha Pravesh, Bhoomi Pujan, Satyanarayan Katha and more. Prices shown before you book.",
    heroTagline: "Alpha 1, Alpha 2 and the Alpha Commercial Belt",
    intro:
      "Alpha 1 and Alpha 2 are among Greater Noida's original sectors, made up mostly of independent houses and plots, with the Alpha Commercial Belt and an Aqua Line metro station close by.",
    content: `<h2>Pujas in independent houses</h2>
<p>In Alpha's kothis and plotted houses, families often have space for a full havan in the courtyard or on the terrace, so Griha Pravesh with havan and Vastu Shanti are popular. When a house is being built or rebuilt, Bhoomi Pujan before construction is also commonly booked here.</p>
<h2>Shop openings in the commercial belt</h2>
<p>Shops and offices in the Alpha Commercial Belt book opening pujas, Lakshmi-Ganesh puja and Diwali puja. Choose Office / Shop Puja and the pandit ji will perform the vidhi at your premises.</p>`,
    coverageNote: "Alpha 1, Alpha 2 and nearby Greater Noida sectors.",
    faqs: [
      BOOKING_FAQ,
      { question: "Do you do Bhoomi Pujan before construction?", answer: "Yes. Book Bhoomi Pujan for the plot, choose a muhurat date and the pandit ji will perform the puja at the site before work begins." },
      SAMAGRI_FAQ,
      { question: "Can the havan be done outdoors?", answer: "Yes. In independent houses the havan is often done in the courtyard or on the terrace — tell us your preference when booking." },
    ],
  },
  {
    slug: "pandit-in-beta-greater-noida",
    h1: "Book a Pandit in Beta, Greater Noida",
    metaTitle: "Pandit in Beta 1 & Beta 2, Greater Noida – PujariDekho",
    metaDescription:
      "Book a verified pandit in Beta 1 and Beta 2, Greater Noida for Griha Pravesh, Satyanarayan Katha, Rudrabhishek and family pujas. Optional samagri kit.",
    heroTagline: "Beta 1, Beta 2 and nearby sectors",
    intro:
      "Beta 1 and Beta 2 are established residential sectors of Greater Noida, a short distance from Pari Chowk, with a mix of independent houses and group housing.",
    content: `<h2>Family pujas through the year</h2>
<p>Families in Beta book Satyanarayan Katha for birthdays and anniversaries, Rudrabhishek in Sawan, and Navgrah Shanti when their pandit or astrologer advises it. For a new home or a renovated house, Griha Pravesh and Vastu Shanti are common.</p>
<h2>Planning a puja at home</h2>
<p>Book online with your date and address, add the samagri kit if you want everything brought with the pandit ji, and keep fresh items like fruits, flowers and mithai ready yourself.</p>`,
    coverageNote: "Beta 1, Beta 2 and nearby Greater Noida sectors.",
    faqs: [
      BOOKING_FAQ,
      SAMAGRI_FAQ,
      { question: "What do I need to keep ready?", answer: "Fresh items such as fruits, mithai, flowers and milk are kept ready by the family. Everything else comes with the samagri kit if you add it." },
      { question: "What if I need to change the date?", answer: "You can request a new date from your account. It is free up to 24 hours before the puja; within 24 hours it depends on pandit availability." },
    ],
  },
  {
    slug: "pandit-in-gamma-greater-noida",
    h1: "Book a Pandit in Gamma, Greater Noida",
    metaTitle: "Pandit in Gamma 1 & Gamma 2, Greater Noida – PujariDekho",
    metaDescription:
      "Book a verified pandit in Gamma 1 and Gamma 2, Greater Noida — Griha Pravesh, Katha, Rudrabhishek and shop pujas around Jagat Farm market.",
    heroTagline: "Gamma 1, Gamma 2 and Jagat Farm market",
    intro:
      "Gamma 1 and Gamma 2 are residential sectors of Greater Noida known for the busy Jagat Farm market, with independent houses and local shops close together.",
    content: `<h2>Home pujas in Gamma</h2>
<p>Griha Pravesh, Satyanarayan Katha and Rudrabhishek are the pujas families in Gamma book most. Independent houses usually have room for a full havan, which the pandit ji can perform in the courtyard or on the terrace.</p>
<h2>Shops in and around Jagat Farm</h2>
<p>Shopkeepers around Jagat Farm market book opening pujas for new shops, Lakshmi-Ganesh puja on Diwali and puja for new vehicles. Choose Office / Shop Puja or Vahan Pujan when booking.</p>`,
    coverageNote: "Gamma 1, Gamma 2 and the Jagat Farm area.",
    faqs: [
      BOOKING_FAQ,
      { question: "Do you do shop opening pujas?", answer: "Yes. Book Office / Shop Puja for a new shop or office; the pandit ji performs the puja at your premises on the chosen date." },
      { question: "Can I book a Vahan Pujan for a new vehicle?", answer: "Yes. Vahan Pujan takes 30 minutes to an hour and can be done at your home or shop." },
      SAMAGRI_FAQ,
    ],
  },
  {
    slug: "pandit-in-knowledge-park",
    h1: "Book a Pandit in Knowledge Park, Greater Noida",
    metaTitle: "Pandit in Knowledge Park, Greater Noida – PujariDekho",
    metaDescription:
      "Book a verified pandit in Knowledge Park, Greater Noida for office, institute and home pujas — Satyanarayan Katha, Saraswati and Lakshmi-Ganesh puja.",
    heroTagline: "Knowledge Park I–V, Greater Noida",
    intro:
      "Knowledge Park is Greater Noida's institutional zone, home to universities, colleges, hostels and the India Expo Mart, along with residential pockets and PG accommodation.",
    content: `<h2>Pujas for institutions and offices</h2>
<p>Colleges, coaching centres and offices in Knowledge Park book pujas for new buildings and departments, Saraswati puja, and Lakshmi-Ganesh puja on Diwali. Book Office / Shop Puja and mention the venue and expected number of people.</p>
<h2>Home pujas nearby</h2>
<p>Families living in and around Knowledge Park book the same home pujas as the rest of Greater Noida — Griha Pravesh, Satyanarayan Katha and Rudrabhishek — with an optional samagri kit.</p>`,
    coverageNote: "Knowledge Park I–V and nearby Greater Noida sectors.",
    faqs: [
      BOOKING_FAQ,
      { question: "Can an institute or office book a puja?", answer: "Yes. Book Office / Shop Puja, choose the date and mention the venue. For a larger event, message us on WhatsApp to plan the number of pandits." },
      SAMAGRI_FAQ,
      { question: "Is a GST invoice available?", answer: "Yes, an invoice is generated for every completed booking and is available in your account." },
    ],
  },
  {
    slug: "pandit-in-sector-62-noida",
    h1: "Book a Pandit in Sector 62, Noida",
    metaTitle: "Pandit in Sector 62 Noida for Office & Home Puja – PujariDekho",
    metaDescription:
      "Book a verified pandit in Sector 62, Noida — office openings, Diwali Lakshmi puja, Satyanarayan Katha and home pujas. Prices shown before you book.",
    heroTagline: "Sector 62 offices, institutions and homes",
    intro:
      "Sector 62 is one of Noida's main office and institutional hubs, with IT companies, corporate offices and institutes, served by the Blue Line metro and close to residential sectors.",
    content: `<h2>Office pujas in Sector 62</h2>
<p>Companies in Sector 62 book pujas when opening a new office or floor, starting a new financial year, and for Lakshmi-Ganesh puja on Diwali. Office / Shop Puja takes two to three hours; tell us the office timing so the puja can be finished before work begins.</p>
<h2>Home pujas for families nearby</h2>
<p>Families in and around Sector 62 book Griha Pravesh, Satyanarayan Katha and Rudrabhishek at home. Pick the puja and date online, and add the samagri kit if needed.</p>`,
    coverageNote: "Sector 62 and nearby Noida sectors.",
    faqs: [
      BOOKING_FAQ,
      { question: "Can the office puja be done before office hours?", answer: "Yes. Choose an early slot and mention your office timing; the pandit ji plans the puja to finish before work starts." },
      { question: "Can we get an invoice for the company?", answer: "Yes, an invoice is generated for every completed booking and is available in your account." },
      SAMAGRI_FAQ,
    ],
  },
  {
    slug: "pandit-in-sector-63-noida",
    h1: "Book a Pandit in Sector 63, Noida",
    metaTitle: "Pandit in Sector 63 Noida for Factory, Office & Home Puja – PujariDekho",
    metaDescription:
      "Book a verified pandit in Sector 63, Noida — factory and unit openings, Vishwakarma and Lakshmi puja, Bhoomi Pujan and home pujas.",
    heroTagline: "Sector 63 factories, offices and homes",
    intro:
      "Sector 63 is one of Noida's industrial and commercial sectors, with manufacturing units, export houses and offices, and a station on the Blue Line metro.",
    content: `<h2>Pujas for factories and units</h2>
<p>Units in Sector 63 book a puja when starting a new factory or production line, Bhoomi Pujan before construction, Vishwakarma puja for machines and tools, and Lakshmi-Ganesh puja on Diwali. Book Office / Shop Puja and mention the unit address and the shift timing.</p>
<h2>Home pujas nearby</h2>
<p>Families in the residential sectors around Sector 63 book Griha Pravesh, Satyanarayan Katha and Rudrabhishek with an optional samagri kit.</p>`,
    coverageNote: "Sector 63 and nearby Noida sectors.",
    faqs: [
      BOOKING_FAQ,
      { question: "Do you do pujas for new factories or machines?", answer: "Yes — factory and unit opening pujas, Bhoomi Pujan before construction, and Vishwakarma puja for machines and tools." },
      { question: "Can the puja be done before the shift starts?", answer: "Yes. Choose an early slot and tell us the shift timing when booking." },
      SAMAGRI_FAQ,
    ],
  },
];

await mongoose.connect(process.env.MONGODB_URI!);
const col = mongoose.connection.db!.collection("seopages");
for (const p of PAGES) {
  const doc = await col.findOne({ slug: p.slug });
  if (!doc) {
    console.log(`  ! ${p.slug} not found — skipped`);
    continue;
  }
  console.log(`${apply ? "APPLY" : "DRY  "} ${p.slug}: ${doc.indexable ? "indexable" : "noindex"} -> indexable, ${p.faqs.length} FAQs`);
  if (apply) {
    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          h1: p.h1,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          heroTagline: p.heroTagline,
          intro: p.intro,
          content: p.content,
          coverageNote: p.coverageNote,
          faqs: p.faqs,
          indexable: true,
          status: "published",
          showInDirectory: true,
          updatedAt: new Date(),
        },
      },
    );
  }
}
await mongoose.disconnect();
