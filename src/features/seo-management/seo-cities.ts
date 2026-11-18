import type { Types } from "mongoose";
import { CityModel } from "../../models/city.model.js";
import { SeoLocationModel } from "../../models/seo-location.model.js";
import { SeoPageModel } from "../../models/seo-page.model.js";

export interface ServiceCity {
  name: string;
  slug: string;
  locationId?: Types.ObjectId;
}

// The cities the business serves: the SEO cities (Admin → SEO Management →
// Cities) when any exist, otherwise the existing "Cities & Service Areas"
// list. Either way it comes from the database — nothing is hard-coded.
export async function getServiceCities(): Promise<ServiceCity[]> {
  const seoCities = await SeoLocationModel.find({ type: "city", isActive: true }).sort({ sortOrder: 1, name: 1 }).select("name slug").lean();
  if (seoCities.length) return seoCities.map((c) => ({ name: c.name, slug: c.slug, locationId: c._id }));
  const cities = await CityModel.find({ status: "published" }).sort({ sortOrder: 1, name: 1 }).select("name slug").lean();
  return cities.map((c) => ({ name: c.name, slug: c.slug }));
}

/** City for a "/pandit-in-<slug>" URL, if that city is served. */
export async function findServiceCityForPageSlug(pageSlug: string) {
  const match = /^pandit-in-(.+)$/.exec(pageSlug);
  if (!match) return null;
  return (await getServiceCities()).find((c) => c.slug === match[1]) ?? null;
}

/** Link for each served city: its published SEO page when there is one,
 * otherwise the basic city page at /pandit-in-<slug>. */
export async function getCityLinks() {
  const cities = await getServiceCities();
  const locationIds = cities.map((c) => c.locationId).filter(Boolean);
  const pages = locationIds.length
    ? await SeoPageModel.find({ pageType: "location", status: "published", location: { $in: locationIds } }).select("slug name location").lean()
    : [];
  return cities.map((c) => {
    const page = pages.find((p) => String(p.location) === String(c.locationId));
    return page ? { label: page.name, url: `/${page.slug}` } : { label: `Pandit in ${c.name}`, url: `/pandit-in-${c.slug}` };
  });
}
