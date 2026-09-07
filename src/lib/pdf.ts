// PDF generation utilities - client-side using jsPDF
'use client';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./types";

const BRAND = {
  name: "AUTOLOGIX",
  tagline: "Vehicle Logistics & Financial Management",
  email: "ops@autologix.io",
  phone: "+1 (555) 010-2020",
  address: "1200 Harbor Blvd, Long Beach, CA 90802",
};

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(BRAND.name, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 190);
  doc.text(BRAND.tagline, 14, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 14, {
    align: "right",
  });
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 210);
    doc.text(subtitle, doc.internal.pageSize.getWidth() - 14, 22, {
      align: "right",
    });
  }
  doc.setTextColor(15, 23, 42);
}

function footer(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${BRAND.name}  •  ${BRAND.address}  •  ${BRAND.email}  •  ${BRAND.phone}`,
    14,
    pageHeight - 12
  );
  doc.text(
    `Generated ${new Date().toLocaleString()}`,
    pageWidth - 14,
    pageHeight - 12,
    { align: "right" }
  );
}

export interface InvoicePdfData {
  invoice: any;
  customer: any;
  vehicle?: any;
  items: any[];
  expenses?: any[];
}

export function generateInvoicePdf(data: InvoicePdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { invoice, customer, vehicle, items } = data;

  header(doc, "INVOICE", invoice.invoiceNumber);

  let y = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bill To:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 5;
  doc.text(customer?.name || "—", 14, y);
  if (customer?.companyName) {
    y += 5;
    doc.text(customer.companyName, 14, y);
  }
  if (customer?.address) {
    y += 5;
    doc.text(customer.address, 14, y);
  }
  if (customer?.phone) {
    y += 5;
    doc.text(`Phone: ${customer.phone}`, 14, y);
  }
  if (customer?.email) {
    y += 5;
    doc.text(`Email: ${customer.email}`, 14, y);
  }

  // Invoice meta (right column)
  let y2 = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Invoice #:", 130, y2);
  doc.text("Issue Date:", 130, y2 + 5);
  doc.text("Due Date:", 130, y2 + 10);
  doc.text("Status:", 130, y2 + 15);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, 196, y2, { align: "right" });
  doc.text(formatDate(invoice.issueDate), 196, y2 + 5, { align: "right" });
  doc.text(formatDate(invoice.dueDate), 196, y2 + 10, { align: "right" });
  doc.text(String(invoice.status || "DRAFT"), 196, y2 + 15, {
    align: "right",
  });

  if (vehicle) {
    y2 += 25;
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle:", 130, y2);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      196,
      y2,
      { align: "right" }
    );
    doc.text(`VIN: ${vehicle.vin}`, 196, y2 + 5, { align: "right" });
    doc.text(`Destination: ${vehicle.destination}`, 196, y2 + 10, {
      align: "right",
    });
  }

  // Items table
  y = Math.max(y, y2 + 20) + 5;
  autoTable(doc, {
    startY: y,
    head: [["#", "Description", "Qty", "Unit Price", "Total"]],
    body: items.map((it, i) => [
      i + 1,
      it.description,
      String(it.quantity),
      formatCurrency(it.unitPrice),
      formatCurrency(it.total),
    ]),
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  // Totals
  // @ts-ignore - lastAutoTable is added by the plugin
  let endY = (doc as any).lastAutoTable?.finalY || y;
  endY += 8;
  const xR = 130;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", xR, endY);
  doc.text(formatCurrency(invoice.subtotal), 196, endY, { align: "right" });
  endY += 5;
  doc.text("Tax:", xR, endY);
  doc.text(formatCurrency(invoice.tax), 196, endY, { align: "right" });
  endY += 6;
  doc.setDrawColor(15, 23, 42);
  doc.line(xR, endY, 196, endY);
  endY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL DUE:", xR, endY);
  doc.text(formatCurrency(invoice.total), 196, endY, { align: "right" });

  // Payment info
  endY += 12;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, endY, 110, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Payment Instructions", 18, endY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 90, 105);
  doc.text("Bank: First National Logistics Bank", 18, endY + 10);
  doc.text("Account: 0044-5566-7788", 18, endY + 14);
  doc.text("Routing: 021000021  •  SWIFT: FNLBUS33", 18, endY + 18);

  footer(doc);

  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

export function generateVehicleStatementPdf(vehicle: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "VEHICLE STATEMENT", vehicle.vin);

  let y = 42;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Vehicle Details", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 6;
  const lines = [
    `VIN: ${vehicle.vin}`,
    `Make/Model: ${vehicle.make} ${vehicle.model} (${vehicle.year})`,
    `Destination: ${vehicle.destination}`,
    `Status: ${vehicle.status}`,
    `Customer: ${vehicle.customer?.name || "—"}`,
  ];
  lines.forEach((l) => {
    doc.text(l, 14, y);
    y += 5;
  });

  // Summary box
  y += 5;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Total Charges", 20, y + 7);
  doc.text("Total Costs", 70, y + 7);
  doc.text("Net Profit", 120, y + 7);
  doc.text("Margin %", 170, y + 7);
  doc.setFontSize(12);
  doc.text(formatCurrency(vehicle.totalCharge), 20, y + 14);
  doc.text(formatCurrency(vehicle.totalCost), 70, y + 14);
  doc.text(formatCurrency(vehicle.profit), 120, y + 14);
  doc.text(`${vehicle.margin?.toFixed(1) || 0}%`, 170, y + 14);
  doc.setTextColor(15, 23, 42);
  y += 26;

  // Expenses table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Expenses Breakdown", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Title", "Customer Charge", "Company Cost", "Profit"]],
    body: (vehicle.expenses || []).map((e: any) => [
      formatDate(e.createdAt),
      e.title,
      formatCurrency(e.customerCharge),
      formatCurrency(e.companyCost),
      formatCurrency(e.profit),
    ]),
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable?.finalY || y;
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Payments Received", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Method", "Reference", "Amount"]],
    body: (vehicle.payments || []).map((p: any) => [
      formatDate(p.createdAt),
      p.method,
      p.referenceNo || "—",
      formatCurrency(p.amount),
    ]),
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: { 3: { halign: "right" } },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable?.finalY || y;
  y += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Payments Received:", 18, y + 7);
  doc.text(formatCurrency(vehicle.paymentsReceived), 192, y + 7, {
    align: "right",
  });

  footer(doc);
  doc.save(`Vehicle-Statement-${vehicle.vin}.pdf`);
}

export function generateLedgerStatementPdf(ledger: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(
    doc,
    "LEDGER STATEMENT",
    `${ledger.type === "CUSTOMER" ? "Customer" : "Company"} Ledger`
  );

  let y = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Account Information", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 6;
  doc.text(`Ledger Name: ${ledger.name}`, 14, y);
  y += 5;
  if (ledger.customer) {
    doc.text(`Customer: ${ledger.customer.name}`, 14, y);
    y += 5;
    if (ledger.customer.companyName) {
      doc.text(`Company: ${ledger.customer.companyName}`, 14, y);
      y += 5;
    }
  }
  y += 3;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Current Balance:", 20, y + 9);
  doc.text(formatCurrency(ledger.balance), 192, y + 9, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Transaction History", 14, y);
  y += 3;

  // Build running balance
  let running = 0;
  const txsReversed = [...(ledger.transactions || [])].reverse();
  const txsWithBalance = txsReversed.map((t) => {
    running = t.type === "DEBIT" ? running + t.amount : running - t.amount;
    return { ...t, runningBalance: running };
  });
  // Display newest first
  txsWithBalance.reverse();

  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Type", "Amount", "Balance"]],
    body: txsWithBalance.map((t) => [
      formatDate(t.createdAt),
      t.description,
      t.type,
      `${t.type === "DEBIT" ? "+" : "-"}${formatCurrency(t.amount)}`,
      formatCurrency(t.runningBalance),
    ]),
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  footer(doc);
  doc.save(`Ledger-Statement-${ledger.name.replace(/\s+/g, "_")}.pdf`);
}

export function generateReportPdf(opts: {
  title: string;
  subtitle?: string;
  head: string[];
  body: (string | number)[][];
  summary?: { label: string; value: string }[];
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, opts.title, opts.subtitle);

  let y = 42;
  if (opts.summary && opts.summary.length) {
    const cardWidth = 182 / Math.min(opts.summary.length, 4);
    doc.setFontSize(9);
    opts.summary.slice(0, 4).forEach((s, i) => {
      const x = 14 + i * cardWidth;
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, cardWidth - 2, 18, "F");
      doc.setTextColor(120, 130, 145);
      doc.setFont("helvetica", "normal");
      doc.text(s.label, x + 3, y + 6);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(s.value, x + 3, y + 14);
    });
    doc.setTextColor(15, 23, 42);
    y += 24;
  }

  autoTable(doc, {
    startY: y,
    head: [opts.head],
    body: opts.body as any,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  footer(doc);
  doc.save(`${opts.title.replace(/\s+/g, "_")}.pdf`);
}
