import { ApiError } from "../../lib/api-error.js";
import { MediaModel } from "../../models/media.model.js";
import { deleteFile, saveFile } from "../../lib/cloud-storage.js";

export async function listMedia(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    MediaModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    MediaModel.countDocuments(),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function saveUploadedMedia(file: Express.Multer.File, uploadedBy?: string) {
  const saved = await saveFile(file.buffer, file.originalname, file.mimetype);
  return MediaModel.create({
    url: saved.url,
    filename: saved.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy,
  });
}

export async function deleteMedia(id: string) {
  const media = await MediaModel.findById(id);
  if (!media) throw ApiError.notFound("Media not found");
  await deleteFile(media.filename);
  await media.deleteOne();
}
