import { HomeLeadModel } from "../../models/home-lead.model.js";

export async function listHomeLeads(query: { source?: string; status?: string } = {}) {
  const filter: Record<string, unknown> = {};
  if (query.source === "homepage") {
    // Leads saved before `source` existed are homepage enquiries.
    filter.source = { $in: ["homepage", null] };
  } else if (query.source === "checkout") {
    filter.source = "checkout";
  }
  if (query.status === "open" || query.status === "converted") filter.status = query.status;
  return HomeLeadModel.find(filter).sort({ createdAt: -1 });
}
