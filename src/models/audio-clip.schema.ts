import { Schema } from "mongoose";

// Short audio clips about a pooja / festival (importance, katha summary,
// vidhi), e.g. one Hindi and one English version. Played on the pooja page
// in the app and website. Only active clips are returned publicly, sorted by
// sortOrder.
export const audioClipSchema = new Schema({
  title: { type: String, required: true, trim: true },
  language: { type: String, default: "hi", trim: true },
  url: { type: String, required: true, trim: true },
  durationSec: { type: Number, min: 0, default: null },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

interface AudioClip {
  _id?: unknown;
  title: string;
  language?: string;
  url: string;
  durationSec?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

/** Public shape: active clips only, in display order. */
export function publicAudios(audios: AudioClip[] | undefined | null) {
  return (audios ?? [])
    .filter((a) => a.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((a) => ({
      _id: a._id,
      title: a.title,
      language: a.language ?? "hi",
      url: a.url,
      durationSec: a.durationSec ?? null,
      sortOrder: a.sortOrder ?? 0,
      isActive: true,
    }));
}
