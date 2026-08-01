import { ApiError } from "../../lib/api-error.js";
import { SamagriTemplateModel } from "../../models/samagri-template.model.js";

export interface ListSamagriTemplatesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

function computeEstimatedCost(includedItems: { estimatedPrice: number }[] = []) {
  return includedItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
}

// Falls back to estimatedPrice per item (i.e. no discount) when an item has no mrp set.
function computeEstimatedMrp(includedItems: { estimatedPrice: number; mrp?: number | null }[] = []) {
  return includedItems.reduce((sum, item) => sum + (item.mrp ?? item.estimatedPrice ?? 0), 0);
}

export async function listSamagriTemplates(query: ListSamagriTemplatesQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 50;

  const filter: Record<string, unknown> = {};
  if (query.search) filter.samagriTemplateName = { $regex: query.search, $options: "i" };

  const [items, total] = await Promise.all([
    SamagriTemplateModel.find(filter)
      .populate("pooja", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SamagriTemplateModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getSamagriTemplateById(id: string) {
  const template = await SamagriTemplateModel.findById(id).populate("pooja", "name slug");
  if (!template) throw ApiError.notFound("Samagri template not found");
  return template;
}

export async function createSamagriTemplate(input: Record<string, unknown>) {
  const existing = await SamagriTemplateModel.findOne({ pooja: input.pooja });
  if (existing) throw ApiError.conflict("This pooja already has a samagri template");
  const includedItems = (input.includedItems as { estimatedPrice: number; mrp?: number }[]) ?? [];
  // Admin can override either auto-summed total with a custom figure; only
  // fall back to the sum of item prices when no override is given.
  const estimatedSamagriCost =
    typeof input.estimatedSamagriCost === "number" ? input.estimatedSamagriCost : computeEstimatedCost(includedItems);
  const estimatedSamagriMrp =
    typeof input.estimatedSamagriMrp === "number" ? input.estimatedSamagriMrp : computeEstimatedMrp(includedItems);
  return SamagriTemplateModel.create({ ...input, estimatedSamagriCost, estimatedSamagriMrp });
}

export async function updateSamagriTemplate(id: string, input: Record<string, unknown>) {
  const template = await getSamagriTemplateById(id);
  if (input.pooja && String(input.pooja) !== String(template.pooja)) {
    const existing = await SamagriTemplateModel.findOne({ pooja: input.pooja, _id: { $ne: id } });
    if (existing) throw ApiError.conflict("This pooja already has a samagri template");
  }
  Object.assign(template, input);
  const includedItems =
    (input.includedItems as { estimatedPrice: number; mrp?: number | null }[] | undefined) ?? template.includedItems;
  template.estimatedSamagriCost =
    typeof input.estimatedSamagriCost === "number" ? input.estimatedSamagriCost : computeEstimatedCost(includedItems);
  template.estimatedSamagriMrp =
    typeof input.estimatedSamagriMrp === "number" ? input.estimatedSamagriMrp : computeEstimatedMrp(includedItems);
  await template.save();
  return template;
}

export async function deleteSamagriTemplate(id: string) {
  const template = await getSamagriTemplateById(id);
  await template.deleteOne();
}
