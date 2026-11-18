// Delhi NCR location seed for the SEO landing-page system.
//
// Society → sector/locality ("parent") assignments are only filled in where
// the society's location is well established; everything else is attached
// to its city and can be refined in Admin → SEO Management → Societies.
// Please verify parents before publishing a society page.

export interface SeedCity {
  slug: string;
  name: string;
  sortOrder: number;
}

export interface SeedArea {
  city: string; // city slug
  type: "sector" | "locality" | "commercial";
  name: string;
  slug: string;
  areaLabel?: string;
}

export interface SeedSociety {
  city: string;
  name: string;
  slug: string;
  parent?: string; // area slug
}

export const SEED_CITIES: SeedCity[] = [
  { slug: "noida", name: "Noida", sortOrder: 1 },
  { slug: "greater-noida", name: "Greater Noida", sortOrder: 2 },
  { slug: "greater-noida-west", name: "Greater Noida West", sortOrder: 3 },
  { slug: "ghaziabad", name: "Ghaziabad", sortOrder: 4 },
  { slug: "delhi", name: "Delhi", sortOrder: 5 },
  { slug: "gurugram", name: "Gurugram", sortOrder: 6 },
];

export const SEED_AREAS: SeedArea[] = [
  // Noida
  { city: "noida", type: "sector", name: "Sector 50, Noida", slug: "sector-50-noida" },
  { city: "noida", type: "sector", name: "Sector 74, Noida", slug: "sector-74-noida" },
  { city: "noida", type: "sector", name: "Sector 76, Noida", slug: "sector-76-noida" },
  { city: "noida", type: "sector", name: "Sector 78, Noida", slug: "sector-78-noida" },
  { city: "noida", type: "sector", name: "Sector 100, Noida", slug: "sector-100-noida" },
  { city: "noida", type: "sector", name: "Sector 120, Noida", slug: "sector-120-noida" },
  { city: "noida", type: "sector", name: "Sector 121, Noida", slug: "sector-121-noida" },
  { city: "noida", type: "sector", name: "Sector 137, Noida", slug: "sector-137-noida" },
  { city: "noida", type: "sector", name: "Sector 150, Noida", slug: "sector-150-noida" },
  { city: "noida", type: "commercial", name: "Sector 18 Market, Noida", slug: "sector-18-noida", areaLabel: "Market & offices" },
  { city: "noida", type: "commercial", name: "Sector 62, Noida", slug: "sector-62-noida", areaLabel: "IT & corporate offices" },
  { city: "noida", type: "commercial", name: "Sector 63, Noida", slug: "sector-63-noida", areaLabel: "Industrial & offices" },
  { city: "noida", type: "commercial", name: "Noida Expressway Offices", slug: "noida-expressway-offices", areaLabel: "Sectors 125–144" },

  // Greater Noida
  { city: "greater-noida", type: "sector", name: "Alpha, Greater Noida", slug: "alpha-greater-noida" },
  { city: "greater-noida", type: "sector", name: "Beta, Greater Noida", slug: "beta-greater-noida" },
  { city: "greater-noida", type: "sector", name: "Gamma, Greater Noida", slug: "gamma-greater-noida" },
  { city: "greater-noida", type: "sector", name: "Delta, Greater Noida", slug: "delta-greater-noida" },
  { city: "greater-noida", type: "locality", name: "Pari Chowk", slug: "pari-chowk" },
  { city: "greater-noida", type: "locality", name: "Knowledge Park", slug: "knowledge-park" },
  { city: "greater-noida", type: "commercial", name: "Kasna Industrial Area", slug: "kasna-industrial-area", areaLabel: "Industrial" },
  { city: "greater-noida", type: "commercial", name: "Ecotech Industrial Area", slug: "ecotech-greater-noida", areaLabel: "Industrial" },

  // Greater Noida West / Noida Extension
  { city: "greater-noida-west", type: "locality", name: "Gaur City", slug: "gaur-city" },
  { city: "greater-noida-west", type: "locality", name: "Bisrakh", slug: "bisrakh" },
  { city: "greater-noida-west", type: "commercial", name: "Techzone 4", slug: "techzone-4", areaLabel: "Offices & commercial" },

  // Ghaziabad
  { city: "ghaziabad", type: "locality", name: "Indirapuram", slug: "indirapuram" },
  { city: "ghaziabad", type: "locality", name: "Vaishali", slug: "vaishali" },
  { city: "ghaziabad", type: "locality", name: "Vasundhara", slug: "vasundhara" },
  { city: "ghaziabad", type: "locality", name: "Raj Nagar Extension", slug: "raj-nagar-extension" },
  { city: "ghaziabad", type: "locality", name: "Crossing Republik", slug: "crossing-republik" },
  { city: "ghaziabad", type: "commercial", name: "Kaushambi", slug: "kaushambi", areaLabel: "Offices & commercial" },
  { city: "ghaziabad", type: "commercial", name: "Sahibabad Industrial Area", slug: "sahibabad-industrial-area", areaLabel: "Industrial" },

  // Delhi
  { city: "delhi", type: "locality", name: "Dwarka", slug: "dwarka" },
  { city: "delhi", type: "locality", name: "Rohini", slug: "rohini" },
  { city: "delhi", type: "locality", name: "Janakpuri", slug: "janakpuri" },
  { city: "delhi", type: "locality", name: "Laxmi Nagar", slug: "laxmi-nagar" },
  { city: "delhi", type: "locality", name: "South Delhi", slug: "south-delhi" },
  { city: "delhi", type: "commercial", name: "Connaught Place", slug: "connaught-place", areaLabel: "Offices & retail" },
  { city: "delhi", type: "commercial", name: "Nehru Place", slug: "nehru-place", areaLabel: "Offices & IT market" },
  { city: "delhi", type: "commercial", name: "Okhla Industrial Area", slug: "okhla-industrial-area", areaLabel: "Industrial & offices" },

  // Gurugram
  { city: "gurugram", type: "locality", name: "DLF Phases", slug: "dlf-phases-gurugram", areaLabel: "DLF Phase 1–5" },
  { city: "gurugram", type: "locality", name: "Golf Course Road", slug: "golf-course-road" },
  { city: "gurugram", type: "locality", name: "Golf Course Extension Road", slug: "golf-course-extension-road" },
  { city: "gurugram", type: "locality", name: "Sohna Road", slug: "sohna-road" },
  { city: "gurugram", type: "commercial", name: "Cyber City", slug: "cyber-city-gurugram", areaLabel: "Corporate offices" },
  { city: "gurugram", type: "commercial", name: "Udyog Vihar", slug: "udyog-vihar", areaLabel: "Industrial & offices" },
];

