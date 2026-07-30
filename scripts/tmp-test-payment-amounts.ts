import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { PoojaModel } from "../src/models/pooja.model.js";
import { BookingModel } from "../src/models/booking.model.js";
import { ConsultationModel } from "../src/models/consultation.model.js";
import { CustomerModel } from "../src/models/customer.model.js";

async function main() {
  await mongoose.connect(env.MONGODB_URI);

  const pooja = await PoojaModel.findOne({ status: "Published" });
  if (!pooja) throw new Error("No Published pooja found to test with");

  const bookingRes = await fetch("http://localhost:4000/api/v1/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { name: "Temp Amount Test", mobile: "9999900003" },
      poojaSlug: pooja.slug,
      city: "Noida",
      address: "1 Test Road",
      poojaDate: new Date().toISOString(),
    }),
  });
  const bookingJson = await bookingRes.json();
  const bookingId = bookingJson.data._id;
  const finalAmount = bookingJson.data.pricing.finalAmount;
  console.log("Booking created, finalAmount =", finalAmount);

  async function tryInitiate(amount: number) {
    const res = await fetch("http://localhost:4000/api/v1/payments/payu/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: "booking", entityId: bookingId, amount, name: "Temp", email: "t@example.com", phone: "9999900003" }),
    });
    console.log(`amount=${amount} -> status ${res.status}`);
    return res.status;
  }

  const s1 = await tryInitiate(99);
  const s2 = await tryInitiate(finalAmount);
  const s3 = await tryInitiate(1);

  console.log("Expected: 200, 200, 400 ->", s1, s2, s3);

  await BookingModel.deleteOne({ _id: bookingId });
  await CustomerModel.deleteOne({ _id: bookingJson.data.customer });

  // Consultation amount test
  const consultRes = await fetch("http://localhost:4000/api/v1/consultations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Temp Consult", mobile: "9999900004" }),
  });
  const consultJson = await consultRes.json();
  const consultId = consultJson.data._id;
  const cs1 = await fetch("http://localhost:4000/api/v1/payments/payu/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType: "consultation", entityId: consultId, amount: 99, name: "Temp", email: "t@example.com", phone: "9999900004" }),
  });
  const cs2 = await fetch("http://localhost:4000/api/v1/payments/payu/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType: "consultation", entityId: consultId, amount: 500, name: "Temp", email: "t@example.com", phone: "9999900004" }),
  });
  const cs3 = await fetch("http://localhost:4000/api/v1/payments/payu/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType: "consultation", entityId: consultId, amount: 250, name: "Temp", email: "t@example.com", phone: "9999900004" }),
  });
  console.log("Consultation: 99->", cs1.status, "500->", cs2.status, "250(invalid)->", cs3.status);

  await ConsultationModel.deleteOne({ _id: consultId });
  console.log("Cleaned up.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
