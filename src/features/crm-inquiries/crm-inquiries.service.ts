import type { Request } from "express";
import crypto from "node:crypto";
import type { HydratedDocument } from "mongoose";
import { ApiError } from "../../lib/api-error.js";
import { CrmInquiryModel, type CrmInquiryDocument } from "../../models/crm-inquiry.model.js";
import { BookingModel } from "../../models/booking.model.js";
import { PoojaModel } from "../../models/pooja.model.js";
import { PanditSlotReservationModel } from "../../models/pandit-slot-reservation.model.js";
import { crmHasFullAccess, crmOwnFilter, isCrmAdmin } from "../../middlewares/crm-auth.js";
import { findOrCreateCustomerByMobile } from "../admin-customers/admin-customers.service.js";
import { generateBookingId } from "../admin-bookings/admin-bookings.service.js";
import { generateReachedOtp } from "../../lib/otp.js";
import {
  getCrmAvailability,
  listCrmPandits,
  releasePanditSlot,
  reservePanditSlot,
} from "../crm/crm.service.js";


type InquiryDoc = HydratedDocument<CrmInquiryDocument>;

export function toJson(doc: InquiryDoc) {
  return {
    id: doc.id,
    clientName: doc.clientName,
    phone: doc.phone,
    pujaName: doc.pujaName,
    pujaDate: doc.pujaDate,
    pujaTime: doc.pujaTime,
    pujaEndDate: doc.pujaEndDate,
    pujaEvents: doc.pujaEvents ?? [],
    status: doc.status,
    packagePrice: doc.packagePrice ?? null,
    samagriPrice: doc.samagriPrice ?? null,
    totalAmount: doc.totalAmount,
    tokenAmount: doc.tokenAmount,
    tokenStatus: doc.tokenStatus,
    totalAmountStatus: doc.totalAmountStatus,
    transactionId: doc.transactionId,
    nextCallDate: doc.nextCallDate,
    pujariName: doc.pujariName,
    panditId: doc.panditId,
    panditName: doc.panditName,
    assignedSlot: doc.assignedSlot,
    address: doc.address,
    notes: doc.notes,
    source: doc.source,
    websiteBookingId: doc.websiteBookingId ?? null,
    assignedTo: doc.assignedTo,
    createdAt: doc.createdAt,
    reviewed: doc.reviewed,
    samagriIncluded: doc.samagriIncluded,
    version: doc.version,
    updatedAt: doc.updatedAt,
  };
}

// Single source of truth for CRM pricing: whenever a write includes
// packagePrice, totalAmount is overwritten with packagePrice + (samagriPrice
// if samagriIncluded) — never trusts a client-computed totalAmount once
// packagePrice is in play. Missing pieces (samagriIncluded/samagriPrice) not
// present in this particular patch fall back to the existing doc's stored
// values, so a partial edit (e.g. patching only samagriPrice) still
// recomputes correctly. If packagePrice is absent from both the patch and
// the existing doc, totalAmount is left untouched entirely — old/legacy
// writers that only ever send a flat totalAmount keep working unchanged.
// Used by createInquiry, updateInquiry, and bulkSync — deliberately NOT a
// Mongoose middleware hook, since bulkSync writes via bulkWrite(), which
// bypasses document/query middleware entirely.
function deriveTotalAmount(
  existing: { packagePrice?: number | null; samagriPrice?: number | null; samagriIncluded?: boolean } | null,
  patch: Record<string, unknown>,
): void {
  const packagePrice = "packagePrice" in patch ? (patch.packagePrice as number) : existing?.packagePrice;
  if (typeof packagePrice !== "number") return;
  const samagriIncluded = "samagriIncluded" in patch ? Boolean(patch.samagriIncluded) : Boolean(existing?.samagriIncluded);
  const samagriPrice = "samagriPrice" in patch ? (patch.samagriPrice as number | null) : existing?.samagriPrice;
  patch.totalAmount = packagePrice + (samagriIncluded ? (samagriPrice ?? 0) : 0);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildInquiryFilter(req: Request): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...crmOwnFilter(req) };
  if (req.query.status) filter.status = req.query.status;
  if (crmHasFullAccess(req) && req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo === "unassigned" ? null : req.query.assignedTo;
  }
  const search = String(req.query.search ?? "").trim();
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ clientName: re }, { phone: re }];
  }
  return filter;
}

