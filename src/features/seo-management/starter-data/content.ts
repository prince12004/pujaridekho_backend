// Hand-written content for the core Delhi NCR SEO pages. Every page has its
// own copy — no "same text, different city" pages. Claims are limited to
// what PujariDekho actually offers (online booking, ₹99 booking amount,
// optional samagri, WhatsApp support, Gaur City Center office); no invented
// statistics, reviews or addresses.

export interface SeedService {
  label: string;
  // Case-insensitive pooja-name pattern matched against published poojas at seed time.
  pooja?: string;
  // Fallback URL when no pooja matches (an SEO service page).
  url?: string;
}

export interface SeedPage {
  slug: string;
  pageType: "location" | "office_location" | "service";
  location?: string; // location slug
  name: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  heroTagline: string;
  intro: string;
  content: string;
  coverageNote?: string;
  faqs: { question: string; answer: string }[];
  services: SeedService[];
  directoryOrder: number;
}

// Location pages are seeded with NO hand-picked services: they then show
// every published pooja from the catalogue automatically (see
// getPublicPageBySlug), so new poojas appear without editing each page.
// This list is kept only as a reference for admins curating a page by hand.
export const HOME_SERVICES: SeedService[] = [
  { label: "Griha Pravesh Puja", pooja: "griha pravesh" },
  { label: "Satyanarayan Katha", pooja: "satyanarayan" },
  { label: "Rudrabhishek Puja", pooja: "rudrabhishek" },
  { label: "Vastu Shanti Puja", pooja: "vastu shanti" },
  { label: "Ganesh Puja", pooja: "ganesh" },
  { label: "Havan", pooja: "havan" },
  { label: "Birthday Puja", pooja: "birthday" },
  { label: "Marriage Puja", pooja: "marriage|vivah" },
  { label: "Mundan Puja", pooja: "mundan" },
  { label: "Namkaran Puja", pooja: "namkaran" },
  { label: "Vahan Puja", pooja: "vehicle|vahan" },
  { label: "Office Puja", pooja: "office", url: "/office-puja" },
  { label: "Shop Opening Puja", pooja: "shop", url: "/shop-opening-puja" },
  { label: "Business Opening Puja", url: "/business-opening-puja" },
  { label: "Diwali Puja", pooja: "diwali|lakshmi", url: "/diwali-office-puja" },
];

export const BUSINESS_SERVICES: SeedService[] = [
  { label: "Office / Shop Opening Puja", pooja: "office ?/ ?shop|shop.*opening|office.*opening" },
  { label: "Office Diwali Puja", pooja: "diwali" },
  { label: "Ganesh Puja", pooja: "ganesh" },
  { label: "Vastu Shanti Puja", pooja: "vastu shanti" },
  { label: "Satyanarayan Katha", pooja: "satyanarayan" },
  { label: "Navgrah Shanti Puja", pooja: "navgrah" },
  { label: "Bhoomi Pujan", pooja: "bhoomi|bhumi" },
  { label: "Havan", pooja: "havan" },
];

const bookingFaqs = {
  howToBook: {
    question: "How do I book a pandit through PujariDekho?",
    answer:
      "Choose your puja on the website, enter your address and preferred date, and confirm the booking by paying the ₹99 booking amount (or the full amount) online. You can also message us on WhatsApp and our team will help you book.",
  },
  samagri: {
    question: "Do I need to arrange the puja samagri myself?",
    answer:
      "No. While booking you can choose to add the samagri, and it will be brought along for the puja. If you prefer to arrange it yourself, simply leave it out and the pandit ji will share the list in advance.",
  },
};

