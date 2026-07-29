import { ApiError } from "../../lib/api-error.js";
import { TestimonialModel } from "../../models/testimonial.model.js";

export async function listTestimonials() {
  return TestimonialModel.find().sort({ sortOrder: 1, createdAt: -1 });
}

export async function getTestimonialById(id: string) {
  const testimonial = await TestimonialModel.findById(id);
  if (!testimonial) throw ApiError.notFound("Testimonial not found");
  return testimonial;
}

export async function createTestimonial(input: Record<string, unknown>) {
  return TestimonialModel.create(input);
}

export async function updateTestimonial(id: string, input: Record<string, unknown>) {
  const testimonial = await getTestimonialById(id);
  Object.assign(testimonial, input);
  await testimonial.save();
  return testimonial;
}

export async function deleteTestimonial(id: string) {
  const testimonial = await getTestimonialById(id);
  await testimonial.deleteOne();
}
