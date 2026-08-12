import { config } from "dotenv";
import { z } from "zod";

config({ override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().default("v1"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  // Must be publicly reachable for PayU's servers to POST payment callbacks to
  // (e.g. an ngrok tunnel in local dev, the real domain in production).
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  ADMIN_JWT_SECRET: z.string().min(16, "ADMIN_JWT_SECRET must be at least 16 characters"),
  // Only consumed by the one-off seed script (scripts/seed-admin.ts) — never
  // read by the running server, so no admin credentials ship in app code.
  ADMIN_SEED_NAME: z.string().optional(),
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(8).optional(),
  // PayU's own publicly-documented sandbox test credentials by default — swap
  // for the real merchant key/salt via env vars before going live.
  PAYU_MODE: z.enum(["test", "live"]).default("test"),
  PAYU_MERCHANT_KEY: z.string().default("gtKFFx"),
  PAYU_MERCHANT_SALT: z.string().default("eCwWELxi"),
  // Media Library uploads (pooja/festival/product/blog/pandit images) go to
  // Cloudinary when all three vars below are set. Falls back to local disk
  // storage under /uploads when unset, so the Media Library keeps working in
  // dev without any cloud account.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
