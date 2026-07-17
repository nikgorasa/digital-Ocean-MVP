import { jsPDF } from "jspdf";
import { formatCurrency } from "./utils";

interface InvoicePDFData {
  invoiceNumber: string;
  issuedAt: string;
  dueDate: string;
  status: string;
  companyName: string;
  companyAddress?: string;
  companyGstin?: string;
  bookingItem: string;
  bookingType: string;
  bookingPnr?: string;
  travelDates?: string;
  guestName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  paymentRef?: string;
  currency?: string;
}

export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  const doc = new jsPDF();
  const currency = data.currency || "INR";
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`#${data.invoiceNumber}`, 20, 32);
  doc.text(`Issued: ${data.issuedAt}`, 20, 38);
  doc.text(`Due: ${data.dueDate}`, 20, 44);

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    PENDING: [245, 158, 11],
    PAID: [16, 185, 129],
    OVERDUE: [239, 68, 68],
    CANCELLED: [107, 114, 128],
  };
  const statusColor = statusColors[data.status] || [107, 114, 128];
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 50, 20, 30, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(data.status, pageWidth - 35, 27, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Company (Bill To)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(data.companyName, 20, 66);
  if (data.companyAddress) doc.text(data.companyAddress, 20, 72);
  if (data.companyGstin) doc.text(`GSTIN: ${data.companyGstin}`, 20, 78);

  // Booking Details
  doc.setFont("helvetica", "bold");
  doc.text("Booking Details:", pageWidth - 80, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.bookingType}: ${data.bookingItem}`, pageWidth - 80, 66);
  if (data.bookingPnr) doc.text(`PNR: ${data.bookingPnr}`, pageWidth - 80, 72);
  if (data.travelDates) doc.text(`Travel: ${data.travelDates}`, pageWidth - 80, 78);
  doc.text(`Guest: ${data.guestName}`, pageWidth - 80, 84);

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 95, pageWidth - 20, 95);

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Description", 20, 105);
  doc.text("Amount", pageWidth - 50, 105, { align: "right" });

  // Table row
  doc.setFont("helvetica", "normal");
  doc.text(`${data.bookingType} Booking - ${data.bookingItem}`, 20, 115);
  doc.text(formatCurrency(data.amount, currency), pageWidth - 50, 115, { align: "right" });

  // Tax
  if (data.taxAmount > 0) {
    doc.text("Tax", 20, 125);
    doc.text(formatCurrency(data.taxAmount, currency), pageWidth - 50, 125, { align: "right" });
  }

  // Line separator
  const lineY = data.taxAmount > 0 ? 132 : 122;
  doc.line(20, lineY, pageWidth - 20, lineY);

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", 20, lineY + 10);
  doc.text(formatCurrency(data.totalAmount, currency), pageWidth - 50, lineY + 10, { align: "right" });

  // Payment info (if paid)
  if (data.paidAmount && data.status === "PAID") {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Paid: ${formatCurrency(data.paidAmount, currency)}`, 20, lineY + 22);
    if (data.paymentRef) doc.text(`Ref: ${data.paymentRef}`, 20, lineY + 28);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("This is a computer-generated invoice. No signature required.", pageWidth / 2, 280, { align: "center" });
  doc.text("GoRASA Travel Services", pageWidth / 2, 285, { align: "center" });

  return doc;
}

export function downloadInvoicePDF(data: InvoicePDFData, filename?: string): void {
  const doc = generateInvoicePDF(data);
  const name = filename || `invoice-${data.invoiceNumber}.pdf`;
  doc.save(name);
}
