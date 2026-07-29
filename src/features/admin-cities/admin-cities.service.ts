import { ApiError } from "../../lib/api-error.js";
import { CityModel } from "../../models/city.model.js";

export async function listCities() {
  return CityModel.find().sort({ sortOrder: 1, name: 1 });
}

export async function getCityById(id: string) {
  const city = await CityModel.findById(id);
  if (!city) throw ApiError.notFound("City not found");
  return city;
}

export async function createCity(input: Record<string, unknown>) {
  const existing = await CityModel.findOne({ slug: input.slug });
  if (existing) throw ApiError.conflict("A city with this slug already exists");
  return CityModel.create(input);
}

export async function updateCity(id: string, input: Record<string, unknown>) {
  const city = await getCityById(id);
  Object.assign(city, input);
  await city.save();
  return city;
}

export async function deleteCity(id: string) {
  const city = await getCityById(id);
  await city.deleteOne();
}
