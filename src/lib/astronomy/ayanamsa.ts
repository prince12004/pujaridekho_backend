// Lahiri (Chitrapaksha) ayanamsa, linear approximation anchored to its
// published 1900.0 epoch value and the IAU precession rate. Accurate to
// within a few arcminutes — enough to place a longitude in the correct
// 30°-wide rashi or 13°20'-wide nakshatra, which is all a Panchang/Kundli
// needs; it is not a substitute for a full nutation-aware ephemeris.
const BASE_AYANAMSA_AT_1900 = 22.46047;
const RATE_DEGREES_PER_YEAR = 0.0139552;

export function getLahiriAyanamsaDegrees(date: Date): number {
  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const startOfNextYear = Date.UTC(year + 1, 0, 1);
  const fractionOfYear = (date.getTime() - startOfYear) / (startOfNextYear - startOfYear);
  const fractionalYear = year + fractionOfYear;
  return BASE_AYANAMSA_AT_1900 + (fractionalYear - 1900) * RATE_DEGREES_PER_YEAR;
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
