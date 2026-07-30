// A namespace import (`import * as Astronomy`) resolves to an incomplete
// object under this project's ESM/tsx runtime — cjs-module-lexer's static
// analysis of astronomy-engine's CJS build misses several named exports
// (MakeTime included), so calls silently become "is not a function". The
// default import gets the whole CJS module.exports object intact.
import Astronomy from "astronomy-engine";
import { getLahiriAyanamsaDegrees, normalizeDegrees } from "./ayanamsa.js";
import { getNakshatra, getRashi } from "./zodiac.js";

export const DEFAULT_LOCATION = { lat: 28.6139, lon: 77.209, label: "New Delhi" };
const IST_OFFSET_MINUTES = 330;

const TITHI_NAMES = [
  "Shukla Pratipada", "Shukla Dwitiya", "Shukla Tritiya", "Shukla Chaturthi", "Shukla Panchami",
  "Shukla Shashthi", "Shukla Saptami", "Shukla Ashtami", "Shukla Navami", "Shukla Dashami",
  "Shukla Ekadashi", "Shukla Dwadashi", "Shukla Trayodashi", "Shukla Chaturdashi", "Purnima",
  "Krishna Pratipada", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami",
  "Krishna Shashthi", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami",
  "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya",
];

const YOGA_NAMES = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
  "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
  "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
];

const KARANA_MOVABLE = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];

const VARA_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Standard 8-fold daylight division; the segment (0-indexed) that is Rahu Kaal on each weekday.
const RAHU_KAAL_SEGMENT_BY_WEEKDAY = [7, 1, 6, 4, 5, 3, 2];

function getKaranaName(karanaIndex: number): string {
  if (karanaIndex === 0) return "Kimstughna";
  if (karanaIndex === 57) return "Shakuni";
  if (karanaIndex === 58) return "Chatushpada";
  if (karanaIndex === 59) return "Naga";
  return KARANA_MOVABLE[(karanaIndex - 1) % 7];
}

function toIstLabel(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export interface PanchangResult {
  date: string;
  vara: string;
  tithi: { name: string; paksha: "Shukla" | "Krishna"; number: number };
  nakshatra: { name: string; pada: number };
  yoga: string;
  karana: string;
  sunrise: string | null;
  sunset: string | null;
  rahuKaal: { start: string; end: string } | null;
  moonRashi: string;
  sunRashi: string;
  ayanamsa: number;
}

/** dateStr is an IST calendar date (YYYY-MM-DD) — India has a single timezone, so no DST/offset input is needed. */
export function computeDailyPanchang(
  dateStr: string,
  location: { lat: number; lon: number } = DEFAULT_LOCATION,
): PanchangResult {
  const [year, month, day] = dateStr.split("-").map(Number);
  const middayIst = new Date(Date.UTC(year, month - 1, day, 12 - IST_OFFSET_MINUTES / 60, 0));
  const startOfDayUtc = Astronomy.MakeTime(new Date(Date.UTC(year, month - 1, day, 0, 0, 0)));
  const observer = new Astronomy.Observer(location.lat, location.lon, 0);

  const sunriseTime = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, startOfDayUtc, 1);
  const sunsetTime = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, startOfDayUtc, 1);
  const referenceTime = sunriseTime ? sunriseTime : Astronomy.MakeTime(middayIst);

  const ayanamsa = getLahiriAyanamsaDegrees(referenceTime.date);
  const sunTropical = Astronomy.SunPosition(referenceTime).elon;
  const moonTropical = Astronomy.EclipticGeoMoon(referenceTime).lon;
  const sunSidereal = normalizeDegrees(sunTropical - ayanamsa);
  const moonSidereal = normalizeDegrees(moonTropical - ayanamsa);

  const elongation = normalizeDegrees(moonSidereal - sunSidereal);
  const tithiIndex = Math.floor(elongation / 12);
  const tithiName = TITHI_NAMES[tithiIndex];
  const paksha: "Shukla" | "Krishna" = tithiIndex < 15 ? "Shukla" : "Krishna";
  const tithiNumber = (tithiIndex % 15) + 1;

  const nakshatra = getNakshatra(moonSidereal);
  const moonRashi = getRashi(moonSidereal);
  const sunRashi = getRashi(sunSidereal);

  const yogaValue = normalizeDegrees(sunSidereal + moonSidereal);
  const yogaIndex = Math.floor(yogaValue / (360 / 27));
  const karanaIndex = Math.floor(elongation / 6);

  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  let rahuKaal: { start: string; end: string } | null = null;
  if (sunriseTime && sunsetTime) {
    const daylightMinutes = (sunsetTime.date.getTime() - sunriseTime.date.getTime()) / 60_000;
    const segmentMinutes = daylightMinutes / 8;
    const segment = RAHU_KAAL_SEGMENT_BY_WEEKDAY[weekdayIndex];
    const start = addMinutes(sunriseTime.date, segment * segmentMinutes);
    const end = addMinutes(start, segmentMinutes);
    rahuKaal = { start: toIstLabel(start)!, end: toIstLabel(end)! };
  }

  return {
    date: dateStr,
    vara: VARA_NAMES[weekdayIndex],
    tithi: { name: tithiName, paksha, number: tithiNumber },
    nakshatra: { name: nakshatra.name, pada: nakshatra.pada },
    yoga: YOGA_NAMES[yogaIndex],
    karana: getKaranaName(karanaIndex),
    sunrise: toIstLabel(sunriseTime?.date ?? null),
    sunset: toIstLabel(sunsetTime?.date ?? null),
    rahuKaal,
    moonRashi: moonRashi.name,
    sunRashi: sunRashi.name,
    ayanamsa: Number(ayanamsa.toFixed(4)),
  };
}
