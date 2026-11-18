import fs from "node:fs";
import admin from "firebase-admin";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { DeviceModel } from "../models/device.model.js";

// Firebase Cloud Messaging. Initialised lazily from FIREBASE_SERVICE_ACCOUNT
// (the JSON itself, or a path to the .json file). When it isn't configured,
// every send is a no-op that reports 0 sent — callers never need to care.
let messaging: admin.messaging.Messaging | null | undefined;

function getMessaging(): admin.messaging.Messaging | null {
  if (messaging !== undefined) return messaging;
  const raw = env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    logger.warn("FIREBASE_SERVICE_ACCOUNT is not set — push notifications are disabled (in-app notifications still work).");
    messaging = null;
    return null;
  }
  try {
    const json = raw.startsWith("{") ? raw : fs.readFileSync(raw, "utf8");
    const app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
    messaging = app.messaging();
  } catch (err) {
    logger.error("Could not initialise Firebase — push notifications are disabled", {
      message: err instanceof Error ? err.message : String(err),
    });
    messaging = null;
  }
  return messaging;
}

export function isPushConfigured() {
  return getMessaging() !== null;
}

export interface PushPayload {
  type: string;
  title: string;
  message: string;
  link?: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
}

const BATCH_SIZE = 500; // FCM multicast limit
const DEAD_TOKEN_CODES = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

/** Sends to the given FCM tokens in batches of 500 and removes dead tokens. */
export async function sendPushToTokens(tokens: string[], payload: PushPayload) {
  const fcm = getMessaging();
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!fcm || unique.length === 0) return { sent: 0, failed: 0, configured: !!fcm };

  // FCM data values must all be strings.
  const data: Record<string, string> = { type: payload.type, link: payload.link ?? "" };
  for (const [k, v] of Object.entries(payload.data ?? {})) {
    if (v !== undefined && v !== null) data[k] = typeof v === "string" ? v : JSON.stringify(v);
  }

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    try {
      const res = await fcm.sendEachForMulticast({
        tokens: batch,
        notification: { title: payload.title, body: payload.message, ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}) },
        data,
        android: { priority: "high", notification: { channelId: "bookings", sound: "default" } },
        apns: { payload: { aps: { sound: "default" } }, ...(payload.imageUrl ? { fcmOptions: { imageUrl: payload.imageUrl } } : {}) },
      });
      sent += res.successCount;
      failed += res.failureCount;
      const dead = res.responses
        .map((r, idx) => (r.error && DEAD_TOKEN_CODES.has(r.error.code) ? batch[idx] : null))
        .filter((t): t is string => !!t);
      if (dead.length) await DeviceModel.deleteMany({ token: { $in: dead } });
    } catch (err) {
      failed += batch.length;
      logger.error("Push batch failed", { message: err instanceof Error ? err.message : String(err) });
    }
  }
  return { sent, failed, configured: true };
}

/** Push to every device of one customer. Never throws. */
export async function sendPushToCustomer(customerId: string, payload: PushPayload) {
  try {
    const devices = await DeviceModel.find({ customer: customerId }).select("token").lean();
    return await sendPushToTokens(devices.map((d) => d.token), payload);
  } catch (err) {
    logger.error("Push to customer failed", { customerId, message: err instanceof Error ? err.message : String(err) });
    return { sent: 0, failed: 0, configured: isPushConfigured() };
  }
}
