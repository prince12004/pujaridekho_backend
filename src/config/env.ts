import { config } from "dotenv";
import { z } from "zod";

config({ override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().default("v1"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  ADMIN_JWT_SECRET: z.string().min(16, "ADMIN_JWT_SECRET must be at least 16 characters"),
  ADMIN_SEED_NAME: z.string().optional(),
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(8).optional(),
  PAYU_MODE: z.enum(["test", "live"]).default("test"),
  PAYU_MERCHANT_KEY: z.string().default("gtKFFx"),
  PAYU_MERCHANT_SALT: z.string().default("eCwWELxi"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  WEBSITE_API_KEY: z.string().min(16, "WEBSITE_API_KEY must be at least 16 characters"),
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
