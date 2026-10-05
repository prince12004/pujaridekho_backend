import { Router } from "express";
import {
  getMetaWebhookVerify,
  getWhatsappWebhookVerify,
  postMetaWebhook,
  postWebsiteBookingWebhook,
  postWhatsappWebhook,
} from "./crm-webhooks.controller.js";

export const crmWebhooksRouter = Router();

// Public — Meta/WhatsApp/the booking-confirmation source call these
// directly with their own verify-token/signature scheme, not CRM JWT auth,
// same as the original server.js (mounted before its requireAuth).
crmWebhooksRouter.get("/meta", getMetaWebhookVerify);
crmWebhooksRouter.post("/meta", postMetaWebhook);
crmWebhooksRouter.get("/whatsapp", getWhatsappWebhookVerify);
crmWebhooksRouter.post("/whatsapp", postWhatsappWebhook);
crmWebhooksRouter.post("/website-booking", postWebsiteBookingWebhook);
