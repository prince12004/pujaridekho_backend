import { ApiError } from "../../lib/api-error.js";
import { NewsletterSubscriberModel } from "../../models/newsletter-subscriber.model.js";

export async function listSubscribers() {
  return NewsletterSubscriberModel.find().sort({ createdAt: -1 });
}

export async function deleteSubscriber(id: string) {
  const subscriber = await NewsletterSubscriberModel.findById(id);
  if (!subscriber) throw ApiError.notFound("Subscriber not found");
  await subscriber.deleteOne();
}