export const SEED_PAGES: SeedPage[] = [
  // ------------------------------------------------------------------ City pages
  {
    slug: "pandit-in-noida",
    pageType: "location",
    location: "noida",
    name: "Pandit in Noida",
    h1: "Book a Pandit in Noida for Every Puja",
    metaTitle: "Pandit in Noida | Book Pandit Ji for Puja at Home – PujariDekho",
    metaDescription:
      "Book a verified pandit in Noida for Griha Pravesh, Satyanarayan Katha, Rudrabhishek, Vastu Shanti and office puja. Clear pricing, samagri option, easy online booking.",
    heroTagline: "Sector homes, Expressway high-rises and offices",
    intro:
      "From the older sectors around Sector 18 and Sector 50 to the high-rise societies along the Noida–Greater Noida Expressway, PujariDekho helps families in Noida book an experienced pandit ji for puja at home, in their society or at their office — with the price shown before you book.",
    content: `<h2>Puja at home in Noida, planned properly</h2>
<p>Noida is a city of numbered sectors, and most families here live in apartments — which changes how a puja is planned. A Griha Pravesh in a new flat in Sector 150 or Sector 137 has to fit around possession dates, society rules on havan smoke and lift timings, while a Satyanarayan Katha in an independent house in Sector 50 has more room for a full havan. When you book, tell us about the space and the pandit ji will plan the vidhi to suit it.</p>
<h2>What families in Noida usually book</h2>
<p>New possessions along the Expressway keep Griha Pravesh and Vastu Shanti among the most requested pujas, alongside Satyanarayan Katha for family occasions, Rudrabhishek in Sawan, and Mundan and Namkaran ceremonies for children. Businesses in Sector 62, Sector 63 and Sector 18 book office opening and Diwali Lakshmi puja for their premises.</p>
<h2>How booking works</h2>
<p>Pick the puja, choose your date and add samagri if you want it brought along. You can confirm with a ₹99 booking amount and pay the rest later, or pay in full online. If you are unsure about the muhurat or which puja suits the occasion, message us on WhatsApp before you book and we will guide you.</p>
<p>Looking for a specific society or sector? Use the list below — and if your society is not listed yet, you can still book; we serve homes across Noida.</p>`,
    coverageNote: "Residential sectors, Noida Expressway societies, Sector 18, Sector 62 and Sector 63 commercial areas.",
    faqs: [
      bookingFaqs.howToBook,
      {
        question: "Can a havan be done inside a Noida high-rise apartment?",
        answer:
          "Yes, a small havan can usually be done on a balcony or near a window, but many societies have their own rules. Check with your society office, and tell us while booking — the pandit ji can keep the havan small or suggest a puja without a large fire.",
      },
      {
        question: "Which pujas are most booked for new flats in Noida?",
        answer:
          "Griha Pravesh is the usual puja when moving into a new flat, often combined with Vastu Shanti. Many families also keep a Satyanarayan Katha soon after moving in.",
      },
      bookingFaqs.samagri,
    ],
    services: HOME_SERVICES,
    directoryOrder: 1,
  },
  {
    slug: "pandit-in-greater-noida",
    pageType: "location",
    location: "greater-noida",
    name: "Pandit in Greater Noida",
    h1: "Book a Pandit in Greater Noida",
    metaTitle: "Pandit in Greater Noida | Book Pandit Ji Online – PujariDekho",
    metaDescription:
      "Book an experienced pandit in Greater Noida — Alpha, Beta, Gamma, Delta, Pari Chowk and Knowledge Park. Griha Pravesh, Katha, Havan and business puja with clear pricing.",
    heroTagline: "Alpha, Beta, Gamma, Delta and beyond",
    intro:
      "Greater Noida's wide, planned sectors — Alpha, Beta, Gamma and Delta, the areas around Pari Chowk and Knowledge Park — are home to independent houses, plotted colonies and newer societies. PujariDekho helps you book a pandit ji here for home, family and business pujas without the usual back-and-forth.",
    content: `<h2>Pujas in Greater Noida's plotted sectors</h2>
<p>Many families in Greater Noida live in independent houses and builder floors in the Greek-letter sectors. That usually means space for a complete vidhi — a full havan for Griha Pravesh, a Satyanarayan Katha with the whole family seated together, or a Rudrabhishek on a Monday in Sawan. Let us know whether it is a house, a floor or an apartment so the pandit ji can plan the puja and samagri accordingly.</p>
<h2>For students, families and new businesses</h2>
<p>Knowledge Park is surrounded by colleges and hostels, and many families book a puja when a child starts a new course or moves into a new home nearby. Shops, showrooms and units in Kasna and the Ecotech industrial areas book opening pujas, Vishwakarma puja and Diwali Lakshmi puja for their premises.</p>
<h2>Simple, transparent booking</h2>
<p>Choose the puja, your date and whether you want samagri included. The price is shown before you pay, and you can confirm with a ₹99 booking amount. For muhurat questions, message us on WhatsApp and we will help you pick a suitable time.</p>`,
    coverageNote: "Alpha, Beta, Gamma, Delta, Pari Chowk, Knowledge Park, Kasna and Ecotech industrial areas.",
    faqs: [
      bookingFaqs.howToBook,
      {
        question: "Do you cover Greater Noida West (Noida Extension) as well?",
        answer:
          "Yes. Greater Noida West has its own page because most homes there are high-rise societies — see 'Pandit in Greater Noida West' for Gaur City, Techzone 4 and nearby societies.",
      },
      {
        question: "Can I book a puja for a new shop or factory in Greater Noida?",
        answer:
          "Yes. Shop, showroom and factory opening pujas are available for Kasna, Ecotech and other commercial areas. See our business opening and factory opening puja pages for details.",
      },
      bookingFaqs.samagri,
    ],
    services: HOME_SERVICES,
    directoryOrder: 2,
  },
  {
    slug: "pandit-in-greater-noida-west",
    pageType: "location",
    location: "greater-noida-west",
    name: "Pandit in Greater Noida West",
    h1: "Book a Pandit in Greater Noida West (Noida Extension)",
    metaTitle: "Pandit in Greater Noida West & Noida Extension – PujariDekho",
    metaDescription:
      "Book a pandit in Greater Noida West / Noida Extension — Gaur City, Techzone 4, Bisrakh and nearby societies. Griha Pravesh, Katha, Rudrabhishek and more.",
    heroTagline: "Gaur City, Techzone 4, Bisrakh and nearby societies",
    intro:
      "Greater Noida West — still called Noida Extension by most residents — is where PujariDekho's office is, at Gaur City Center. It is almost entirely high-rise societies, from Gaur City 1 and Gaur City 2 to the Supertech Eco Villages and the societies along the main sector roads, and we know how pujas are planned in these towers.",
    content: `<h2>Puja in a Noida Extension society</h2>
<p>With so many families getting possession of new flats here, Griha Pravesh and Vastu Shanti are booked every week in Greater Noida West. In a high-rise, the pandit ji plans around practical details: entry passes at the society gate, the time the lift is free for samagri, and whether the society allows a havan on the balcony. Mention your tower and flat when booking so the visit goes smoothly.</p>
<h2>Community pujas and festivals</h2>
<p>Societies in Noida Extension also organise collective pujas — Satyanarayan Katha in the clubhouse, Sundarkand Path, or Durga and Ganesh puja during festivals. Residents' associations can contact us on WhatsApp to plan a community puja with the right number of pandits.</p>
<h2>Shops and offices around Gaur City</h2>
<p>New shops in the society markets and offices in Techzone 4 regularly book opening pujas and Diwali Lakshmi puja. Booking works the same way: pick the puja, choose the date, add samagri if needed and confirm online with a ₹99 booking amount.</p>`,
    coverageNote: "Gaur City 1 & 2, Techzone 4, Bisrakh and high-rise societies across Noida Extension.",
    faqs: [
      bookingFaqs.howToBook,
      {
        question: "Is Greater Noida West the same as Noida Extension?",
        answer:
          "Yes — the area officially called Greater Noida West is widely known as Noida Extension. Both names refer to the same set of societies around Gaur City, Bisrakh and Techzone 4.",
      },
      {
        question: "Can our society book a community puja in the clubhouse?",
        answer:
          "Yes. Message us on WhatsApp with the puja, expected number of families and the date. We will suggest how many pandits are needed and share the samagri requirement.",
      },
      {
        question: "Where is PujariDekho's office?",
        answer: "Our office is on the 7th floor of Gaur City Center, Greater Noida West, Uttar Pradesh 201318.",
      },
    ],
    services: HOME_SERVICES,
    directoryOrder: 3,
  },
  {
    slug: "pandit-in-ghaziabad",
    pageType: "location",
    location: "ghaziabad",
    name: "Pandit in Ghaziabad",
    h1: "Book a Pandit in Ghaziabad",
    metaTitle: "Pandit in Ghaziabad | Indirapuram, Vaishali, Raj Nagar Extension",
    metaDescription:
      "Book a pandit in Ghaziabad — Indirapuram, Vaishali, Vasundhara, Raj Nagar Extension and Crossing Republik. Home, society and business pujas with clear pricing.",
    heroTagline: "Indirapuram, Vaishali, Vasundhara, Raj Nagar Extension",
    intro:
      "Ghaziabad mixes established colonies like Vaishali and Vasundhara with the busy societies of Indirapuram and the newer towers of Raj Nagar Extension and Crossing Republik. Whatever kind of home you live in, PujariDekho helps you book a pandit ji for the puja you need, with the price shown upfront.",
    content: `<h2>Established colonies and new townships</h2>
<p>In the older parts of Ghaziabad, families often book pujas tied to long-standing traditions — Satyanarayan Katha on Purnima, Rudrabhishek in Sawan or a havan on a family anniversary. In Raj Nagar Extension and Crossing Republik, where many residents have moved into new flats, Griha Pravesh and Vastu Shanti are the most common requests.</p>
<h2>Close to Delhi, easy to plan</h2>
<p>Indirapuram, Vaishali and Kaushambi sit right on the Delhi border, so many families here book pujas for parents or relatives living across the border too. You can book for any address — just enter the address where the puja will happen.</p>
<h2>Business pujas in Ghaziabad</h2>
<p>Offices in Kaushambi and units in the Sahibabad industrial area book office opening, Vishwakarma and Diwali Lakshmi puja. Choose the puja online, pick a date, add samagri if you want it brought along and confirm with the ₹99 booking amount — or message us on WhatsApp to plan it with our team.</p>`,
    coverageNote: "Indirapuram, Vaishali, Vasundhara, Kaushambi, Raj Nagar Extension, Crossing Republik and Sahibabad.",
    faqs: [
      bookingFaqs.howToBook,
      {
        question: "Can I book a puja in Ghaziabad for a family member while I live elsewhere?",
        answer:
          "Yes. Enter the Ghaziabad address where the puja will be performed and the contact number of the person who will be at home. You can pay online from anywhere.",
      },
      {
        question: "Which puja should we do when moving into a new flat in Raj Nagar Extension?",
        answer:
          "Griha Pravesh is the traditional puja for moving in, and many families add Vastu Shanti. If you are unsure, message us on WhatsApp and we will suggest what suits your date and family tradition.",
      },
      bookingFaqs.samagri,
    ],
    services: HOME_SERVICES,
    directoryOrder: 4,
  },
  {
    slug: "pandit-in-delhi",
    pageType: "location",
    location: "delhi",
    name: "Pandit in Delhi",
    h1: "Book a Pandit in Delhi",
    metaTitle: "Pandit in Delhi | Book Pandit Ji for Puja at Home – PujariDekho",
    metaDescription:
      "Book a pandit in Delhi — Dwarka, Rohini, Janakpuri, Laxmi Nagar and South Delhi. Griha Pravesh, Satyanarayan Katha, Rudrabhishek and office puja, booked online.",
    heroTagline: "Dwarka, Rohini, Janakpuri, Laxmi Nagar, South Delhi",
    intro:
      "Delhi's homes range from DDA flats and group housing societies in Dwarka and Rohini to kothis and builder floors in South Delhi. PujariDekho lets you book a pandit ji for a home, family or office puja anywhere in the city online, with the vidhi, samagri and price clear before you confirm.",
    content: `<h2>Pujas across Delhi's neighbourhoods</h2>
<p>In Dwarka's sector societies and Rohini's apartments, families often keep pujas compact — a Satyanarayan Katha in the living room or a small havan on the balcony. In builder floors and independent homes in South Delhi and West Delhi colonies like Janakpuri, there is usually room for a fuller ceremony. Tell us about your home while booking so the pandit ji can plan accordingly.</p>
<h2>Family ceremonies</h2>
<p>Along with Griha Pravesh and Vastu Shanti for a new home, Delhi families regularly book Mundan, Namkaran and birthday pujas for children, Rudrabhishek during Sawan and Shivratri, and havans for anniversaries and remembrance. In East Delhi around Laxmi Nagar, many young families book their first puja in a new home with us.</p>
<h2>Offices and shops in Delhi</h2>
<p>Offices in Connaught Place and Nehru Place and units in Okhla book opening pujas, Vastu Shanti for a new office and Diwali Lakshmi puja. Booking is the same for homes and businesses: pick the puja, choose the date, add samagri if needed and confirm online.</p>`,
    coverageNote: "Dwarka, Rohini, Janakpuri, Laxmi Nagar, South Delhi, Connaught Place, Nehru Place and Okhla.",
    faqs: [
      bookingFaqs.howToBook,
      {
        question: "Do you send pandits to all parts of Delhi?",
        answer:
          "You can book for any Delhi address. Enter your address while booking; if a particular date or area needs extra planning, our team will contact you before the puja.",
      },
      {
        question: "Can I book a puja for a Delhi office before working hours?",
        answer:
          "Yes. Many offices prefer an early-morning puja before staff arrive. Choose the date while booking and mention the preferred time — or message us on WhatsApp to plan it.",
      },
      bookingFaqs.samagri,
    ],
    services: HOME_SERVICES,
    directoryOrder: 5,
  },
  {
    slug: "pandit-in-gurugram",
    pageType: "location",
    location: "gurugram",
    name: "Pandit in Gurugram",
    h1: "Book a Pandit in Gurugram (Gurgaon)",
    metaTitle: "Pandit in Gurugram (Gurgaon) | Book Pandit Ji – PujariDekho",
    metaDescription:
      "Book a pandit in Gurugram — DLF Phases, Golf Course Road, Sohna Road and Cyber City. Griha Pravesh, Vastu Shanti, Katha and corporate office puja, booked online.",
    heroTagline: "DLF Phases, Golf Course Road, Sohna Road, Cyber City",
    intro:
      "Gurugram is a city of large gated communities — the DLF Phases, the towers along Golf Course Road and Golf Course Extension Road, and the newer sectors off Sohna Road — and of corporate offices in Cyber City and Udyog Vihar. PujariDekho helps residents and businesses here book an experienced pandit ji online.",
    content: `<h2>Puja in Gurugram's gated communities</h2>
<p>Most homes in Gurugram are in gated societies with their own security and visitor processes. When you book, share your tower and apartment number and any society timing rules, so the pandit ji arrives on time and with the right samagri. Griha Pravesh and Vastu Shanti are the most booked pujas for new homes here, along with Satyanarayan Katha for family occasions.</p>
<h2>Corporate and office pujas</h2>
<p>With so many companies in Cyber City, Golf Course Road and Udyog Vihar, office opening puja, corporate Ganesh–Lakshmi puja and Diwali puja for teams are a big part of what Gurugram books. These are usually scheduled early, before the working day begins, and kept within the time the building management allows.</p>
<h2>Booking from anywhere</h2>
<p>Many Gurugram residents book pujas for their home while travelling or for parents living nearby. Everything is online: choose the puja, set the date, add samagri if you want it brought along and pay a ₹99 booking amount to confirm. Our WhatsApp team can help with muhurat and planning questions.</p>`,
    coverageNote: "DLF Phases, Golf Course Road, Golf Course Extension Road, Sohna Road, Cyber City and Udyog Vihar.",
    faqs: [
      bookingFaqs.howToBook,
      {
        question: "Is Gurugram the same as Gurgaon?",
        answer: "Yes. The city was officially renamed Gurugram, but it is still widely called Gurgaon. Both refer to the same city.",
      },
      {
        question: "Can you organise a puja for our company's office in Cyber City?",
        answer:
          "Yes. Corporate office pujas can be scheduled early in the morning or at a time your building allows. See our corporate office puja page, or message us on WhatsApp to plan it.",
      },
      bookingFaqs.samagri,
    ],
    services: HOME_SERVICES,
    directoryOrder: 6,
  },

  // ------------------------------------------------------------------ Office city pages
  {
    slug: "office-puja-in-noida",
    pageType: "office_location",
    location: "noida",
    name: "Office Puja in Noida",
    h1: "Office Puja in Noida",
    metaTitle: "Office Puja in Noida | Office Opening & Diwali Puja – PujariDekho",
    metaDescription:
      "Book office opening, Vastu Shanti and Diwali Lakshmi puja for offices in Noida — Sector 62, Sector 63, Sector 18 and Expressway business parks.",
    heroTagline: "Sector 62, Sector 63, Sector 18 and the Expressway",
    intro:
      "Noida's offices are spread across the IT buildings of Sector 62, the industrial and office units of Sector 63, the market around Sector 18 and the business parks along the Noida–Greater Noida Expressway. PujariDekho arranges office pujas here that fit around building rules and your team's schedule.",
    content: `<h2>Planning an office puja in Noida</h2>
<p>Most offices in Noida sit inside managed buildings, so a puja has to work with the building's rules — fire safety, whether a havan is permitted, and the hours when the floor is free. We usually suggest a Ganesh and Lakshmi puja with kalash sthapana for an office opening, which can be done without a large fire, and add a small havan only where the building allows it.</p>
<h2>Which puja for which occasion</h2>
<p>For a new office or a shift to a new floor, an office opening puja (often combined with Vastu Shanti) is the usual choice. Factories and units in Sector 63 often book Vishwakarma puja for machines and tools. Before Diwali, many teams book a Lakshmi–Ganesh puja on the office premises for the whole staff.</p>
<h2>Timing and booking</h2>
<p>Office pujas are commonly done early in the morning, before the working day starts, or on a weekend. Choose the puja and date online and add samagri if you want it brought along. For a corporate booking with specific requirements, message us on WhatsApp and our team will plan it with you.</p>`,
    coverageNote: "Sector 62 and Sector 63, Sector 18, and business parks along the Noida Expressway.",
    faqs: [
      {
        question: "Can an office puja be done without a havan?",
        answer:
          "Yes. A Ganesh–Lakshmi puja with kalash sthapana is complete without a havan. Where the building allows it, a small havan can be added.",
      },
      {
        question: "How long does an office opening puja take?",
        answer:
          "It depends on the vidhi chosen — a simple Ganesh–Lakshmi puja is shorter than one combined with Vastu Shanti and havan. The pandit ji will confirm the duration when planning with you.",
      },
      {
        question: "Can we book a Diwali puja for our Noida office?",
        answer: "Yes. Diwali Lakshmi–Ganesh puja for offices can be booked in advance; dates close to Diwali fill up quickly, so book early.",
      },
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 1,
  },
  {
    slug: "office-puja-in-greater-noida",
    pageType: "office_location",
    location: "greater-noida",
    name: "Office Puja in Greater Noida",
    h1: "Office & Factory Puja in Greater Noida",
    metaTitle: "Office & Factory Puja in Greater Noida – PujariDekho",
    metaDescription:
      "Book office opening, factory opening, Vishwakarma and Diwali puja in Greater Noida — Kasna, Ecotech industrial areas, Knowledge Park and Pari Chowk.",
    heroTagline: "Kasna, Ecotech, Knowledge Park and Pari Chowk",
    intro:
      "Greater Noida has a large industrial base in Kasna and the Ecotech areas, alongside offices, institutes and showrooms around Knowledge Park and Pari Chowk. PujariDekho arranges opening and festival pujas for factories, warehouses, offices and showrooms across the city.",
    content: `<h2>Factory and industrial pujas</h2>
<p>For a new factory or a new production line, businesses in Kasna and Ecotech usually book a factory opening puja — Ganesh puja, Vastu Shanti for the premises and a blessing of machinery — and many repeat Vishwakarma puja every year. These pujas are planned around shift timings so production is not disturbed.</p>
<h2>Offices, showrooms and institutes</h2>
<p>Offices and showrooms around Pari Chowk and Knowledge Park book office opening puja and Diwali Lakshmi puja. Coaching centres and institutes often keep a Saraswati or Ganesh puja when opening a new branch.</p>
<h2>How to book</h2>
<p>Choose the puja and the date online and add samagri if you would like it brought along. For larger premises or multiple pandits, message us on WhatsApp with the details and our team will plan the puja with you before confirming.</p>`,
    coverageNote: "Kasna and Ecotech industrial areas, Knowledge Park and Pari Chowk.",
    faqs: [
      {
        question: "Do you arrange Vishwakarma puja for factories?",
        answer: "Yes. Vishwakarma puja for machines, tools and workshops can be arranged; message us on WhatsApp to plan it for your factory.",
      },
      {
        question: "Can the puja be scheduled between shifts?",
        answer: "Yes. Tell us your shift timings when booking and we will plan the puja so production is not interrupted.",
      },
      bookingFaqs.howToBook,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 2,
  },
  {
    slug: "office-puja-in-greater-noida-west",
    pageType: "office_location",
    location: "greater-noida-west",
    name: "Office Puja in Greater Noida West",
    h1: "Office & Shop Puja in Greater Noida West",
    metaTitle: "Office & Shop Puja in Greater Noida West – PujariDekho",
    metaDescription:
      "Book office and shop opening puja in Greater Noida West / Noida Extension — Techzone 4, Gaur City markets and society shopping complexes.",
    heroTagline: "Techzone 4, Gaur City and society markets",
    intro:
      "Greater Noida West's business life is in its shop-lined society markets, the commercial complexes around Gaur City and the offices of Techzone 4. PujariDekho's own office is at Gaur City Center, and we arrange shop and office opening pujas across Noida Extension.",
    content: `<h2>Shop opening in Noida Extension</h2>
<p>New shops, clinics, salons and restaurants open in Greater Noida West's society markets every month. A shop opening puja is usually a Ganesh and Lakshmi puja with kalash sthapana on the opening morning, often timed by muhurat. It is kept compact so the shop can open for customers soon after.</p>
<h2>Offices in Techzone 4 and commercial towers</h2>
<p>Offices in Techzone 4 and the commercial towers around Gaur City book office opening and Vastu Shanti pujas when moving in, and Lakshmi–Ganesh puja before Diwali. As with any office building, we plan around the building's rules on fire and timing.</p>
<h2>Book online or on WhatsApp</h2>
<p>Choose the puja and date online, add samagri if you want it brought along and confirm with the ₹99 booking amount. For a muhurat for your opening day, message us on WhatsApp.</p>`,
    coverageNote: "Techzone 4, Gaur City commercial complexes and society shopping markets.",
    faqs: [
      {
        question: "Can you suggest a muhurat for our shop opening?",
        answer: "Yes. Message us on WhatsApp with the dates you are considering and we will help you choose a suitable muhurat.",
      },
      {
        question: "How early should we book a shop opening puja?",
        answer: "A few days in advance is ideal, and more for festival dates or popular muhurats, which fill up quickly.",
      },
      bookingFaqs.samagri,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 3,
  },
  {
    slug: "office-puja-in-ghaziabad",
    pageType: "office_location",
    location: "ghaziabad",
    name: "Office Puja in Ghaziabad",
    h1: "Office & Business Puja in Ghaziabad",
    metaTitle: "Office & Business Opening Puja in Ghaziabad – PujariDekho",
    metaDescription:
      "Book office opening, factory and Diwali puja in Ghaziabad — Kaushambi offices, Sahibabad industrial area, Indirapuram and Raj Nagar Extension markets.",
    heroTagline: "Kaushambi, Sahibabad, Indirapuram and Raj Nagar Extension",
    intro:
      "Ghaziabad's businesses range from offices in Kaushambi and units in the Sahibabad industrial area to the shops and showrooms of Indirapuram and Raj Nagar Extension. PujariDekho arranges office, shop and factory pujas across the city.",
    content: `<h2>Offices and commercial spaces</h2>
<p>Offices in Kaushambi's commercial towers, being right next to Delhi, often plan their opening puja early in the morning before staff and clients arrive. A Ganesh–Lakshmi puja with Vastu Shanti is the usual choice when moving into a new office.</p>
<h2>Industrial units in Sahibabad</h2>
<p>Factories and workshops in the Sahibabad industrial area book factory opening puja for new premises and Vishwakarma puja for machines. We plan the puja around production schedules and share the samagri requirement in advance.</p>
<h2>Shops and showrooms</h2>
<p>New shops and showrooms in Indirapuram, Vaishali and Raj Nagar Extension book shop opening puja and Diwali Lakshmi puja. Booking is online — choose the puja, pick the date, add samagri if needed and confirm — or message us on WhatsApp to plan a larger puja.</p>`,
    coverageNote: "Kaushambi, Sahibabad industrial area, Indirapuram, Vaishali and Raj Nagar Extension.",
    faqs: [
      {
        question: "Do you arrange pujas for factories in Sahibabad?",
        answer: "Yes. Factory opening and Vishwakarma puja can be arranged; message us on WhatsApp with your requirements.",
      },
      {
        question: "Which puja is done when opening a new office?",
        answer: "Usually a Ganesh–Lakshmi puja with kalash sthapana, often combined with Vastu Shanti for the new premises.",
      },
      bookingFaqs.howToBook,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 4,
  },
  {
    slug: "office-puja-in-delhi",
    pageType: "office_location",
    location: "delhi",
    name: "Office Puja in Delhi",
    h1: "Office Puja in Delhi",
    metaTitle: "Office Puja in Delhi | Office Opening & Diwali Puja – PujariDekho",
    metaDescription:
      "Book office opening, Vastu Shanti and Diwali Lakshmi puja in Delhi — Connaught Place, Nehru Place, Okhla and offices across the city.",
    heroTagline: "Connaught Place, Nehru Place, Okhla and beyond",
    intro:
      "From the office blocks of Connaught Place and Nehru Place to the factories and offices in Okhla, Delhi has businesses of every size. PujariDekho arranges office opening, Vastu Shanti and Diwali pujas for offices, shops and units across the city.",
    content: `<h2>Office pujas in central and south Delhi</h2>
<p>Offices in Connaught Place and Nehru Place are often in older, busy buildings where space and timing are limited. A compact Ganesh–Lakshmi puja with kalash sthapana works well here, done early in the morning before the building gets busy.</p>
<h2>Industrial and mixed-use areas</h2>
<p>Okhla's industrial area has both factories and corporate offices. Factories book opening and Vishwakarma pujas; offices book opening and Vastu Shanti pujas when they move in. We plan each around the premises and working hours.</p>
<h2>Diwali puja for your team</h2>
<p>Many Delhi businesses keep a Lakshmi–Ganesh puja at the office before Diwali, with the whole team present. These dates are in high demand, so book early. Choose the puja and date online, add samagri if you want it brought along, or message us on WhatsApp to plan.</p>`,
    coverageNote: "Connaught Place, Nehru Place, Okhla and business districts across Delhi.",
    faqs: [
      {
        question: "Can the puja be done before the office opens?",
        answer: "Yes. Most office pujas are scheduled early in the morning; mention your preferred time while booking.",
      },
      {
        question: "Is a havan necessary for an office puja?",
        answer: "No. A Ganesh–Lakshmi puja is complete without a havan. A small havan can be added where the building permits.",
      },
      bookingFaqs.samagri,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 5,
  },
  {
    slug: "office-puja-in-gurugram",
    pageType: "office_location",
    location: "gurugram",
    name: "Office Puja in Gurugram",
    h1: "Corporate & Office Puja in Gurugram",
    metaTitle: "Office & Corporate Puja in Gurugram (Gurgaon) – PujariDekho",
    metaDescription:
      "Book corporate office puja in Gurugram — Cyber City, Udyog Vihar, Golf Course Road and Sohna Road. Office opening, Vastu Shanti and Diwali puja.",
    heroTagline: "Cyber City, Udyog Vihar, Golf Course Road, Sohna Road",
    intro:
      "Gurugram's corporate offices — in Cyber City, along Golf Course Road and Sohna Road, and in Udyog Vihar — regularly mark new offices, new floors and festivals with a puja. PujariDekho arranges corporate pujas that respect building rules and fit around your team's day.",
    content: `<h2>Corporate pujas in managed office buildings</h2>
<p>Most Gurugram offices are in managed towers with strict fire and access rules. We plan corporate pujas accordingly: a Ganesh–Lakshmi puja with kalash sthapana that needs no open fire, done early in the morning or at a time approved by building management, with visitor passes arranged in advance.</p>
<h2>New office, new floor, new financial year</h2>
<p>Companies book an office opening puja when moving in or expanding to a new floor, Vastu Shanti for a new office, and Lakshmi–Ganesh puja before Diwali or at the start of the financial year. Units in Udyog Vihar also book Vishwakarma puja.</p>
<h2>Planning with our team</h2>
<p>For a straightforward puja, choose it online, pick a date and confirm. For a corporate booking with several pandits, specific timings or an invoice requirement, message us on WhatsApp and our team will plan it with you.</p>`,
    coverageNote: "Cyber City, Udyog Vihar, Golf Course Road and Sohna Road business districts.",
    faqs: [
      {
        question: "Can a puja be done in an office where open fire is not allowed?",
        answer: "Yes. A Ganesh–Lakshmi puja with kalash sthapana does not need a havan, and is a complete puja for an office opening.",
      },
      {
        question: "Can we schedule the puja at the start of the financial year?",
        answer: "Yes. Many companies keep a Lakshmi–Ganesh puja in April; book early as these dates are popular.",
      },
      bookingFaqs.howToBook,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 6,
  },

  // ------------------------------------------------------------------ Service pages
  {
    slug: "office-puja",
    pageType: "service",
    name: "Office Puja",
    h1: "Office Puja in Delhi NCR",
    metaTitle: "Office Puja in Delhi NCR | Book Pandit for Office – PujariDekho",
    metaDescription:
      "Book office puja in Noida, Greater Noida, Ghaziabad, Delhi and Gurugram — opening, Vastu Shanti and Diwali puja planned around your building and team.",
    heroTagline: "Opening, Vastu Shanti and festival pujas for your workplace",
    intro:
      "An office puja is a way to begin a new workplace — or a new year in an old one — with blessings for the business and the people who work there. PujariDekho arranges office pujas across Delhi NCR, planned around your building's rules and your team's schedule.",
    content: `<h2>What an office puja includes</h2>
<p>Most office pujas centre on Lord Ganesh, for a smooth beginning, and Goddess Lakshmi, for prosperity. A typical vidhi includes sankalp, kalash sthapana, Ganesh and Lakshmi puja, and aarti. Where the building allows, a small havan is added; where it does not, the puja is complete without it.</p>
<h2>Choosing the right office puja</h2>
<ul>
<li><strong>Office opening puja</strong> — when moving into a new office or floor.</li>
<li><strong>Office Vastu Shanti</strong> — to address Vastu concerns in a new or existing office.</li>
<li><strong>Diwali office puja</strong> — Lakshmi–Ganesh puja with the team before Diwali.</li>
<li><strong>Corporate office puja</strong> — larger pujas for companies with several teams or floors.</li>
</ul>
<h2>Planning around your office</h2>
<p>Tell us the address, the building's rules on fire, and when the space is free. Pujas are usually done early in the morning or on a weekend. Choose the city below for local details, or message us on WhatsApp to plan a corporate puja.</p>`,
    faqs: [
      {
        question: "Which deities are worshipped in an office puja?",
        answer: "Usually Lord Ganesh and Goddess Lakshmi, with kalash sthapana. Some businesses also include Navgraha puja or Vastu Shanti.",
      },
      {
        question: "Do you provide the samagri?",
        answer: "You can add samagri while booking and it will be brought along. Otherwise the pandit ji shares the list in advance.",
      },
      {
        question: "Which cities do you cover for office puja?",
        answer: "Noida, Greater Noida (including Greater Noida West), Ghaziabad, Delhi and Gurugram.",
      },
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 1,
  },
  {
    slug: "office-opening-puja",
    pageType: "service",
    name: "Office Opening Puja",
    h1: "Office Opening Puja",
    metaTitle: "Office Opening Puja | Book Pandit for New Office – PujariDekho",
    metaDescription:
      "Book an office opening puja for your new office in Delhi NCR. Ganesh–Lakshmi puja, kalash sthapana and optional havan, planned around your building rules.",
    heroTagline: "Begin your new office with the right blessings",
    intro:
      "Moving into a new office is a milestone for any business. An office opening puja — traditionally performed on an auspicious muhurat before the team starts working in the new space — marks that beginning with prayers to Lord Ganesh and Goddess Lakshmi.",
    content: `<h2>When to do the office opening puja</h2>
<p>The puja is usually done on the first day the office is used, before work begins, on a muhurat chosen for the date. If your move-in date is fixed, we can suggest a suitable time on that day; if it is flexible, we can help you choose a good date.</p>
<h2>The vidhi</h2>
<p>An office opening puja typically includes sankalp in the name of the business and its owners, kalash sthapana, Ganesh puja, Lakshmi puja and aarti. Many businesses add Vastu Shanti for the new premises or a short havan where the building allows a small fire. Some also place a Shree Yantra or Lakshmi–Ganesh idol in the office during the puja.</p>
<h2>Before the pandit ji arrives</h2>
<p>Keep a clean space near the entrance or in the main area for the puja, a small table or chowki, and a place for the team to sit or stand. If you have added samagri to your booking, it will be brought along; otherwise you will receive the list in advance. Book online, or message us on WhatsApp if you need help planning.</p>`,
    faqs: [
      {
        question: "Can the office opening puja be done after the office has started working?",
        answer: "Yes. If the office is already in use, the puja can still be done on an auspicious day, ideally before working hours.",
      },
      {
        question: "Should we combine it with Vastu Shanti?",
        answer: "Many businesses do, especially for a newly built or renovated space. The pandit ji can advise based on your premises.",
      },
      bookingFaqs.howToBook,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 2,
  },
  {
    slug: "corporate-office-puja",
    pageType: "service",
    name: "Corporate Office Puja",
    h1: "Corporate Office Puja",
    metaTitle: "Corporate Office Puja in Delhi NCR – PujariDekho",
    metaDescription:
      "Plan a corporate office puja for your company in Delhi NCR — multiple floors or teams, building-safe vidhi without open fire, early-morning scheduling.",
    heroTagline: "Pujas planned for companies, teams and managed buildings",
    intro:
      "A corporate office puja is planned differently from a puja at home: more people attend, buildings have strict rules, and the timing has to fit around work. PujariDekho plans corporate pujas for companies across Delhi NCR — from a single floor to a full campus.",
    content: `<h2>What makes a corporate puja different</h2>
<p>In a managed office building, open fire is often not allowed, visitor access has to be arranged in advance, and the puja has to finish before the working day. We plan the vidhi accordingly — usually a Ganesh–Lakshmi puja with kalash sthapana that needs no havan — and coordinate the timing with your facilities team.</p>
<h2>Occasions companies mark with a puja</h2>
<ul>
<li>Opening a new office, floor or branch</li>
<li>Start of the financial year</li>
<li>Diwali Lakshmi–Ganesh puja with the whole team</li>
<li>Vishwakarma puja for workshops, labs and production areas</li>
</ul>
<h2>Several floors or locations</h2>
<p>For larger offices, more than one pandit can be arranged so the puja is completed on several floors at once, or across branches on the same day. Message us on WhatsApp with the number of locations, people and your preferred timing, and our team will plan it with you.</p>`,
    faqs: [
      {
        question: "Can you arrange pujas at several of our offices on the same day?",
        answer: "Yes, subject to availability. Share the locations and timings on WhatsApp and we will plan the number of pandits needed.",
      },
      {
        question: "Our building does not allow fire. Can we still have a puja?",
        answer: "Yes. A Ganesh–Lakshmi puja with kalash sthapana is complete without a havan.",
      },
      {
        question: "Which cities are covered?",
        answer: "Noida, Greater Noida (including Greater Noida West), Ghaziabad, Delhi and Gurugram.",
      },
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 3,
  },
  {
    slug: "office-vastu-shanti-puja",
    pageType: "service",
    name: "Office Vastu Shanti Puja",
    h1: "Office Vastu Shanti Puja",
    metaTitle: "Office Vastu Shanti Puja | Book Pandit – PujariDekho",
    metaDescription:
      "Book Vastu Shanti puja for your office or shop in Delhi NCR — for new premises, renovations or Vastu concerns. Vidhi planned around your building.",
    heroTagline: "Vastu Shanti for new, renovated or existing workplaces",
    intro:
      "Vastu Shanti puja is performed to honour Vastu Purush, the deity of the building, and to seek harmony in a space. Businesses book it when moving into a new office or shop, after renovation, or when they feel the premises have Vastu concerns.",
    content: `<h2>When businesses book Vastu Shanti</h2>
<p>The most common time is before or alongside an office opening, especially for a newly built or heavily renovated space. Some businesses also book it later, after structural changes or when the layout of the office does not follow Vastu principles and cannot easily be changed.</p>
<h2>What the puja involves</h2>
<p>The vidhi generally includes Ganesh puja, kalash sthapana, Vastu Purush puja, Navgraha puja and, traditionally, a havan. In buildings where fire is not allowed, the pandit ji will explain how the puja can be adapted. The duration depends on the vidhi you choose.</p>
<h2>Combining with an opening puja</h2>
<p>Vastu Shanti and office opening puja are often done together on the same muhurat, so the team begins work in the new space after both are complete. Book online, or message us on WhatsApp to discuss the premises before booking.</p>`,
    faqs: [
      {
        question: "Is Vastu Shanti only for new offices?",
        answer: "No. It is commonly done for new premises, but also after renovation or when a business wants to address Vastu concerns in an existing office.",
      },
      {
        question: "Does Vastu Shanti require a havan?",
        answer: "Traditionally it includes a havan. Where fire is not allowed, the pandit ji can advise how the puja can be adapted.",
      },
      bookingFaqs.samagri,
    ],
    services: [
      { label: "Vastu Shanti Puja", pooja: "vastu shanti" },
      { label: "Office / Shop Opening Puja", pooja: "office ?/ ?shop|shop.*opening|office.*opening" },
      { label: "Navgrah Shanti Puja", pooja: "navgrah" },
      { label: "Ganesh Puja", pooja: "ganesh" },
    ],
    directoryOrder: 4,
  },
  {
    slug: "shop-opening-puja",
    pageType: "service",
    name: "Shop Opening Puja",
    h1: "Shop Opening Puja",
    metaTitle: "Shop Opening Puja | Book Pandit for New Shop – PujariDekho",
    metaDescription:
      "Book a shop opening puja in Delhi NCR — Ganesh–Lakshmi puja on your opening muhurat for shops, showrooms, clinics, salons and restaurants.",
    heroTagline: "Open your doors on an auspicious muhurat",
    intro:
      "Opening a shop — whether a kirana store, showroom, clinic, salon or restaurant — is traditionally begun with a puja on the opening morning. PujariDekho arranges shop opening pujas across Delhi NCR, timed to your muhurat and kept compact so you can open for customers soon after.",
    content: `<h2>The opening-day puja</h2>
<p>A shop opening puja usually includes Ganesh puja for a smooth beginning, Lakshmi puja for prosperity, kalash sthapana and aarti. Many shopkeepers also perform puja of the cash counter, account books (bahi-khata) or the first item to be sold. A small havan can be added if the space allows.</p>
<h2>Choosing the muhurat</h2>
<p>The opening time is usually chosen by muhurat. If your opening date is fixed, we can help you pick a suitable time on that day; popular dates around festivals fill up fast, so book early.</p>
<h2>Shops in society markets and malls</h2>
<p>For shops inside a mall or a society market, the pandit ji keeps to the complex's rules on fire and timing. Book online — choose the puja, date and samagri — or message us on WhatsApp for help with the muhurat.</p>`,
    faqs: [
      {
        question: "Can the shop opening puja be done inside a mall?",
        answer: "Yes. The puja is adapted to the mall's rules — usually without a havan — and timed before the mall opens to customers.",
      },
      {
        question: "Can you help choose the opening muhurat?",
        answer: "Yes. Message us on WhatsApp with the dates you are considering.",
      },
      bookingFaqs.samagri,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 5,
  },
  {
    slug: "business-opening-puja",
    pageType: "service",
    name: "Business Opening Puja",
    h1: "Business Opening Puja",
    metaTitle: "Business Opening Puja | New Business Puja – PujariDekho",
    metaDescription:
      "Book a business opening puja in Delhi NCR for a new company, startup, branch or venture — Ganesh, Lakshmi and Navgraha puja on an auspicious muhurat.",
    heroTagline: "For new companies, ventures and branches",
    intro:
      "Starting a business — registering a company, launching a startup, opening a new branch or beginning a partnership — is a moment many families mark with a puja. A business opening puja seeks blessings for the venture, its founders and the people who will work in it.",
    content: `<h2>Not only for a new building</h2>
<p>Unlike an office or shop opening, a business opening puja is about the venture itself. It can be done at the new premises, at home before the first day of business, or at a branch. Some founders time it to the date the company starts operations or signs its first agreement.</p>
<h2>What is usually included</h2>
<p>The vidhi commonly includes Ganesh puja, Lakshmi puja and kalash sthapana, with many families adding Navgraha puja or a Satyanarayan Katha for the new venture. The pandit ji will suggest a vidhi suited to the type of business and the space.</p>
<h2>Booking</h2>
<p>Choose the puja and date online and add samagri if you want it brought along. If you would like help choosing the vidhi or muhurat, message us on WhatsApp before booking.</p>`,
    faqs: [
      {
        question: "Can a business opening puja be done at home?",
        answer: "Yes. Many founders perform it at home, especially for online or remote businesses without a separate office.",
      },
      {
        question: "What is the difference between business opening and office opening puja?",
        answer: "Office opening puja is for a new workplace; business opening puja is for the start of a venture, wherever it is performed. They are often combined.",
      },
      bookingFaqs.howToBook,
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 6,
  },
  {
    slug: "factory-opening-puja",
    pageType: "service",
    name: "Factory Opening Puja",
    h1: "Factory Opening Puja",
    metaTitle: "Factory Opening Puja & Vishwakarma Puja – PujariDekho",
    metaDescription:
      "Book a factory opening puja in Delhi NCR — Ganesh puja, Vastu Shanti and blessing of machinery for new factories, units and warehouses.",
    heroTagline: "For new factories, units, workshops and warehouses",
    intro:
      "A factory opening puja is performed before production begins in a new factory, unit or warehouse. It seeks safe, uninterrupted work for the people and machines in it. PujariDekho arranges factory pujas in industrial areas across Delhi NCR, from Greater Noida and Sahibabad to Okhla and Udyog Vihar.",
    content: `<h2>What is included</h2>
<p>A factory opening puja usually combines Ganesh puja, Vastu Shanti for the premises and a puja of the machinery, tools and vehicles that will be used. Many factories also perform Vishwakarma puja — for the divine architect and patron of craftsmen — at opening and every year after.</p>
<h2>Planning around production</h2>
<p>Factories are large spaces with safety rules of their own. We plan where the puja and any havan will be done, which machines will be blessed, and timing around shifts so that work is not interrupted. More than one pandit can be arranged for large premises.</p>
<h2>Book with our team</h2>
<p>Because factory pujas vary a lot, we recommend messaging us on WhatsApp with the address, the size of the premises and your preferred date. Our team will plan the vidhi and samagri with you before confirming.</p>`,
    faqs: [
      {
        question: "Can the machines be blessed during the puja?",
        answer: "Yes. Puja of machinery, tools and vehicles is a standard part of a factory opening puja.",
      },
      {
        question: "Do you also arrange the annual Vishwakarma puja?",
        answer: "Yes. Message us on WhatsApp before Vishwakarma Puja to book for your factory.",
      },
      {
        question: "Which industrial areas do you cover?",
        answer: "Industrial areas across Noida, Greater Noida, Ghaziabad, Delhi and Gurugram — including Kasna, Ecotech, Sahibabad, Okhla and Udyog Vihar.",
      },
    ],
    services: BUSINESS_SERVICES,
    directoryOrder: 7,
  },
  {
    slug: "commercial-property-puja",
    pageType: "service",
    name: "Commercial Property Puja",
    h1: "Commercial Property Puja",
    metaTitle: "Commercial Property Puja | Bhoomi & Opening Puja – PujariDekho",
    metaDescription:
      "Book a puja for commercial property in Delhi NCR — on purchase, possession, before renovation or before letting out an office, shop or showroom.",
    heroTagline: "For owners of offices, shops and commercial spaces",
    intro:
      "Owners of commercial property often mark key moments with a puja — buying or taking possession of an office or shop, starting construction or renovation, or before the space is let out or opened. PujariDekho arranges these pujas across Delhi NCR.",
    content: `<h2>Common occasions</h2>
<ul>
<li><strong>Bhoomi puja</strong> before construction starts on a commercial plot.</li>
<li><strong>Possession puja</strong> when taking over a new office, shop or showroom.</li>
<li><strong>Vastu Shanti</strong> after renovation or structural changes.</li>
<li><strong>Puja before letting out</strong> or before your own business begins in the space.</li>
</ul>
<h2>Owner or tenant</h2>
<p>A commercial property puja is usually arranged by the owner, while an opening puja is done by the business that will use the space. Some owners and tenants perform them together. Tell us whether the space is vacant, under construction or ready to use, so the pandit ji can plan the vidhi.</p>
<h2>Booking</h2>
<p>Choose the puja online or message us on WhatsApp with the property address and the occasion. Our team will suggest the right puja and help you with the muhurat.</p>`,
    faqs: [
      {
        question: "Do you perform bhoomi puja for commercial plots?",
        answer: "Yes. Message us on WhatsApp with the plot location and planned construction date.",
      },
      {
        question: "Is a puja needed before renting out an office?",
        answer: "It is a matter of tradition, not a requirement. Many owners like to perform Vastu Shanti or a Satyanarayan Katha before letting a space out.",
      },
      bookingFaqs.samagri,
    ],
    services: [
      { label: "Vastu Shanti Puja", pooja: "vastu shanti" },
      { label: "Office / Shop Opening Puja", pooja: "office ?/ ?shop|shop.*opening|office.*opening" },
      { label: "Satyanarayan Katha", pooja: "satyanarayan" },
      { label: "Bhoomi Puja", pooja: "bhoomi|bhumi" },
      { label: "Ganesh Puja", pooja: "ganesh" },
    ],
    directoryOrder: 8,
  },
  {
    slug: "diwali-office-puja",
    pageType: "service",
    name: "Diwali Office Puja",
    h1: "Diwali Puja for Office & Shop",
    metaTitle: "Diwali Office Puja | Lakshmi Ganesh Puja at Office – PujariDekho",
    metaDescription:
      "Book Diwali Lakshmi–Ganesh puja for your office, shop or factory in Delhi NCR. Book early — Diwali muhurats are in high demand.",
    heroTagline: "Lakshmi–Ganesh puja for your workplace this Diwali",
    intro:
      "Diwali is the most important day of the year for many businesses. Offices, shops and factories across Delhi NCR perform Lakshmi–Ganesh puja on Diwali or the days before it, often with the whole team, and many traders begin new account books (bahi-khata) on this day.",
    content: `<h2>Diwali puja at the workplace</h2>
<p>The Diwali office puja centres on Goddess Lakshmi and Lord Ganesh, with puja of the cash box, account books, and in many businesses, Kuber. It is usually done in the evening on the Diwali muhurat for shops and traders, or on a working day before Diwali for offices whose teams will be on leave.</p>
<h2>Book early</h2>
<p>Diwali muhurats are the busiest dates of the year for pandits. If your team's puja is on a specific day and time, book well in advance so we can confirm a pandit ji for that slot.</p>
<h2>Planning the puja</h2>
<p>Tell us how many people will attend, whether a small havan is allowed and whether you need puja of account books or Kuber. Add samagri while booking, or message us on WhatsApp for a corporate Diwali puja across several locations.</p>`,
    faqs: [
      {
        question: "Can we do the Diwali puja on a day before Diwali?",
        answer: "Yes. Many offices hold it on the last working day before Diwali so the whole team can attend.",
      },
      {
        question: "Do you include puja of the account books?",
        answer: "Yes. Bahi-khata and cash box puja can be included — mention it while booking.",
      },
      bookingFaqs.howToBook,
    ],
    services: [
      { label: "Diwali Lakshmi Puja", pooja: "diwali|lakshmi" },
      { label: "Ganesh Puja", pooja: "ganesh" },
      { label: "Office / Shop Opening Puja", pooja: "office ?/ ?shop|shop.*opening|office.*opening" },
    ],
    directoryOrder: 9,
  },
];
