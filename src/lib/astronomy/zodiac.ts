import { normalizeDegrees } from "./ayanamsa.js";

export const RASHIS = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrischika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
] as const;

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

const RASHI_SPAN = 30;
const NAKSHATRA_SPAN = 360 / 27;
const PADA_SPAN = NAKSHATRA_SPAN / 4;

export function getRashi(siderealLongitude: number) {
  const lon = normalizeDegrees(siderealLongitude);
  const index = Math.floor(lon / RASHI_SPAN);
  return { name: RASHIS[index], index, degreesInRashi: lon % RASHI_SPAN };
}

export function getNakshatra(siderealLongitude: number) {
  const lon = normalizeDegrees(siderealLongitude);
  const index = Math.floor(lon / NAKSHATRA_SPAN);
  const pada = Math.floor((lon % NAKSHATRA_SPAN) / PADA_SPAN) + 1;
  return { name: NAKSHATRAS[index], index, pada };
}
