export interface CrmBookingPayload {
  id: string;
  clientName: string;
  phone: string;
  pujaName: string;
  pujaDate: string;
  pujaTime?: string;
  totalAmount: number;
  address?: string;
  createdAt: string;
}

interface BookingLike {
  bookingId: string;
  customerSnapshot?: { name?: string | null; mobile?: string | null } | null;
  pooja?: { name?: string } | null;
  festival?: { name?: string } | null;
  serviceType: string;
  poojaDate: Date;
  poojaTime?: string | null;
  pricing?: { finalAmount?: number | null } | null;
  address?: string | null;
  createdAt: Date;
}

// Shape returned by GET /crm/bookings — the CRM polls this for confirmed
// bookings rather than receiving a webhook push.
export function toCrmBookingPayload(booking: BookingLike): CrmBookingPayload {
  return {
    id: booking.bookingId,
    clientName: booking.customerSnapshot?.name ?? "",
    phone: booking.customerSnapshot?.mobile ?? "",
    pujaName: booking.pooja?.name ?? booking.festival?.name ?? booking.serviceType,
    pujaDate: new Date(booking.poojaDate).toISOString().slice(0, 10),
    pujaTime: booking.poojaTime ?? undefined,
    totalAmount: booking.pricing?.finalAmount ?? 0,
    address: booking.address ?? undefined,
    createdAt: new Date(booking.createdAt).toISOString(),
  };
}
