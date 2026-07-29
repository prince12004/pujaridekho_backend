import { ApiError } from "../../lib/api-error.js";
import { computeKundli } from "../../lib/astronomy/kundli.js";
import { findIndiaCity } from "../../lib/astronomy/india-cities.js";
import { DEFAULT_LOCATION } from "../../lib/astronomy/panchang.js";
import { KundliRecordModel } from "../../models/kundli-record.model.js";

const IST_OFFSET_MINUTES = 330;

export interface GenerateKundliInput {
  personName: string;
  dob: string;
  tob: string;
  place: string;
}

export async function generateAndSaveKundli(customerId: string, input: GenerateKundliInput) {
  const matchedCity = findIndiaCity(input.place);
  const location = matchedCity ?? DEFAULT_LOCATION;

  const [year, month, day] = input.dob.split("-").map(Number);
  const [hour, minute] = input.tob.split(":").map(Number);
  const birthDateTimeUtc = new Date(Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60_000);

  const result = computeKundli({ birthDateTimeUtc, latitude: location.lat, longitude: location.lon });
  const locationUsed = matchedCity ? matchedCity.name : `${DEFAULT_LOCATION.label} (place not recognised, used as default)`;

  return KundliRecordModel.create({
    customer: customerId,
    personName: input.personName,
    dob: input.dob,
    tob: input.tob,
    place: input.place,
    latitude: location.lat,
    longitude: location.lon,
    locationUsed,
    ascendant: result.ascendant,
    moonRashi: result.moonRashi,
    moonNakshatra: result.moonNakshatra,
    moonPada: result.moonPada,
    sunRashi: result.sunRashi,
    ayanamsa: result.ayanamsa,
    planets: result.planets,
  });
}

export async function listMyKundlis(customerId: string) {
  return KundliRecordModel.find({ customer: customerId }).sort({ createdAt: -1 });
}

export async function getMyKundliById(customerId: string, id: string) {
  const record = await KundliRecordModel.findById(id);
  if (!record) throw ApiError.notFound("Kundli not found");
  if (record.customer.toString() !== customerId) {
    throw ApiError.forbidden("You do not have access to this Kundli");
  }
  return record;
}