function encodeCursor(doc: InquiryDoc) {
  return Buffer.from(JSON.stringify({ c: doc.createdAt, i: doc.id }), "utf8").toString("base64");
}
function decodeCursor(raw: string): { c: string; i: string } | null {
  try {
    const { c, i } = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (typeof c !== "string" || typeof i !== "string") return null;
    return { c, i };
  } catch {
    return null;
  }
}

export async function listInquiries(req: Request) {
  const wantsPagination =
    req.query.page !== undefined || req.query.limit !== undefined || Boolean(req.query.cursor);

  if (!wantsPagination) {
    const docs = await CrmInquiryModel.find(buildInquiryFilter(req)).sort({ createdAt: -1, id: -1 });
    return docs.map((d) => toJson(d as InquiryDoc));
  }

  const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 50, 1), 200);
  const baseFilter = buildInquiryFilter(req);

  let queryFilter: Record<string, unknown> = baseFilter;
  let page: number | null = null;
  let skip = 0;
  const cursor = req.query.cursor ? decodeCursor(String(req.query.cursor)) : null;

  if (cursor) {
    const cursorCond = {
      $or: [{ createdAt: { $lt: cursor.c } }, { createdAt: cursor.c, id: { $lt: cursor.i } }],
    };
    queryFilter = baseFilter.$or ? { $and: [baseFilter, cursorCond] } : { ...baseFilter, ...cursorCond };
  } else {
    page = Math.max(parseInt(String(req.query.page), 10) || 1, 1);
    skip = (page - 1) * limit;
  }

  const [docs, total] = await Promise.all([
    CrmInquiryModel.find(queryFilter)
      .sort({ createdAt: -1, id: -1 })
      .skip(skip)
      .limit(limit + 1),
    CrmInquiryModel.countDocuments(baseFilter),
  ]);

  const hasMore = docs.length > limit;
  const pageDocs = (hasMore ? docs.slice(0, limit) : docs) as InquiryDoc[];

  return {
    data: pageDocs.map(toJson),
    page,
    limit,
    total,
    hasMore,
    nextCursor: hasMore ? encodeCursor(pageDocs[pageDocs.length - 1]) : null,
  };
}

export async function getInquiry(req: Request, id: string) {
  const doc = await CrmInquiryModel.findOne({ id, ...crmOwnFilter(req) });
  if (!doc) throw ApiError.notFound("Not found");
  return toJson(doc as InquiryDoc);
}

export async function createInquiry(req: Request, body: Record<string, unknown>) {
  const payload = { ...body };
  if (!isCrmAdmin(req)) payload.assignedTo = req.crmUser?.salesPersonId;
  payload.version = 0;
  payload.updatedAt = payload.createdAt || new Date().toISOString();
  if (!payload.websiteBookingId) delete payload.websiteBookingId;
  deriveTotalAmount(null, payload);
  const doc = await CrmInquiryModel.create(payload);

  if (!doc.websiteBookingId && doc.status === "confirmed") {
    void transferConfirmedInquiryToBooking(doc as InquiryDoc).catch((err) =>
      console.error(`CRM->Booking transfer failed for inquiry ${doc.id}:`, (err as Error).message),
    );
  }

  return { id: doc.id, version: doc.version, updatedAt: doc.updatedAt };
}

// Fields the website-sync path understands — mirrors
// updateBookingFromCrm's CrmBookingUpdateInput in crm.service.ts.
const WEBSITE_SYNCABLE_FIELDS = [
  "clientName", "phone", "pujaName", "pujaDate", "pujaTime",
  "packagePrice", "samagriPrice",
  "totalAmount", "tokenAmount", "tokenStatus", "totalAmountStatus",
  "transactionId", "address", "notes", "status", "samagriIncluded",
] as const;

function pickWebsiteSyncableFields(doc: InquiryDoc): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of WEBSITE_SYNCABLE_FIELDS) {
    const value = (doc as unknown as Record<string, unknown>)[key];
    if (value !== undefined) out[key] = value;
  }
  if (out.pujaDate) out.pujaDate = String(out.pujaDate).slice(0, 10);
  return out;
}

