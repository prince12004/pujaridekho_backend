import { ApiError } from "../../lib/api-error.js";
import { PanditModel } from "../../models/pandit.model.js";
import { PanditApplicationModel } from "../../models/pandit-application.model.js";

export interface ListPanditsQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  verificationStatus?: string;
}

export async function listPandits(query: ListPanditsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;

  const filter: Record<string, unknown> = {};
  if (query.city) filter.cities = query.city;
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.search) filter.fullName = { $regex: query.search, $options: "i" };

  const [items, total] = await Promise.all([
    PanditModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PanditModel.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPanditById(id: string) {
  const pandit = await PanditModel.findById(id);
  if (!pandit) throw ApiError.notFound("Pandit not found");
  return pandit;
}

export async function createPandit(input: Record<string, unknown>) {
  return PanditModel.create(input);
}

export async function updatePandit(id: string, input: Record<string, unknown>) {
  const pandit = await getPanditById(id);
  Object.assign(pandit, input);
  await pandit.save();
  return pandit;
}

export async function deletePandit(id: string) {
  const pandit = await getPanditById(id);
  await pandit.deleteOne();
}

export async function listPanditApplications(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  return PanditApplicationModel.find(filter).sort({ createdAt: -1 });
}

export async function getPanditApplicationById(id: string) {
  const application = await PanditApplicationModel.findById(id);
  if (!application) throw ApiError.notFound("Pandit application not found");
  return application;
}

export async function updatePanditApplication(id: string, input: Record<string, unknown>) {
  const application = await getPanditApplicationById(id);
  Object.assign(application, input);
  await application.save();
  return application;
}

export async function convertApplicationToPandit(id: string) {
  const application = await getPanditApplicationById(id);
  if (application.convertedPandit) {
    throw ApiError.conflict("This application has already been converted to a pandit profile");
  }

  const pandit = await PanditModel.create({
    fullName: application.fullName,
    mobile: application.mobile,
    email: application.email,
    cities: application.city ? [application.city] : [],
    specializations: application.specialization ? [application.specialization] : [],
    verificationStatus: "documents_pending",
  });

  application.convertedPandit = pandit._id;
  application.status = "approved";
  await application.save();

  return { pandit, application };
}
