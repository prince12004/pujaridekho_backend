import { SettingsModel } from "../../models/settings.model.js";

export async function getOrCreateSettings() {
  let settings = await SettingsModel.findOne();
  if (!settings) settings = await SettingsModel.create({});
  return settings;
}
