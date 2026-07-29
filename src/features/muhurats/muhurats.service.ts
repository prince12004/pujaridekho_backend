import { MuhuratModel } from "../../models/muhurat.model.js";
import { PoojaModel } from "../../models/pooja.model.js";

function startOfDay(date: string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface AvailableMuhuratSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  timeRange: string;
}

function formatTimeRange(startTime: string, endTime: string): string {
  const format = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };
  return `${format(startTime)} - ${format(endTime)}`;
}

// Muhurat availability is looked up per Pooja + Date — there is no global
// fallback pool. If no schedule exists for this pooja on this date, the
// customer sees "No Muhurat Available for the Selected Date."
export async function getAvailableMuhurats(poojaSlug: string, date: string): Promise<AvailableMuhuratSlot[]> {
  const pooja = await PoojaModel.findOne({ slug: poojaSlug });
  if (!pooja) return [];

  const muhurat = await MuhuratModel.findOne({ pooja: pooja._id, date: startOfDay(date), isActive: true });
  if (!muhurat) return [];

  return muhurat.slots
    .filter((slot) => slot.isActive && (slot.capacity == null || slot.bookedCount < slot.capacity))
    .map((slot) => ({
      slotId: slot._id!.toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      timeRange: formatTimeRange(slot.startTime, slot.endTime),
    }));
}
