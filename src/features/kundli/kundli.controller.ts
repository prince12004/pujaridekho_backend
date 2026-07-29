import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { computeKundli } from "../../lib/astronomy/kundli.js";
import { findIndiaCity, INDIA_CITIES } from "../../lib/astronomy/india-cities.js";
import { DEFAULT_LOCATION } from "../../lib/astronomy/panchang.js";

const IST_OFFSET_MINUTES = 330;

const kundliRequestSchema = z.object({
  name: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be YYYY-MM-DD"),
  tob: z.string().regex(/^\d{2}:\d{2}$/, "tob must be HH:mm"),
  place: z.string().min(1),
});

export const getKundliCities = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, INDIA_CITIES.map((city) => city.name));
});

export const postKundli = asyncHandler(async (req: Request, res: Response) => {
  const { name, dob, tob, place } = kundliRequestSchema.parse(req.body);

  const matchedCity = findIndiaCity(place);
  const location = matchedCity ?? DEFAULT_LOCATION;

  const [year, month, day] = dob.split("-").map(Number);
  const [hour, minute] = tob.split(":").map(Number);
  // Birth time is entered in IST (India-only tool, single timezone) — convert to UTC for the ephemeris.
  const birthDateTimeUtc = new Date(Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60_000);

  const kundli = computeKundli({ birthDateTimeUtc, latitude: location.lat, longitude: location.lon });

  sendSuccess(res, {
    name,
    dob,
    tob,
    place,
    locationUsed: matchedCity ? matchedCity.name : `${DEFAULT_LOCATION.label} (place not recognised, used as default)`,
    ...kundli,
  });
});
