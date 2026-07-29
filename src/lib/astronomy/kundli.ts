import Astronomy from "astronomy-engine";
import type { AstroTime } from "astronomy-engine";
import { getLahiriAyanamsaDegrees, normalizeDegrees } from "./ayanamsa.js";
import { getNakshatra, getRashi } from "./zodiac.js";

const PLANET_BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const;

function getTropicalLongitude(bodyName: (typeof PLANET_BODIES)[number], time: AstroTime): number {
  if (bodyName === "Sun") return Astronomy.SunPosition(time).elon;
  if (bodyName === "Moon") return Astronomy.EclipticGeoMoon(time).lon;
  const vector = Astronomy.GeoVector(Astronomy.Body[bodyName], time, true);
  return Astronomy.Ecliptic(vector).elon;
}

/**
 * Ascendant (Lagna) via the standard RAMC/obliquity formula — real spherical
 * astronomy, not a lookup table. Mean obliquity is used (no nutation), which
 * is accurate to within a fraction of a degree — enough to place the
 * ascendant in the correct rashi for virtually all birth times/locations.
 */
function computeAscendantTropicalDegrees(time: AstroTime, latitude: number, longitude: number): number {
  const gstHours = Astronomy.SiderealTime(time);
  const lstDegrees = normalizeDegrees(gstHours * 15 + longitude);
  const centuriesSinceJ2000 = time.tt / 36525;
  const obliquityDegrees = 23.43929111 - 0.013004167 * centuriesSinceJ2000;

  const ramc = (lstDegrees * Math.PI) / 180;
  const eps = (obliquityDegrees * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;

  const ascRad = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)));
  return normalizeDegrees((ascRad * 180) / Math.PI);
}

export interface KundliInput {
  birthDateTimeUtc: Date;
  latitude: number;
  longitude: number;
}

export interface KundliPlanetPosition {
  planet: string;
  siderealLongitude: number;
  rashi: string;
  nakshatra: string;
  pada: number;
}

export interface KundliResult {
  ayanamsa: number;
  ascendant: { rashi: string; siderealLongitude: number };
  planets: KundliPlanetPosition[];
  moonRashi: string;
  moonNakshatra: string;
  moonPada: number;
  sunRashi: string;
}

export function computeKundli(input: KundliInput): KundliResult {
  const time = Astronomy.MakeTime(input.birthDateTimeUtc);
  const ayanamsa = getLahiriAyanamsaDegrees(input.birthDateTimeUtc);

  const planets: KundliPlanetPosition[] = PLANET_BODIES.map((planet) => {
    const tropical = getTropicalLongitude(planet, time);
    const sidereal = normalizeDegrees(tropical - ayanamsa);
    const rashi = getRashi(sidereal);
    const nakshatra = getNakshatra(sidereal);
    return { planet, siderealLongitude: Number(sidereal.toFixed(2)), rashi: rashi.name, nakshatra: nakshatra.name, pada: nakshatra.pada };
  });

  const ascendantTropical = computeAscendantTropicalDegrees(time, input.latitude, input.longitude);
  const ascendantSidereal = normalizeDegrees(ascendantTropical - ayanamsa);
  const ascendantRashi = getRashi(ascendantSidereal);

  const moon = planets.find((p) => p.planet === "Moon")!;
  const sun = planets.find((p) => p.planet === "Sun")!;

  return {
    ayanamsa: Number(ayanamsa.toFixed(4)),
    ascendant: { rashi: ascendantRashi.name, siderealLongitude: Number(ascendantSidereal.toFixed(2)) },
    planets,
    moonRashi: moon.rashi,
    moonNakshatra: moon.nakshatra,
    moonPada: moon.pada,
    sunRashi: sun.rashi,
  };
}
