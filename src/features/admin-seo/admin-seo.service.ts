import { ApiError } from "../../lib/api-error.js";
import { SeoSettingModel } from "../../models/seo-setting.model.js";

export async function listSeoSettings() {
  return SeoSettingModel.find().sort({ pagePath: 1 });
}

export async function getSeoSettingById(id: string) {
  const setting = await SeoSettingModel.findById(id);
  if (!setting) throw ApiError.notFound("SEO setting not found");
  return setting;
}

export async function createSeoSetting(input: Record<string, unknown>) {
  const existing = await SeoSettingModel.findOne({ pagePath: input.pagePath });
  if (existing) throw ApiError.conflict("An SEO entry for this path already exists");
  return SeoSettingModel.create(input);
}

export async function updateSeoSetting(id: string, input: Record<string, unknown>) {
  const setting = await getSeoSettingById(id);
  Object.assign(setting, input);
  await setting.save();
  return setting;
}

export async function deleteSeoSetting(id: string) {
  const setting = await getSeoSettingById(id);
  await setting.deleteOne();
}
