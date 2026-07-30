import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import type { Response } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");

const BRAND_ORANGE = "#E65A1E";
const BRAND_PURPLE = "#2D1B4E";
const TEXT_MUTED = "#6B6156";
const TEXT_DARK = "#2A2420";
const BORDER = "#D8CCB8";
const HEADER_TINT = "#FBF6EE";
const ROW_TINT = "#FCFAF5";

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

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${TENS[tens]}${ones ? ` ${ONES[ones]}` : ""}`;
}

function threeDigitsToWords(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return `${hundreds ? `${ONES[hundreds]} Hundred${rest ? " " : ""}` : ""}${rest ? twoDigitsToWords(rest) : ""}`;
}

// Indian numbering (lakh/crore) amount-in-words, e.g. 1,23,456.50 -> "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Fifty Paise Only".
function amountToWords(value: number): string {
  const rupees = Math.floor(Math.round(value * 100) / 100);
  const paise = Math.round((value - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  const rupeeWords = parts.length > 0 ? parts.join(" ") : "Zero";
  const paiseWords = paise > 0 ? ` and ${twoDigitsToWords(paise)} Paise` : "";
  return `${rupeeWords} Rupees${paiseWords} Only`;
}

interface Column {
  label: string;
  width: number;
  align?: "left" | "right" | "center";
}

export function streamInvoicePdf(res: Response, invoice: InvoicePdfData) {
  const doc = new PDFDocument({ size: "A4", margin: 36 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const right = left + pageWidth;

  // Outer border frame around the whole invoice — the boxed, gridded look
  // shared by Tally and e-commerce invoices (Flipkart/Amazon), as opposed to
  // the loosely-spaced text blocks a plain letter uses.
  const frameTop = 30;

  // ---- Header band: logo + company block (left), "TAX INVOICE" + meta (right) ----
  // The logo file already contains the "Pujari Dekho" wordmark + tagline, so
  // company text is placed below it (not beside it) to avoid overlapping —
  // the logo's wide aspect ratio (~4.5:1) would collide with adjacent text.
  let cursorY = frameTop + 4;
  try {
    doc.image(LOGO_PATH, left, cursorY, { height: 34 });
  } catch {
    // Logo file missing in this environment — proceed without it rather than failing the download.
  }
  doc
    .fillColor(TEXT_MUTED)
    .font("Helvetica")
    .fontSize(8.5)
    .text("O-708, Gaur City Centre, Greater Noida, Uttar Pradesh", left, cursorY + 40)
    .text("+91 9211241314  |  support@pujaridekho.com  |  www.pujaridekho.com", left, cursorY + 52);

  doc
    .fillColor(BRAND_PURPLE)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("TAX INVOICE", left, cursorY, { width: pageWidth, align: "right" });
  doc
    .fillColor(invoice.balanceDue > 0 ? BRAND_ORANGE : "#1E8E5A")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(invoice.balanceDue > 0 ? "UNPAID / PARTIALLY PAID" : "PAID", left, cursorY + 24, { width: pageWidth, align: "right" });

  cursorY += 74;
  doc.moveTo(left, cursorY).lineTo(right, cursorY).lineWidth(1.5).strokeColor(BRAND_ORANGE).stroke();
  cursorY += 1.5;

  // ---- Bill To / Invoice details boxed row ----
  const boxTop = cursorY;
  const billBoxWidth = pageWidth * 0.58;
  const metaBoxWidth = pageWidth - billBoxWidth;
  const boxHeight = 92;

  doc.rect(left, boxTop, billBoxWidth, boxHeight).lineWidth(0.75).strokeColor(BORDER).stroke();
  doc.rect(left + billBoxWidth, boxTop, metaBoxWidth, boxHeight).lineWidth(0.75).strokeColor(BORDER).stroke();

  doc.rect(left, boxTop, billBoxWidth, 16).fill(HEADER_TINT);
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(8).text("BILL TO", left + 8, boxTop + 4);
  doc.rect(left + billBoxWidth, boxTop, metaBoxWidth, 16).fill(HEADER_TINT);
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(8).text("INVOICE DETAILS", left + billBoxWidth + 8, boxTop + 4);

  let billY = boxTop + 22;
  doc
    .fillColor(TEXT_DARK)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(invoice.customerSnapshot?.name ?? "Customer", left + 8, billY, { width: billBoxWidth - 16 });
  billY += 15;

  const billLines: string[] = [];
  if (invoice.venue) billLines.push(invoice.venue);
  else if (invoice.shippingAddress) {
    billLines.push(invoice.shippingAddress.address);
    billLines.push(`${invoice.shippingAddress.city} — ${invoice.shippingAddress.pincode}`);
  }
  if (invoice.customerSnapshot?.mobile) billLines.push(`Mobile: ${invoice.customerSnapshot.mobile}`);
  if (invoice.customerSnapshot?.email) billLines.push(`Email: ${invoice.customerSnapshot.email}`);

  doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(9);
  for (const line of billLines) {
    doc.text(line, left + 8, billY, { width: billBoxWidth - 16 });
    billY += 13;
  }

  const metaRows: [string, string][] = [
    ["Invoice No.", invoice.invoiceNumber],
    ["Invoice Date", formatDate(invoice.date)],
    [invoice.type === "booking" ? "Booking ID" : invoice.type === "order" ? "Order ID" : "Consultation ID", invoice.bookingId ?? invoice.orderId ?? invoice.invoiceNumber],
    ["Status", invoice.status ?? invoice.paymentStatus],
  ];
  let metaY = boxTop + 22;
  const metaLabelX = left + billBoxWidth + 8;
  const metaLabelWidth = metaBoxWidth * 0.42;
  const metaValueX = metaLabelX + metaLabelWidth;
  const metaValueWidth = metaBoxWidth - metaLabelWidth - 16;
  for (const [label, value] of metaRows) {
    doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(8.5).text(label, metaLabelX, metaY, { width: metaLabelWidth });
    doc
      .fillColor(label === "Status" ? BRAND_ORANGE : TEXT_DARK)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(value, metaValueX, metaY, { width: metaValueWidth });
    metaY += 16;
  }

  cursorY = boxTop + boxHeight + 14;

  // ---- Service / order details table ----
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

  if (invoice.pandit?.fullName || invoice.muhurat) {
    const combinedHeaders = [
      ...(invoice.pandit?.fullName ? ["Pandit", "Pandit Contact"] : []),
      ...(invoice.muhurat ? ["Muhurat Time"] : []),
    ];
    const combinedRow = [
      ...(invoice.pandit?.fullName ? [invoice.pandit.fullName, invoice.pandit.mobile ?? "—"] : []),
      ...(invoice.muhurat ? [`${formatTime(invoice.muhurat.startTime)} - ${formatTime(invoice.muhurat.endTime)}`] : []),
    ];
    cursorY = drawSectionTable(doc, left, cursorY, pageWidth, "PANDIT & MUHURAT DETAILS", combinedHeaders, [combinedRow]);
  }

  // ---- Items table (Sr No / Particulars / Qty / Rate / Amount) ----
  cursorY += 4;
  const columns: Column[] = [
    { label: "#", width: pageWidth * 0.05, align: "center" },
    { label: "Particulars", width: pageWidth * 0.45 },
    { label: "Qty", width: pageWidth * 0.1, align: "center" },
    { label: "Rate", width: pageWidth * 0.18, align: "right" },
    { label: "Amount", width: pageWidth * 0.22, align: "right" },
  ];

  cursorY = drawTableHeader(doc, left, cursorY, columns);

  invoice.lineItems.forEach((item, i) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const rate = qty > 1 ? item.amount / qty : item.amount;
    cursorY = drawTableRow(
      doc,
      left,
      cursorY,
      columns,
      [String(i + 1), item.name, String(qty), formatAmount(rate), formatAmount(item.amount)],
      i % 2 === 1,
    );
  });

  if (invoice.lineItems.length === 0) {
    cursorY = drawTableRow(doc, left, cursorY, columns, ["", "No items", "", "", formatAmount(0)], false);
  }

  doc.rect(left, cursorY, pageWidth, 0).lineWidth(0.75).strokeColor(BORDER).stroke();

  // ---- Totals box (right-aligned, Tally-style summary) ----
  cursorY += 2;
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalsWidth = pageWidth * 0.42;
  const totalsX = right - totalsWidth;
  const totalsRows: [string, string, boolean?][] = [
    ["Subtotal", formatAmount(subtotal)],
    ...(invoice.discount > 0 ? ([["Discount", `- ${formatAmount(invoice.discount)}`]] as [string, string][]) : []),
    ["Total", formatAmount(invoice.total), true],
    ...(invoice.paidAmount > 0 ? ([["Amount Paid", `- ${formatAmount(invoice.paidAmount)}`]] as [string, string][]) : []),
    [invoice.balanceDue > 0 ? "Balance Payable" : "Balance", formatAmount(Math.max(invoice.balanceDue, 0)), true],
  ];

  for (const [label, value, emphasize] of totalsRows) {
    const rowH = emphasize ? 22 : 18;
    if (emphasize) doc.rect(totalsX, cursorY, totalsWidth, rowH).fill(HEADER_TINT);
    doc
      .fillColor(emphasize ? BRAND_PURPLE : TEXT_MUTED)
      .font(emphasize ? "Helvetica-Bold" : "Helvetica")
      .fontSize(emphasize ? 10.5 : 9.5)
      .text(label, totalsX + 8, cursorY + (emphasize ? 6 : 4), { width: totalsWidth * 0.5 });
    doc
      .fillColor(emphasize ? BRAND_ORANGE : TEXT_DARK)
      .font(emphasize ? "Helvetica-Bold" : "Helvetica")
      .fontSize(emphasize ? 10.5 : 9.5)
      .text(value, totalsX + totalsWidth * 0.5, cursorY + (emphasize ? 6 : 4), { width: totalsWidth * 0.5 - 8, align: "right" });
    cursorY += rowH;
  }
  doc.rect(totalsX, cursorY - totalsRows.reduce((h, [, , e]) => h + (e ? 22 : 18), 0), totalsWidth, totalsRows.reduce((h, [, , e]) => h + (e ? 22 : 18), 0)).lineWidth(0.75).strokeColor(BORDER).stroke();

  cursorY += 10;

  // ---- Amount in words ----
  const amountInWordsValue = invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total;
  const amountLabel = invoice.balanceDue > 0 ? "Balance Amount in Words: " : "Amount in Words: ";
  doc.fillColor(TEXT_MUTED).font("Helvetica-Bold").fontSize(8.5).text(amountLabel, left, cursorY, { continued: true });
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(8.5).text(amountToWords(amountInWordsValue), { width: pageWidth });
  cursorY += doc.heightOfString(amountToWords(amountInWordsValue), { width: pageWidth }) + 18;

  // ---- Terms & Notes ----
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(9).text("TERMS & NOTES", left, cursorY);
  cursorY += 15;
  const notes = [
    invoice.balanceDue > 0
      ? `The balance amount of ${formatAmount(invoice.balanceDue)} is payable directly on satisfactory completion of the service.`
      : "This service has been paid in full.",
    "This booking is confirmed on receipt of the advance amount shown above.",
    "For rescheduling, please inform us at least 24 hours in advance by calling +91 9211241314.",
  ];
  doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(8.5);
  for (const note of notes) {
    doc.text(`•  ${note}`, left, cursorY, { width: pageWidth });
    cursorY += doc.heightOfString(`•  ${note}`, { width: pageWidth }) + 3;
  }

  // ---- Signature block ----
  cursorY += 20;
  const sigWidth = pageWidth * 0.32;
  const sigX = right - sigWidth;
  doc.fillColor(BRAND_PURPLE).font("Helvetica-Bold").fontSize(9.5).text("For Pujari Dekho", sigX, cursorY, { width: sigWidth, align: "center" });
  doc.moveTo(sigX + 10, cursorY + 38).lineTo(sigX + sigWidth - 10, cursorY + 38).lineWidth(0.75).strokeColor(BORDER).stroke();
  doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(8).text("Authorized Signatory", sigX, cursorY + 42, { width: sigWidth, align: "center" });

  doc
    .fillColor(BRAND_PURPLE)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Thank you for choosing Pujari Dekho!", left, cursorY, { width: sigX - left - 10 });

  // ---- Footer ----
  const footerY = doc.page.height - doc.page.margins.bottom - 26;
  doc.moveTo(left, footerY).lineTo(right, footerY).strokeColor(BORDER).lineWidth(0.75).stroke();
  doc
    .fillColor(TEXT_MUTED)
    .font("Helvetica")
    .fontSize(7.5)
    .text("Pujari Dekho — Verified Pandits, Trusted Rituals", left, footerY + 7, { width: pageWidth, align: "center" })
    .text("This is a computer-generated invoice and does not require a physical signature.", left, footerY + 18, {
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
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(8.5).text(title, left, y);
  y += 14;

  const colWidth = pageWidth / headers.length;
  const headerHeight = 18;
  doc.rect(left, y, pageWidth, headerHeight).fill(HEADER_TINT);
  doc.rect(left, y, pageWidth, headerHeight).lineWidth(0.75).strokeColor(BORDER).stroke();
  headers.forEach((header, i) => {
    if (i > 0) doc.moveTo(left + i * colWidth, y).lineTo(left + i * colWidth, y + headerHeight).lineWidth(0.5).strokeColor(BORDER).stroke();
    doc
      .fillColor(BRAND_ORANGE)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(header, left + i * colWidth + 6, y + 5, { width: colWidth - 10 });
  });
  y += headerHeight;

  for (const row of rows) {
    const rowHeight = 30;
    doc.rect(left, y, pageWidth, rowHeight).lineWidth(0.75).strokeColor(BORDER).stroke();
    row.forEach((cell, i) => {
      if (i > 0) doc.moveTo(left + i * colWidth, y).lineTo(left + i * colWidth, y + rowHeight).lineWidth(0.5).strokeColor(BORDER).stroke();
      doc
        .fillColor(TEXT_DARK)
        .font("Helvetica")
        .fontSize(8.5)
        .text(cell, left + i * colWidth + 6, y + 8, { width: colWidth - 10 });
    });
    y += rowHeight;
  }

  return y + 12;
}

function drawTableHeader(doc: PDFKit.PDFDocument, left: number, y: number, columns: Column[]): number {
  const height = 20;
  doc.rect(left, y, columns.reduce((w, c) => w + c.width, 0), height).fill(BRAND_ORANGE);
  let x = left;
  for (const col of columns) {
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(col.label, x + 6, y + 6, { width: col.width - 12, align: col.align ?? "left" });
    x += col.width;
  }
  return y + height;
}

function drawTableRow(doc: PDFKit.PDFDocument, left: number, y: number, columns: Column[], values: string[], tinted: boolean): number {
  const height = 22;
  const totalWidth = columns.reduce((w, c) => w + c.width, 0);
  if (tinted) doc.rect(left, y, totalWidth, height).fill(ROW_TINT);
  doc.rect(left, y, totalWidth, height).lineWidth(0.5).strokeColor(BORDER).stroke();

  let x = left;
  columns.forEach((col, i) => {
    if (i > 0) doc.moveTo(x, y).lineTo(x, y + height).lineWidth(0.5).strokeColor(BORDER).stroke();
    doc
      .fillColor(TEXT_DARK)
      .font("Helvetica")
      .fontSize(9)
      .text(values[i] ?? "", x + 6, y + 6, { width: col.width - 12, align: col.align ?? "left" });
    x += col.width;
  });
  return y + height;
}