export async function updateInquiry(req: Request, id: string, body: Record<string, unknown>) {
  const payload = { ...body };
  const clientVersion = payload.version;
  delete payload.version;
  if (!payload.websiteBookingId) delete payload.websiteBookingId;

  const filter: Record<string, unknown> = { id, ...crmOwnFilter(req) };
  if (clientVersion !== undefined && clientVersion !== null) {
    filter.version = clientVersion;
  }

  if ("packagePrice" in payload || "samagriPrice" in payload || "samagriIncluded" in payload) {
    const existing = await CrmInquiryModel.findOne(
      { id, ...crmOwnFilter(req) },
      "packagePrice samagriPrice samagriIncluded",
    );
    deriveTotalAmount(existing, payload);
  }

  const doc = (await CrmInquiryModel.findOneAndUpdate(
    filter,
    { $set: { ...payload, updatedAt: new Date().toISOString() }, $inc: { version: 1 } },
    { new: true },
  )) as InquiryDoc | null;

  if (doc) {
    if (doc.websiteBookingId) {

      void importAndSyncBooking(doc.websiteBookingId, pickWebsiteSyncableFields(doc)).catch((err) =>
        console.error(`Website sync failed for ${doc.websiteBookingId}:`, (err as Error).message),
      );
    } else if (doc.status === "confirmed") {

      void transferConfirmedInquiryToBooking(doc).catch((err) =>
        console.error(`CRM->Booking transfer failed for inquiry ${doc.id}:`, (err as Error).message),
      );
    }
    return { updated: true, version: doc.version, updatedAt: doc.updatedAt };
  }

  if (clientVersion !== undefined && clientVersion !== null) {
    const current = await CrmInquiryModel.findOne({ id, ...crmOwnFilter(req) });
    if (current) {
      throw new InquiryConflictError(toJson(current as InquiryDoc));
    }
  }
  throw ApiError.notFound("Not found");
}

export class InquiryConflictError extends ApiError {
  constructor(public readonly current: ReturnType<typeof toJson>) {
    super(409, "This inquiry has been updated by another user.");
  }
}

async function transferConfirmedInquiryToBooking(doc: InquiryDoc) {
  if (!doc.pujaDate) return; // nothing to schedule yet — assignPandit already requires this before it'll proceed
  const poojaDate = new Date(doc.pujaDate);
  if (Number.isNaN(poojaDate.getTime())) return;

  const stillUnlinked = await CrmInquiryModel.exists({ id: doc.id, websiteBookingId: { $exists: false } });
  if (!stillUnlinked) return;

  const customer = await findOrCreateCustomerByMobile({ name: doc.clientName, mobile: doc.phone });
  const bookingId = await generateBookingId();
  const reachedOtp = await generateReachedOtp();
  const finalAmount = doc.totalAmount ?? 0;
  const advanceAmount = doc.tokenAmount ?? 0;

  const matchedPooja = doc.pujaName ? await PoojaModel.findOne({ name: new RegExp(`^${doc.pujaName}$`, "i") }) : null;

  await BookingModel.create({
    bookingId,
    customer: customer._id,
    customerSnapshot: { name: customer.name, mobile: customer.mobile, email: customer.email },
    serviceType: "pooja",
    pooja: matchedPooja?._id,
    package: { name: doc.pujaName },
    address: doc.address ?? undefined,
    poojaDate,
    poojaTime: doc.pujaTime ?? undefined,
    status: "booking_confirmed",
    pricing: {
      packagePrice: doc.packagePrice ?? undefined,
      samagriCharges: doc.samagriIncluded ? (doc.samagriPrice ?? 0) : 0,
      finalAmount,
      advanceAmount,
      remainingAmount: Math.max(finalAmount - advanceAmount, 0),
      transactionId: doc.transactionId ?? undefined,
      tokenStatus: doc.tokenStatus,
      totalAmountStatus: doc.totalAmountStatus,
    },
    bookingChannel: "offline",
    bookingSource: "admin",
    timeline: [{ status: "booking_confirmed", note: `Transferred from CRM inquiry ${doc.id}` }],
    panditExecution: { reachedOtpHash: reachedOtp.hash, reachedOtpPlain: reachedOtp.plain },
  });

  await CrmInquiryModel.updateOne({ id: doc.id }, { $set: { websiteBookingId: bookingId } });
}

async function importAndSyncBooking(websiteBookingId: string, fields: Record<string, unknown>) {
  const { updateBookingFromCrm } = await import("../crm/crm.service.js");
  return updateBookingFromCrm(websiteBookingId, fields as never);
}

