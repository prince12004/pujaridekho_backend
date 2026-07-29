import { HomepageBannerModel } from "../../models/homepage-banner.model.js";

export async function getOrCreateBanner() {
  let banner = await HomepageBannerModel.findOne();
  if (!banner) banner = await HomepageBannerModel.create({});
  return banner;
}
