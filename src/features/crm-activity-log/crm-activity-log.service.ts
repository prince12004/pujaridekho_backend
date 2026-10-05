import type { Request } from "express";
import { ApiError } from "../../lib/api-error.js";
import { CrmActivityLogModel, type CrmActivityLogDocument } from "../../models/crm-activity-log.model.js";
import { CrmInquiryModel } from "../../models/crm-inquiry.model.js";
import { crmOwnFilter, isCrmAdmin } from "../../middlewares/crm-auth.js";

// Ported from pujaridekhocrm/backend/server.js's activity-log routes.

export function toActivityLogJson(doc: CrmActivityLogDocument) {
  return {
    id: doc.id,
    inquiryId: doc.inquiryId,
    salesPersonId: doc.salesPersonId,
    note: doc.note,
    audioBase64: doc.audioBase64,
    createdAt: doc.createdAt,
    isConversion: doc.isConversion,
    isReassignment: doc.isReassignment,
    isRejection: doc.isRejection,
  };
}

export async function listActivityLogs(req: Request, inquiryId: string) {
  const inquiry = await CrmInquiryModel.findOne({ id: inquiryId, ...crmOwnFilter(req) });
  if (!inquiry) throw ApiError.notFound("Not found");
  const docs = await CrmActivityLogModel.find({ inquiryId }).sort({ createdAt: -1 });
  return docs.map(toActivityLogJson);
}

const MAX_BULK_ACTIVITY_LOG_IDS = 200;

export async function bulkListActivityLogs(req: Request, inquiryIds: string[]) {
  const ids = [...new Set(inquiryIds)].slice(0, MAX_BULK_ACTIVITY_LOG_IDS);

  const owned = await CrmInquiryModel.find({ id: { $in: ids }, ...crmOwnFilter(req) }, "id");
  const ownedIds = owned.map((d) => d.id);

  const result: Record<string, ReturnType<typeof toActivityLogJson>[]> = {};
  for (const id of ids) result[id] = [];

  if (ownedIds.length > 0) {
    const docs = await CrmActivityLogModel.find({ inquiryId: { $in: ownedIds } }).sort({ createdAt: -1 });
    for (const doc of docs) {
      result[doc.inquiryId].push(toActivityLogJson(doc));
    }
  }

  return result;
}

export interface CreateActivityLogInput {
  id: string;
  inquiryId: string;
  salesPersonId?: string;
  note?: string;
  audioBase64?: string | null;
  createdAt: string;
  isConversion?: boolean;
  isReassignment?: boolean;
  isRejection?: boolean;
}

export async function createActivityLog(req: Request, input: CreateActivityLogInput) {
  const inquiry = await CrmInquiryModel.findOne({ id: input.inquiryId, ...crmOwnFilter(req) });
  if (!inquiry) throw ApiError.notFound("Not found");

  const payload = { ...input };
  if (!isCrmAdmin(req)) payload.salesPersonId = req.crmUser?.salesPersonId;

  try {
    const doc = await CrmActivityLogModel.create(payload);
    return { status: 201 as const, body: toActivityLogJson(doc) };
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      // Same id posted twice (e.g. offline-queue retry) — treat as already
      // saved rather than an error.
      return { status: 200 as const, body: { ok: true } };
    }
    throw err;
  }
}
