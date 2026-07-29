import { NewsletterSubscriberModel } from "../../models/newsletter-subscriber.model.js";

export async function subscribeToNewsletter(email: string) {
  return NewsletterSubscriberModel.findOneAndUpdate(
    { email },
    { email, status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
