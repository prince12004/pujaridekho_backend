import { ApiError } from "../../lib/api-error.js";
import { CityPoojaSeoModel } from "../../models/city-pooja-seo.model.js";
import { CityModel } from "../../models/city.model.js";
import { PoojaModel } from "../../models/pooja.model.js";

export async function listCityPoojaSeo() {
  return CityPoojaSeoModel.find().populate("city", "name slug").populate("pooja", "name slug").sort({ createdAt: -1 });
}

export async function getCityPoojaSeoById(id: string) {
  const entry = await CityPoojaSeoModel.findById(id);
  if (!entry) throw ApiError.notFound("Entry not found");
  return entry;
}

export async function createCityPoojaSeo(input: { city: string; pooja: string; title?: string; description?: string }) {
  const [city, pooja] = await Promise.all([CityModel.findById(input.city), PoojaModel.findById(input.pooja)]);
  if (!city) throw ApiError.badRequest("Selected city not found");
  if (!pooja) throw ApiError.badRequest("Selected pooja not found");

  const existing = await CityPoojaSeoModel.findOne({ city: city._id, pooja: pooja._id });
  if (existing) throw ApiError.conflict("An SEO entry for this city and pooja combination already exists");

  const slug = `${pooja.slug}-in-${city.slug}`;
  return CityPoojaSeoModel.create({
    city: city._id,
    pooja: pooja._id,
    slug,
    title: input.title,
    description: input.description,
  });
}

export async function updateCityPoojaSeo(id: string, input: { title?: string; description?: string }) {
  const entry = await getCityPoojaSeoById(id);
  Object.assign(entry, input);
  await entry.save();
  return entry;
}

export async function deleteCityPoojaSeo(id: string) {
  const entry = await getCityPoojaSeoById(id);
  await entry.deleteOne();
}
