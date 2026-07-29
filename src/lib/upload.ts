import multer from "multer";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

// Buffered in memory rather than written to disk — the buffer is handed
// straight to cloud-storage.ts, which uploads it to Google Cloud Storage (or
// falls back to local disk only when no bucket is configured).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only image files (jpeg, png, webp, gif, svg) are allowed"));
      return;
    }
    cb(null, true);
  },
});