export async function assignPandit(
  req: Request,
  id: string,
  input: { panditId: string; panditName: string; slot: string },
) {
  const doc = (await CrmInquiryModel.findOne({ id, ...crmOwnFilter(req) })) as InquiryDoc | null;
  if (!doc) throw ApiError.notFound("Not found");
  if (doc.status !== "confirmed") {
    throw ApiError.badRequest("Only confirmed bookings can have a pandit assigned");
  }
  if (!doc.pujaDate) {
    throw ApiError.badRequest("Puja date is required before assigning a pandit");
  }

  if (doc.panditId && doc.assignedSlot) {
    await releasePanditSlot(doc.panditId, doc.id).catch(() => undefined);
  }

  await reservePanditSlot({
    panditId: input.panditId,
    date: String(doc.pujaDate).slice(0, 10),
    slot: input.slot as never,
    ref: doc.id,
    websiteBookingId: doc.websiteBookingId ?? undefined,
  });

  doc.panditId = input.panditId;
  doc.panditName = input.panditName;
  doc.assignedSlot = input.slot;
  doc.updatedAt = new Date().toISOString();
  doc.version += 1;
  await doc.save();

  return toJson(doc);
}

export async function assignPanditToEvent(
  req: Request,
  id: string,
  eventId: string,
  input: { panditId: string; panditName: string; slot: string },
) {
  const doc = (await CrmInquiryModel.findOne({ id, ...crmOwnFilter(req) })) as InquiryDoc | null;
  if (!doc) throw ApiError.notFound("Not found");
  if (doc.status !== "confirmed") {
    throw ApiError.badRequest("Only confirmed bookings can have a pandit assigned");
  }
  const event = doc.pujaEvents.find((e) => e.id === eventId);
  if (!event) throw ApiError.notFound("Puja date not found on this booking");

  const ref = `${doc.id}:${event.id}`;

  if (event.panditId && event.assignedSlot) {
    await releasePanditSlot(event.panditId, ref).catch(() => undefined);
  }

  event.panditId = input.panditId;
  event.panditName = input.panditName;
  event.assignedSlot = input.slot;

  const earliest = [...doc.pujaEvents].sort((a, b) => a.date.localeCompare(b.date))[0];
  await reservePanditSlot({
    panditId: input.panditId,
    date: String(event.date).slice(0, 10),
    slot: input.slot as never,
    ref,
    websiteBookingId: event.id === earliest.id ? (doc.websiteBookingId ?? undefined) : undefined,
  });

  doc.panditId = earliest.panditId ?? null;
  doc.panditName = earliest.panditName ?? null;
  doc.assignedSlot = earliest.assignedSlot ?? null;

  doc.updatedAt = new Date().toISOString();
  doc.version += 1;
  await doc.save();

  return toJson(doc);
}

export async function deleteInquiry(id: string) {
  const doc = await CrmInquiryModel.findOne({ id });
  if (!doc) throw ApiError.notFound("Not found");

  const refs = [doc.id, ...(doc.pujaEvents ?? []).map((event) => `${doc.id}:${event.id}`)];
  await PanditSlotReservationModel.deleteMany({ bookingRef: { $in: refs } });

  if (doc.websiteBookingId) {
    await BookingModel.deleteOne({ bookingId: doc.websiteBookingId });
  }

  await CrmInquiryModel.deleteOne({ id });
}

