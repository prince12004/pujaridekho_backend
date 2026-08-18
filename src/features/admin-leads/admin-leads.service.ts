import { HomeLeadModel } from "../../models/home-lead.model.js";

export async function listHomeLeads() {
  return HomeLeadModel.find().sort({ createdAt: -1 });
}
