import { ApiError } from "../../lib/api-error.js";
import { CustomerModel } from "../../models/customer.model.js";
import { BookingModel } from "../../models/booking.model.js";

const UPCOMING_STATUSES = [
  "pending_payment",
  "payment_received",
  "booking_confirmed",
  "pandit_assignment_pending",
  "pandit_assigned",
  "pandit_accepted",
  "pandit_on_the_way",
  "pooja_started",
];

export async function listMyAddresses(customerId: string) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");

  const upcomingAddressLines = new Set(
    (await BookingModel.find({ customer: customerId, status: { $in: UPCOMING_STATUSES } }).select("address")).map(
      (b) => b.address,
    ),
  );

  return customer.addresses.map((address) => ({
    ...address.toObject(),
    usedInUpcomingBooking: upcomingAddressLines.has(address.addressLine1),
  }));
}

export interface AddressInput {
  fullName: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state?: string;
  pincode: string;
  type?: "home" | "office" | "other";
  isDefault?: boolean;
}

export async function addMyAddress(customerId: string, input: AddressInput) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");

  if (input.isDefault) {
    customer.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }
  customer.addresses.push(input as never);
  await customer.save();
  return customer.addresses;
}

export async function updateMyAddress(customerId: string, addressId: string, input: Partial<AddressInput>) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");

  const address = customer.addresses.find((a) => a._id?.toString() === addressId);
  if (!address) throw ApiError.notFound("Address not found");

  if (input.isDefault) {
    customer.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }
  Object.assign(address, input);
  await customer.save();
  return customer.addresses;
}

// Booking.address is a denormalized snapshot string captured at booking time,
// not a live reference — deleting an Address subdocument here never mutates
// an existing booking. The frontend still warns the customer first (per the
// usedInUpcomingBooking flag from listMyAddresses) as a courtesy, not because
// data would break.
export async function deleteMyAddress(customerId: string, addressId: string) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw ApiError.notFound("Account not found");

  const existed = customer.addresses.some((a) => a._id?.toString() === addressId);
  if (!existed) throw ApiError.notFound("Address not found");

  customer.addresses = customer.addresses.filter((a) => a._id?.toString() !== addressId) as never;
  await customer.save();
  return customer.addresses;
}