export async function getStats(req: Request) {
  const scope = crmOwnFilter(req);
  const today = new Date().toISOString().slice(0, 10);
  const [totalRecords, confirmed, inquiryCount, todayPujas, todayFollowUps, tokenData, totalCollectedData, confirmedDocs] =
    await Promise.all([
      CrmInquiryModel.countDocuments(scope),
      CrmInquiryModel.countDocuments({ ...scope, status: "confirmed" }),
      CrmInquiryModel.countDocuments({ ...scope, status: "inquiry" }),
      CrmInquiryModel.countDocuments({
        ...scope,
        $or: [
          { pujaEvents: { $elemMatch: { date: { $regex: `^${today}` } } } },
          { pujaEvents: { $size: 0 }, pujaDate: { $regex: `^${today}` } },
        ],
      }),
      CrmInquiryModel.countDocuments({ ...scope, nextCallDate: { $regex: `^${today}` } }),
      CrmInquiryModel.aggregate([
        { $match: { ...scope, tokenStatus: "received" } },
        { $group: { _id: null, total: { $sum: "$tokenAmount" } } },
      ]),
      CrmInquiryModel.aggregate([
        { $match: { ...scope, totalAmountStatus: "received" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      CrmInquiryModel.find(
        { ...scope, status: "confirmed" },
        "totalAmount tokenAmount tokenStatus totalAmountStatus packagePrice samagriPrice samagriIncluded",
      ),
    ]);

  const tokenTotal = tokenData[0]?.total ?? 0;
  const totalCollected = totalCollectedData[0]?.total ?? 0;
  const pendingBalance = confirmedDocs.reduce((sum, d) => {
    if (d.totalAmountStatus === "received") return sum;
    const paid = d.tokenStatus === "received" ? d.tokenAmount : 0;
    return sum + (d.totalAmount - paid);
  }, 0);
  const packageRevenue = confirmedDocs.reduce((sum, d) => sum + (d.packagePrice ?? 0), 0);
  const samagriRevenue = confirmedDocs.reduce((sum, d) => sum + (d.samagriIncluded ? (d.samagriPrice ?? 0) : 0), 0);

  return {
    totalRecords,
    confirmed,
    inquiryCount,
    todayPujas,
    todayFollowUps,
    tokenTotal,
    totalCollected,
    pendingBalance,
    packageRevenue,
    samagriRevenue,
  };
}

export async function bulkSync(req: Request, inquiries: Array<Record<string, unknown>>) {
  let items = inquiries;
  if (!isCrmAdmin(req)) {
    const ids = inquiries.map((item) => item.id);
    const existing = await CrmInquiryModel.find({ id: { $in: ids } }, "id assignedTo");
    const existingIds = new Set(existing.map((d) => d.id));
    const ownedIds = new Set(
      existing.filter((d) => d.assignedTo === req.crmUser?.salesPersonId).map((d) => d.id),
    );
    items = inquiries
      .filter((item) => !existingIds.has(item.id as string) || ownedIds.has(item.id as string))
      .map((item) =>
        existingIds.has(item.id as string) ? item : { ...item, assignedTo: req.crmUser?.salesPersonId },
      );
  }

  const pricingTouchedIds = items
    .filter((item) => "packagePrice" in item || "samagriPrice" in item || "samagriIncluded" in item)
    .map((item) => item.id as string);
  const existingPricingById = new Map(
    pricingTouchedIds.length > 0
      ? (
          await CrmInquiryModel.find(
            { id: { $in: pricingTouchedIds } },
            "id packagePrice samagriPrice samagriIncluded",
          )
        ).map((d) => [d.id, d])
      : [],
  );

  const ops = items.map((item) => {
    const body = { ...item };
    delete body.version;
    delete body.updatedAt;
    deriveTotalAmount(existingPricingById.get(item.id as string) ?? null, body);
    return {
      updateOne: {
        filter: { id: item.id },
        update: { $set: { ...body, updatedAt: new Date().toISOString() }, $inc: { version: 1 } },
        upsert: true,
      },
    };
  });
  if (ops.length > 0) await CrmInquiryModel.bulkWrite(ops);

  // Same as createInquiry/updateInquiry: a record synced in from the CRM
  // app's offline queue can land already "confirmed" (set locally while the
  // device was offline) — catch it here too so it still gets a Booking.
  const confirmedIds = items
    .filter((item) => item.status === "confirmed" && !item.websiteBookingId)
    .map((item) => item.id as string);
  if (confirmedIds.length > 0) {
    const confirmedDocs = (await CrmInquiryModel.find({
      id: { $in: confirmedIds },
      websiteBookingId: { $exists: false },
    })) as InquiryDoc[];
    for (const doc of confirmedDocs) {
      void transferConfirmedInquiryToBooking(doc).catch((err) =>
        console.error(`CRM->Booking transfer failed for inquiry ${doc.id}:`, (err as Error).message),
      );
    }
  }

  return { synced: ops.length };
}

// Re-exported so the CRM-facing pandit routes (features/crm-inquiries) can
// reuse the exact same in-process functions websiteClient.js used to call
// over HTTP, without every caller needing to import features/crm directly.
export { listCrmPandits, getCrmAvailability };

export function normalizeIndianPhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

// Ported from server.js's handleInboundWhatsAppMessage — kept here since it
// operates on CrmInquiryModel directly; the WhatsApp webhook route in
// crm-webhooks calls this.
export async function createInboundWhatsAppLead(phone: string, contactName?: string) {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return;

  const today = new Date().toISOString().slice(0, 10);
  const existing = await CrmInquiryModel.find({ phone: normalized }, "status pujaDate pujaEndDate");
  const hasOpenLead = existing.some((r) => {
    if (r.status === "inquiry") return true;
    if (r.status === "confirmed") {
      const endDate = r.pujaEndDate || r.pujaDate;
      return !endDate || endDate >= today;
    }
    return false;
  });
  if (hasOpenLead) return;

  const nowIso = new Date().toISOString();
  await CrmInquiryModel.create({
    id: crypto.randomUUID(),
    clientName: contactName && contactName.trim() ? contactName.trim() : "WhatsApp Lead",
    phone: normalized,
    pujaName: "Follow Up",
    status: "inquiry",
    source: "whatsapp",
    assignedTo: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    version: 0,
  });
}

export async function syncWebsiteBookings(since?: string) {
  const { listConfirmedBookingsForCrm } = await import("../crm/crm.service.js");
  const bookings = await listConfirmedBookingsForCrm({ since });
  const synced = [];
  for (const booking of bookings) {
    synced.push(toJson((await upsertWebsiteBooking(booking as unknown as Record<string, unknown>)) as InquiryDoc));
  }
  return { synced: synced.length, bookings: synced };
}

const WEBSITE_SYNCED_FIELDS = [
  "clientName", "phone", "pujaName", "pujaDate", "pujaTime",
  "totalAmount", "tokenAmount", "tokenStatus", "totalAmountStatus", "address",
  "samagriIncluded",
] as const;

// Ported from server.js's upsertWebsiteBooking. Used both by the
// website-booking webhook receiver and the manual sync-pull above.
export async function upsertWebsiteBooking(payload: Record<string, unknown>) {
  const {
    id, clientName, phone, pujaName, pujaDate, pujaTime,
    totalAmount, tokenAmount, tokenStatus, totalAmountStatus,
    address, samagriIncluded, createdAt,
  } = payload as Record<string, unknown>;
  if (!id || !clientName || !phone) {
    throw ApiError.badRequest("id, clientName and phone are required");
  }
  const incoming: Record<string, unknown> = {
    clientName, phone, pujaName, pujaDate, pujaTime,
    totalAmount, tokenAmount, tokenStatus, totalAmountStatus, address,
    samagriIncluded,
  };

  const nowIso = new Date().toISOString();
  const existing = (await CrmInquiryModel.findOne({ websiteBookingId: id })) as InquiryDoc | null;
  if (existing) {
    const snapshot = (existing.websiteSyncSnapshot as Record<string, unknown>) || {};
    const merged: Record<string, unknown> = {};
    const existingRecord = existing as unknown as Record<string, unknown>;
    for (const key of WEBSITE_SYNCED_FIELDS) {
      if (incoming[key] === undefined || incoming[key] === null) continue;
      const untouchedSinceLastSync = snapshot[key] === undefined || existingRecord[key] === snapshot[key];
      merged[key] = untouchedSinceLastSync ? incoming[key] : existingRecord[key];
    }
    existing.set({ ...merged, websiteSyncSnapshot: incoming, updatedAt: nowIso });
    existing.version += 1;
    await existing.save();
    return existing;
  }

  const doc = await CrmInquiryModel.create({
    id: crypto.randomUUID(),
    websiteBookingId: id,
    clientName,
    phone,
    pujaName: pujaName || "Puja Booking",
    pujaDate: pujaDate || null,
    pujaTime: pujaTime || null,
    status: "confirmed",
    totalAmount: totalAmount || 0,
    tokenAmount: tokenAmount || 0,
    tokenStatus: tokenStatus || "pending",
    totalAmountStatus: totalAmountStatus || "pending",
    address: address || null,
    samagriIncluded: samagriIncluded || false,
    source: "website",
    assignedTo: null,
    websiteSyncSnapshot: incoming,
    createdAt: createdAt || nowIso,
    updatedAt: nowIso,
    version: 0,
  });
  return doc;
}
