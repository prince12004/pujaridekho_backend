import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import type { Response } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");

const BRAND_ORANGE = "#E65A1E";
const BRAND_PURPLE = "#2D1B4E";
const TEXT_MUTED = "#6B6156";
const BORDER = "#E3D9C8";
const ROW_TINT = "#FBF6EE";

export interface InvoiceLineItem {
  name: string;
  quantity?: number;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  type: "booking" | "order" | "consultation";
  date: string | Date;
  customerSnapshot?: { name?: string | null; mobile?: string | null; email?: string | null } | null;
  bookingId?: string | null;
  orderId?: string | null;
  status?: string | null;
  serviceName?: string | null;
  poojaDate?: string | Date | null;
  poojaTime?: string | null;
  venue?: string | null;
  shippingAddress?: { name: string; phone: string; address: string; city: string; pincode: string } | null;
  pandit?: { fullName?: string; mobile?: string } | null;
  muhurat?: { startTime: string; endTime: string } | null;
  lineItems: InvoiceLineItem[];
  discount: number;
  paidAmount: number;
  balanceDue: number;
  total: number;
  paymentStatus: string;
}

function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatAmount(value: number): string {
  // Helvetica (a core PDF font with no embeddable glyph table available in
  // this environment) can't render the ₹ glyph, so "Rs" is used instead —
  // a common, unambiguous convention on Indian invoices for the same reason.
  return `Rs ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function streamInvoicePdf(res: Response, invoice: InvoicePdfData) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;

  // Header: logo + company info on the left, "INVOICE" title on the right.
  try {
    doc.image(LOGO_PATH, left, 40, { height: 44 });
  } catch {
    // Logo file missing in this environment — proceed without it rather than failing the download.
  }
  doc.fillColor(BRAND_PURPLE).font("Helvetica-Bold").fontSize(26).text("INVOICE", left, 44, { width: pageWidth, align: "right" });

  doc
    .fillColor(TEXT_MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text("O-708, Gaur City Centre, Greater Noida, Uttar Pradesh", left, 92)
    .text("+91 9211241314  |  support@pujaridekho.com  |  www.pujaridekho.com", left, 105);

  doc.moveTo(left, 128).lineTo(left + pageWidth, 128).lineWidth(1.5).strokeColor(BRAND_ORANGE).stroke();

  // Bill To (left) + invoice meta (right).
  const billToTop = 145;
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(9).text("BILL TO", left, billToTop);
  doc
    .fillColor(BRAND_PURPLE)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(invoice.customerSnapshot?.name ?? "Customer", left, billToTop + 16);

  const billLines: string[] = [];
  if (invoice.venue) billLines.push(invoice.venue);
  else if (invoice.shippingAddress) {
    billLines.push(invoice.shippingAddress.address);
    billLines.push(`${invoice.shippingAddress.city} — ${invoice.shippingAddress.pincode}`);
  }
  if (invoice.customerSnapshot?.mobile) billLines.push(`Mobile: ${invoice.customerSnapshot.mobile}`);

  doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(9.5);
  let billY = billToTop + 34;
  for (const line of billLines) {
    doc.text(line, left, billY, { width: pageWidth * 0.55 });
    billY += 14;
  }

  const metaLabels = [
    ["Invoice No.", invoice.invoiceNumber],
    ["Invoice Date", formatDate(invoice.date)],
    [invoice.type === "booking" ? "Booking ID" : invoice.type === "order" ? "Order ID" : "Consultation ID", invoice.bookingId ?? invoice.orderId ?? invoice.invoiceNumber],
    ["Status", invoice.status ?? invoice.paymentStatus],
  ];
  const metaX = left + pageWidth * 0.55;
  const metaLabelWidth = pageWidth * 0.2;
  let metaY = billToTop;
  for (const [label, value] of metaLabels) {
    doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(9).text(label, metaX, metaY, { width: metaLabelWidth });
    doc
      .fillColor(label === "Status" ? BRAND_ORANGE : BRAND_PURPLE)
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(value, metaX + metaLabelWidth, metaY, { width: pageWidth * 0.25 });
    metaY += 18;
  }

  let cursorY = Math.max(billY, metaY) + 20;

  // Service / order details table.
  if (invoice.type === "booking") {
    cursorY = drawSectionTable(doc, left, cursorY, pageWidth, "POOJA DETAILS", ["Puja Type", "Date", "Time", "Venue"], [
      [invoice.serviceName ?? "Pooja", formatDate(invoice.poojaDate), invoice.poojaTime ?? "—", invoice.venue ?? "—"],
    ]);
  } else if (invoice.type === "order" && invoice.shippingAddress) {
    cursorY = drawSectionTable(doc, left, cursorY, pageWidth, "SHIPPING DETAILS", ["Name", "Phone", "Address", "Pincode"], [
      [invoice.shippingAddress.name, invoice.shippingAddress.phone, `${invoice.shippingAddress.address}, ${invoice.shippingAddress.city}`, invoice.shippingAddress.pincode],
    ]);
  } else if (invoice.type === "consultation") {
    cursorY = drawSectionTable(doc, left, cursorY, pageWidth, "CONSULTATION DETAILS", ["Service", "Date"], [
      ["Astrology Consultation", formatDate(invoice.date)],
    ]);
  }

  cursorY += 12;

  // Pandit + Muhurat details — only rendered when applicable to this booking/consultation.
  if (invoice.pandit?.fullName || invoice.muhurat) {
    doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(9).text("PANDIT & MUHURAT DETAILS", left, cursorY);
    cursorY += 16;
    const detailRows: [string, string][] = [];
    if (invoice.pandit?.fullName) detailRows.push(["Pandit", invoice.pandit.fullName]);
    if (invoice.pandit?.mobile) detailRows.push(["Pandit Contact", invoice.pandit.mobile]);
    if (invoice.muhurat) detailRows.push(["Muhurat Time", `${formatTime(invoice.muhurat.startTime)} - ${formatTime(invoice.muhurat.endTime)}`]);
    for (const [label, value] of detailRows) {
      doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(9).text(label, left, cursorY, { width: pageWidth * 0.3 });
      doc
        .fillColor(BRAND_PURPLE)
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .text(value, left + pageWidth * 0.3, cursorY, { width: pageWidth * 0.6 });
      cursorY += 16;
    }
    cursorY += 8;
  }

  // Payment summary table.
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(9).text("PAYMENT SUMMARY", left, cursorY);
  cursorY += 16;

  const colParticularsWidth = pageWidth * 0.75;
  const colAmountWidth = pageWidth * 0.25;

  doc.rect(left, cursorY, pageWidth, 22).fill(BRAND_ORANGE);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text("Particulars", left + 8, cursorY + 6, { width: colParticularsWidth - 8 })
    .text("Amount", left + colParticularsWidth, cursorY + 6, { width: colAmountWidth - 8, align: "right" });
  cursorY += 22;

  const summaryRows: [string, string][] = invoice.lineItems.map((item) => [
    item.quantity ? `${item.name} × ${item.quantity}` : item.name,
    formatAmount(item.amount),
  ]);
  if (invoice.discount > 0) summaryRows.push(["Discount", `- ${formatAmount(invoice.discount)}`]);
  if (invoice.paidAmount > 0) summaryRows.push(["Less: Advance/Amount Paid", `- ${formatAmount(invoice.paidAmount)}`]);

  summaryRows.forEach(([label, value], i) => {
    const rowY = cursorY;
    if (i % 2 === 1) doc.rect(left, rowY, pageWidth, 20).fill(ROW_TINT);
    doc
      .fillColor(BRAND_PURPLE)
      .font("Helvetica")
      .fontSize(9.5)
      .text(label, left + 8, rowY + 5, { width: colParticularsWidth - 8 })
      .text(value, left + colParticularsWidth, rowY + 5, { width: colAmountWidth - 8, align: "right" });
    cursorY += 20;
  });

  doc.moveTo(left, cursorY).lineTo(left + pageWidth, cursorY).strokeColor(BRAND_ORANGE).lineWidth(1).stroke();
  cursorY += 6;

  const totalLabel = invoice.balanceDue > 0 ? "Balance Payable" : "Total Paid";
  const totalValue = invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total;
  doc
    .fillColor(BRAND_PURPLE)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(totalLabel, left + 8, cursorY + 4, { width: colParticularsWidth - 8 });
  doc
    .fillColor(BRAND_ORANGE)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(formatAmount(totalValue), left + colParticularsWidth, cursorY + 3, { width: colAmountWidth - 8, align: "right" });
  cursorY += 34;

  // Terms & notes.
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(9).text("TERMS & NOTES", left, cursorY);
  cursorY += 16;
  const notes = [
    invoice.balanceDue > 0
      ? `The balance amount of ${formatAmount(invoice.balanceDue)} is payable directly on satisfactory completion of the service.`
      : "This service has been paid in full.",
    "This booking is confirmed on receipt of the advance amount shown above.",
    "For rescheduling, please inform us at least 24 hours in advance by calling +91 9211241314.",
  ];
  doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(9);
  for (const note of notes) {
    doc.text(`•  ${note}`, left, cursorY, { width: pageWidth });
    cursorY += doc.heightOfString(`•  ${note}`, { width: pageWidth }) + 4;
  }

  cursorY += 10;
  doc
    .fillColor(BRAND_PURPLE)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text("Thank you for choosing Pujari Dekho!", left, cursorY, { width: pageWidth, align: "center" });

  // Footer.
  const footerY = doc.page.height - doc.page.margins.bottom - 30;
  doc.moveTo(left, footerY).lineTo(left + pageWidth, footerY).strokeColor(BORDER).lineWidth(0.75).stroke();
  doc
    .fillColor(TEXT_MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text("Pujari Dekho — Verified Pandits, Trusted Rituals", left, footerY + 8, { width: pageWidth, align: "center" })
    .text("This is a computer-generated invoice and does not require a physical signature.", left, footerY + 20, {
      width: pageWidth,
      align: "center",
    });

  doc.end();
}

function drawSectionTable(
  doc: PDFKit.PDFDocument,
  left: number,
  startY: number,
  pageWidth: number,
  title: string,
  headers: string[],
  rows: string[][],
): number {
  let y = startY;
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(9).text(title, left, y);
  y += 16;

  const colWidth = pageWidth / headers.length;
  doc.rect(left, y, pageWidth, 22).fill(BRAND_ORANGE);
  headers.forEach((header, i) => {
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(header, left + i * colWidth + 8, y + 6, { width: colWidth - 12 });
  });
  y += 22;

  for (const row of rows) {
    const rowHeight = 34;
    doc.rect(left, y, pageWidth, rowHeight).fill(ROW_TINT);
    row.forEach((cell, i) => {
      doc
        .fillColor(BRAND_PURPLE)
        .font("Helvetica")
        .fontSize(9)
        .text(cell, left + i * colWidth + 8, y + 8, { width: colWidth - 12 });
    });
    y += rowHeight;
  }

  return y + 10;
}
