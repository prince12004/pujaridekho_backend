import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Storage } from "@google-cloud/storage";
import { env } from "../config/env.js";

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

const gcsStorage = env.GCS_BUCKET_NAME ? new Storage() : null;
const bucket = gcsStorage?.bucket(env.GCS_BUCKET_NAME!);

if (!gcsStorage) {
  console.warn(
    "[cloud-storage] GCS_BUCKET_NAME is not set — Media Library uploads will be saved to local disk instead of " +
      "Google Cloud Storage. Set GCS_BUCKET_NAME and GOOGLE_APPLICATION_CREDENTIALS to enable real cloud storage.",
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

  if (bucket) {
    const blob = bucket.file(filename);
    await blob.save(buffer, { contentType: mimeType, resumable: false });
    return { filename, url: `https://storage.googleapis.com/${env.GCS_BUCKET_NAME}/${filename}` };
  }

  await fsPromises.writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return { filename, url: `${env.API_PUBLIC_URL}/uploads/${filename}` };
}

export async function deleteFile(filename: string): Promise<void> {
  if (bucket) {
    await bucket.file(filename).delete({ ignoreNotFound: true });
    return;
  }
  await fsPromises.unlink(path.join(LOCAL_UPLOAD_DIR, filename)).catch(() => undefined);
}
