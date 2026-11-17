import { BookingModel } from "../models/booking.model.js";
import { CounterModel } from "../models/counter.model.js";

const MAX_ATTEMPTS = 5;

// Next "PD-<year>-NNNNNN" ID.
//
// Never derived from countDocuments(): once any booking is deleted (e.g. via
// CRM inquiry deletion) count+1 points at an ID that is still taken and every
// create after that fails with E11000 "A record with this bookingId already
// exists" — the bug customers hit on "Book Now".
//
// Instead an atomic per-year counter hands out numbers with $inc, so two
// simultaneous bookings can never get the same one. Before incrementing, the
// counter is raised ($max — atomic, never lowers it) to the highest ID
// already in the collection, so it is self-seeding on first use and
// self-healing if bookings were ever inserted by other means.
export async function generateBookingId() {
  const year = new Date().getFullYear();
  const prefix = `PD-${year}-`;
  const counterId = `booking:${prefix}`;

  const latest = await BookingModel.findOne({ bookingId: { $regex: `^${prefix}\\d+$` } })
    .sort({ bookingId: -1 })
    .select("bookingId")
    .lean();
  const highestExisting = latest ? parseInt(latest.bookingId.slice(prefix.length), 10) || 0 : 0;

  await CounterModel.updateOne({ _id: counterId }, { $max: { seq: highestExisting } }, { upsert: true });
  const counter = await CounterModel.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();

  return `${prefix}${String(counter!.seq).padStart(6, "0")}`;
}

export function isDuplicateBookingIdError(err: unknown) {
  const e = err as { code?: number; keyPattern?: Record<string, unknown>; message?: string };
  if (e?.code !== 11000) return false;
  return Boolean(e.keyPattern?.bookingId) || Boolean(e.message?.includes("bookingId"));
}

// Creates a booking with a freshly generated bookingId. As a last line of
// defence a bookingId unique-index violation (e.g. an ID inserted manually
// between seeding and insert) is retried with a new ID instead of surfacing
// to the customer.
export async function createBookingWithUniqueId(doc: Record<string, unknown>) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await BookingModel.create({ ...doc, bookingId: await generateBookingId() });
    } catch (err) {
      if (!isDuplicateBookingIdError(err) || attempt >= MAX_ATTEMPTS) throw err;
    }
  }
}