const society = (city: string, name: string, parent?: string, slug?: string): SeedSociety => ({
  city,
  name,
  parent,
  slug:
    slug ??
    name
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
});

export const SEED_SOCIETIES: SeedSociety[] = [
  // Noida
  society("noida", "Supertech Capetown", "sector-74-noida"),
  society("noida", "Mahagun Moderne", "sector-78-noida"),
  society("noida", "Cleo County", "sector-121-noida"),
  society("noida", "Amrapali Zodiac", "sector-120-noida"),
  society("noida", "Amrapali Silicon City", "sector-76-noida"),
  society("noida", "Prateek Edifice"),
  society("noida", "Lotus Boulevard", "sector-100-noida"),
  society("noida", "Lotus Panache"),
  society("noida", "Paras Tierea", "sector-137-noida"),
  society("noida", "ATS Pristine", "sector-150-noida"),
  society("noida", "ATS Le Grandiose", "sector-150-noida"),
  society("noida", "Gulshan Vivante", "sector-137-noida"),
  society("noida", "ACE Parkway", "sector-150-noida"),
  society("noida", "Godrej Palm Retreat", "sector-150-noida"),
  society("noida", "Godrej Nest"),
  society("noida", "Exotica Fresco", "sector-137-noida"),
  society("noida", "Logix Blossom County", "sector-137-noida"),
  society("noida", "Purvanchal Royal Park", "sector-137-noida"),

  // Greater Noida West
  society("greater-noida-west", "Gaur City 1", "gaur-city"),
  society("greater-noida-west", "Gaur City 2", "gaur-city"),
  society("greater-noida-west", "Gaur Saundaryam"),
  society("greater-noida-west", "Supertech Eco Village 1"),
  society("greater-noida-west", "Supertech Eco Village 2"),
  society("greater-noida-west", "Supertech Eco Village 3"),
  society("greater-noida-west", "Ace City"),
  society("greater-noida-west", "Ace Divino"),
  society("greater-noida-west", "Ace Aspire"),
  society("greater-noida-west", "ATS Destinaire"),
  society("greater-noida-west", "ATS Rhapsody"),
  society("greater-noida-west", "ATS Happy Trails"),
  society("greater-noida-west", "Mahagun Mywoods"),
  society("greater-noida-west", "Mahagun Mantra"),
  society("greater-noida-west", "Nirala Estate"),
  society("greater-noida-west", "Nirala Aspire"),
  society("greater-noida-west", "Panchsheel Greens"),
  society("greater-noida-west", "Galaxy North Avenue"),
  society("greater-noida-west", "Galaxy Vega"),
  society("greater-noida-west", "ABA Cherry County"),
  society("greater-noida-west", "ABA Coco County"),
  society("greater-noida-west", "Arihant Arden"),
  society("greater-noida-west", "Ajnara Homes"),
  society("greater-noida-west", "Exotica Dreamville"),
  society("greater-noida-west", "Fusion Homes"),
  society("greater-noida-west", "Gulshan Bellina"),
  society("greater-noida-west", "Paramount Emotions"),
  society("greater-noida-west", "Sam Palm Olympia"),
  society("greater-noida-west", "Saviour Greenisle"),
  society("greater-noida-west", "Saya Zion"),
  society("greater-noida-west", "Trident Embassy"),

  // Ghaziabad
  society("ghaziabad", "Shipra Suncity", "indirapuram"),
  society("ghaziabad", "ATS Advantage", "indirapuram"),
  society("ghaziabad", "ATS Haciendas"),
  society("ghaziabad", "Gaur Green Vista"),
  society("ghaziabad", "Exotica Elegance"),
  society("ghaziabad", "Nirala Eden Park"),
  society("ghaziabad", "Mahagun Mascot", "crossing-republik"),
  society("ghaziabad", "Assotech The Nest", "crossing-republik"),
  society("ghaziabad", "Saviour Park"),
  society("ghaziabad", "Panchsheel Wellington", "crossing-republik"),
  society("ghaziabad", "Ajnara Integrity", "raj-nagar-extension"),
  society("ghaziabad", "KW Srishti", "raj-nagar-extension"),
  society("ghaziabad", "VVIP Addresses", "raj-nagar-extension"),
  society("ghaziabad", "Charms Castle", "raj-nagar-extension"),
  society("ghaziabad", "SCC Sapphire", "raj-nagar-extension"),
  society("ghaziabad", "SG Grand", "raj-nagar-extension"),
  society("ghaziabad", "River Heights", "raj-nagar-extension"),
  society("ghaziabad", "Uninav Heights", "raj-nagar-extension"),

  // Gurugram
  society("gurugram", "DLF The Camellias", "golf-course-road"),
  society("gurugram", "DLF The Magnolias", "golf-course-road"),
  society("gurugram", "DLF The Aralias", "golf-course-road"),
  society("gurugram", "DLF The Crest", "golf-course-road"),
  society("gurugram", "DLF Park Place", "golf-course-road"),
  society("gurugram", "M3M Golf Estate", "golf-course-extension-road"),
  society("gurugram", "M3M Merlin"),
  society("gurugram", "Trump Towers Gurgaon", undefined, "trump-towers-gurgaon"),
  society("gurugram", "Sobha City"),
  society("gurugram", "Emaar Gurgaon Greens"),
  society("gurugram", "Emaar DigiHomes"),
  society("gurugram", "Ireo Grand Arch"),
  society("gurugram", "Ireo Skyon"),
  society("gurugram", "Mahindra Luminare"),
  society("gurugram", "Central Park Resorts"),
  society("gurugram", "M3M Heights"),
  society("gurugram", "Godrej Summit"),
  society("gurugram", "Godrej Air"),
  society("gurugram", "Godrej Habitat"),
  society("gurugram", "Bestech Park View City"),
  society("gurugram", "Tulip Violet"),
  society("gurugram", "Tulip Orange"),
  society("gurugram", "Nirvana Country"),
  society("gurugram", "Windchants"),
  society("gurugram", "Ambience Creacions"),
];
