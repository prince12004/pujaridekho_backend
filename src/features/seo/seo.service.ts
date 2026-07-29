import { SeoSettingModel } from "../../models/seo-setting.model.js";

export async function getSeoByPath(pagePath: string) {
  return SeoSettingModel.findOne({ pagePath });
}
