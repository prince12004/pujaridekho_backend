import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

const CLOUDINARY_FOLDER = "pujari-media";

const cloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "[cloud-storage] CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET are not all set — " +
      "Media Library uploads will be saved to local disk instead of Cloudinary. Set all three to enable it.",
  );
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

function generateFilename(originalName: string) {
  const ext = path.extname(originalName);
  const unique = crypto.randomBytes(8).toString("hex");
  return `${Date.now()}-${unique}${ext}`;
}

export interface SavedFile {
  filename: string;
  url: string;
}

export async function saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<SavedFile> {
  const filename = generateFilename(originalName);

  if (cloudinaryConfigured) {
    const publicId = `${CLOUDINARY_FOLDER}/${path.parse(filename).name}`;
    const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${buffer.toString("base64")}`, {
      public_id: publicId,
      resource_type: "image",
    });
    return { filename: result.public_id, url: result.secure_url };
  }

  await fsPromises.writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return { filename, url: `${env.API_PUBLIC_URL}/uploads/${filename}` };
}

export async function deleteFile(filename: string): Promise<void> {
  if (cloudinaryConfigured) {
    await cloudinary.uploader.destroy(filename, { resource_type: "image" });
    return;
  }
  await fsPromises.unlink(path.join(LOCAL_UPLOAD_DIR, filename)).catch(() => undefined);
}
