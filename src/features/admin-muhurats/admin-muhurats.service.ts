import { ApiError } from "../../lib/api-error.js";
import { MuhuratModel } from "../../models/muhurat.model.js";
import { PoojaModel } from "../../models/pooja.model.js";

function startOfDay(date: Date | string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface MuhuratSlotInput {
  startTime: string;
  endTime: string;
  capacity?: number;
  isActive?: boolean;
}

export interface CreateMuhuratInput {
  pooja: string;
  date: string;
  slots: MuhuratSlotInput[];
  notes?: string;
  isActive?: boolean;
}

export async function listAdminMuhurats(filters: { poojaId?: string; date?: string; search?: string }) {
  const query: Record<string, unknown> = {};
  if (filters.poojaId) query.pooja = filters.poojaId;
  if (filters.date) query.date = startOfDay(filters.date);

  let muhurats = await MuhuratModel.find(query).populate("pooja", "name slug").sort({ date: -1 });

  if (filters.search) {
    const term = filters.search.toLowerCase();
    muhurats = muhurats.filter((m) => (m.pooja as unknown as { name?: string })?.name?.toLowerCase().includes(term));
  }

  return muhurats;
}

export async function getAdminMuhuratById(id: string) {
  const muhurat = await MuhuratModel.findById(id).populate("pooja", "name slug");
  if (!muhurat) throw ApiError.notFound("Muhurat not found");
  return muhurat;
}

export async function createMuhurat(input: CreateMuhuratInput) {
  const pooja = await PoojaModel.findById(input.pooja);
  if (!pooja) throw ApiError.badRequest("Selected pooja does not exist");

  const date = startOfDay(input.date);
  const existing = await MuhuratModel.findOne({ pooja: input.pooja, date });
  if (existing) throw ApiError.conflict("A Muhurat schedule already exists for this pooja on this date. Edit it instead.");

  return MuhuratModel.create({
    pooja: input.pooja,
    date,
    slots: input.slots.map((s) => ({ ...s, bookedCount: 0 })),
    notes: input.notes,
    isActive: input.isActive ?? true,
  });
}

export async function updateMuhurat(id: string, input: Partial<CreateMuhuratInput>) {
  const muhurat = await getAdminMuhuratById(id);
  if (input.date) muhurat.date = startOfDay(input.date);
  if (input.slots) {
    // Preserve bookedCount for slots that already existed (matched by _id sent back from the client).
    const existingById = new Map(muhurat.slots.map((s) => [s._id?.toString(), s]));
    const nextSlots = input.slots.map((slot) => {
      const incoming = slot as MuhuratSlotInput & { _id?: string };
      const prior = incoming._id ? existingById.get(incoming._id) : undefined;
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        isActive: slot.isActive ?? true,
        bookedCount: prior?.bookedCount ?? 0,
      };
    });
    muhurat.slots = nextSlots as never;
  }
  if (input.notes !== undefined) muhurat.notes = input.notes;
  if (input.isActive !== undefined) muhurat.isActive = input.isActive;
  await muhurat.save();
  return muhurat;
}

export async function deleteMuhurat(id: string) {
  const muhurat = await getAdminMuhuratById(id);
  await muhurat.deleteOne();
}

export async function copyMuhurat(id: string, targetDates: string[]) {
  const source = await getAdminMuhuratById(id);
  const created = [];
  for (const targetDate of targetDates) {
    const date = startOfDay(targetDate);
    const exists = await MuhuratModel.findOne({ pooja: source.pooja, date });
    if (exists) continue;
    const copy = await MuhuratModel.create({
      pooja: source.pooja,
      date,
      slots: source.slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime, capacity: s.capacity, isActive: s.isActive, bookedCount: 0 })),
      notes: source.notes,
      isActive: source.isActive,
    });
    created.push(copy);
  }
  return created;
}
