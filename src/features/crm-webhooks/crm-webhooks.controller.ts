import crypto from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { createInboundWhatsAppLead, upsertWebsiteBooking } from "../crm-inquiries/crm-inquiries.service.js";

// Ported from pujaridekhocrm/backend/server.js's webhook receivers.
// Scaffolding only — no real Meta/WhatsApp Business API credentials exist
// yet. Kept unwired/stubbed exactly as in the original, deliberately not
// extended with a real integration in this phase.

export function getMetaWebhookVerify(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

export function postMetaWebhook(req: Request, res: Response) {
  // TODO(real integration): verify X-Hub-Signature-256 against
  // META_APP_SECRET once a real Meta app exists.
  // TODO(real integration): map the actual Lead Ads/Messenger/Instagram DM
  // payload shape into { clientName, phone, pujaName, source } and create a
  // CrmInquiry — the shape can't be finalized without a live payload sample.
  console.log("[stub] Meta webhook payload:", JSON.stringify(req.body));
  res.sendStatus(200);
}

export const getWhatsappWebhookVerify = getMetaWebhookVerify;

export async function postWhatsappWebhook(req: Request, res: Response) {
  try {
    const secret = env.WHATSAPP_APP_SECRET;
    if (secret) {
      const signature = req.headers["x-hub-signature-256"];
      const expected =
        "sha256=" +
        crypto.createHmac("sha256", secret).update((req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0)).digest("hex");
      const sigBuf = Buffer.from(String(signature ?? ""));
      const expectedBuf = Buffer.from(expected);
      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return res.sendStatus(403);
      }
    }

    const entries = (req.body?.entry ?? []) as Array<{ changes?: Array<{ value?: Record<string, unknown> }> }>;
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = (change.value ?? {}) as { messages?: Array<{ from: string }>; contacts?: Array<{ wa_id?: string; profile?: { name?: string } }> };
        if (!Array.isArray(value.messages) || value.messages.length === 0) continue;

        const contactsByWaId: Record<string, string | undefined> = {};
        for (const c of value.contacts ?? []) {
          if (c.wa_id) contactsByWaId[c.wa_id] = c.profile?.name;
        }
        for (const message of value.messages) {
          await createInboundWhatsAppLead(message.from, contactsByWaId[message.from]);
        }
      }
    }
  } catch (err) {
    console.error("WhatsApp webhook processing failed:", (err as Error).message);
  }
  res.sendStatus(200);
}

export async function postWebsiteBookingWebhook(req: Request, res: Response) {
  const expected = env.WEBSITE_WEBHOOK_VERIFY_TOKEN;
  if (expected && req.headers["x-webhook-token"] !== expected) {
    return res.sendStatus(403);
  }
  try {
    await upsertWebsiteBooking(req.body as Record<string, unknown>);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
