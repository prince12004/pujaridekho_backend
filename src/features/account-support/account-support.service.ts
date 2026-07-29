import { ApiError } from "../../lib/api-error.js";
import { createNotification } from "../../lib/notify.js";
import { SupportTicketModel } from "../../models/support-ticket.model.js";
import { CustomerModel } from "../../models/customer.model.js";

async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;
  const count = await SupportTicketModel.countDocuments({ ticketNumber: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

export interface CreateTicketInput {
  category: string;
  relatedType?: "booking" | "order" | "consultation";
  relatedId?: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
}

export async function createMyTicket(customerId: string, input: CreateTicketInput) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");

  const ticketNumber = await generateTicketNumber();
  const ticket = await SupportTicketModel.create({
    ticketNumber,
    customer: customerId,
    category: input.category,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    subject: input.subject,
    attachmentUrl: input.attachmentUrl,
    messages: [{ sender: "customer", message: input.message, attachmentUrl: input.attachmentUrl, createdAt: new Date() }],
  });

  await createNotification({
    type: "support",
    title: "New support ticket",
    message: `${customer.name} opened ticket ${ticketNumber}: "${input.subject}"`,
    link: `/admin/support`,
  });

  return ticket;
}

export async function listMyTickets(customerId: string) {
  return SupportTicketModel.find({ customer: customerId }).sort({ createdAt: -1 });
}

export async function getMyTicketById(customerId: string, id: string) {
  const ticket = await SupportTicketModel.findById(id);
  if (!ticket) throw ApiError.notFound("Ticket not found");
  if (ticket.customer.toString() !== customerId) throw ApiError.forbidden("You do not have access to this ticket");
  return ticket;
}

export async function addMyTicketMessage(customerId: string, id: string, message: string, attachmentUrl?: string) {
  const ticket = await getMyTicketById(customerId, id);
  ticket.messages.push({ sender: "customer", message, attachmentUrl, createdAt: new Date() } as never);
  if (ticket.status === "resolved" || ticket.status === "closed") ticket.status = "open";
  else if (ticket.status === "waiting_for_customer") ticket.status = "in_progress";
  await ticket.save();
  return ticket;
}
