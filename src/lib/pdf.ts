// PDF generation utilities - client-side using jsPDF
'use client';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./types";

// === Shared brand constants for non-invoice PDFs (statements / reports) ===
const BRAND = {
  name: "JACXI",
  tagline: "Shipping",
  email: "ops@jacxi.com",
  phone: "+1 (555) 010-2020",
  address: "Premium Vehicle Logistics • USA → Afghanistan",
};

// === JACXI Shipping invoice brand (matches reference design exactly) ===
const JACXI = {
  brand: "JACXI",
  subbrand: "SHIPPING",
  // Metallic gold #D4AF37 — primary accent
  gold: [212, 175, 55] as [number, number, number],
  // Status orange #F5A623 — PENDING badge
  orange: [245, 166, 35] as [number, number, number],
  // Pure black for brand name and amounts
  black: [0, 0, 0] as [number, number, number],
  // Dark grey #333 for body text
  darkGrey: [51, 51, 51] as [number, number, number],
  // Medium grey #666 for secondary text
  medGrey: [102, 102, 102] as [number, number, number],
  // Light grey #777 for table headers
  headerGrey: [119, 119, 119] as [number, number, number],
  // Divider grey #EEE
  divider: [238, 238, 238] as [number, number, number],
  // Row border grey #F0
  rowBorder: [240, 240, 240] as [number, number, number],
  // Table header background #FAFAFA
  headerBg: [250, 250, 250] as [number, number, number],
  // Alt row #FCFCFC
  altRow: [252, 252, 252] as [number, number, number],
  // Footer dim text #999
  footerDim: [153, 153, 153] as [number, number, number],
  // Lighter footer italic #888
  footerItalic: [136, 136, 136] as [number, number, number],
};

// Helper: infer line-item type from description (matches reference categories)
function inferLineItemType(description: string): string {
  const d = (description || "").toLowerCase();
  if (d.includes("shipping")) return "SHIPPING";
  if (d.includes("storage")) return "STORAGE";
  if (d.includes("purchase") || d.includes("price")) return "PURCHASE PRICE";
  if (d.includes("custom") || d.includes("duty")) return "CUSTOMS";
  if (d.includes("freight")) return "FREIGHT";
  if (d.includes("insurance")) return "INSURANCE";
  return "SHIPPING TYPE";
  }

// Helper: map invoice status to badge color (matches PENDING=orange reference)
function statusBadgeColor(status: string): [number, number, number] {
  const s = (status || "").toUpperCase();
  if (s === "PENDING" || s === "DRAFT") return JACXI.orange;
  if (s === "PAID" || s === "DELIVERED") return [16, 185, 129]; // emerald
  if (s === "OVERDUE") return [239, 68, 68]; // red
  if (s === "PARTIALLY_PAID" || s === "PARTIALLY PAID") return [59, 130, 246]; // blue
  if (s === "ISSUED") return [99, 102, 241]; // indigo
  return JACXI.orange;
}

// Helper: format date as "Month DD, YYYY" (matches reference: "May 2, 2026")
function formatDateLong(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(...JACXI.gold);
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
  doc.setDrawColor(...JACXI.divider);
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

// =============================================================================
// === INVOICE PDF — JACXI Shipping reference design (gold + black + orange) ===
// =============================================================================

export interface InvoicePdfData {
  invoice: any;
  customer: any;
  vehicle?: any;
  items: any[];
  expenses?: any[];
  logoUrl?: string;
}

async function loadImageData(url: string): Promise<{ data: string; format: "PNG" | "JPEG"; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.type === "image/svg+xml") {
      const objectUrl = URL.createObjectURL(blob);
      try {
        const image = await new Promise<HTMLImageElement | null>((resolve) => {
          const element = new Image();
          element.onload = () => resolve(element);
          element.onerror = () => resolve(null);
          element.src = objectUrl;
        });
        if (!image) return null;
        const width = image.naturalWidth || 400;
        const height = image.naturalHeight || 200;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(image, 0, 0);
        return { data: canvas.toDataURL("image/png"), format: "PNG", width, height };
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== "string") {
          resolve(null);
          return;
        }
        const image = new Image();
        image.onload = () => resolve({
          data: reader.result as string,
          format: blob.type === "image/jpeg" || blob.type === "image/jpg" ? "JPEG" : "PNG",
          width: image.naturalWidth || 400,
          height: image.naturalHeight || 200,
        });
        image.onerror = () => resolve(null);
        image.src = reader.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(data: InvoicePdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const marginX = 14; // ~40px @ 72dpi equivalent
  const contentWidth = pageWidth - marginX * 2; // 182

  const { invoice, customer, vehicle, items } = data;
  const settings = await fetch("/api/settings")
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  const currency = settings?.currency || "USD";
  const money = (value: number | null | undefined) => formatCurrency(value, currency);
  const logoCandidates = [
    data.logoUrl,
    settings?.logoUrl,
    "/api/settings/logo",
    "/logo.svg",
  ].filter((url): url is string => Boolean(url));
  let logoData: Awaited<ReturnType<typeof loadImageData>> = null;
  for (const logoUrl of logoCandidates) {
    logoData = await loadImageData(logoUrl);
    if (logoData) break;
  }

  // -------------------------------------------------------------------------
  // 1. TOP GOLD BAR (full width, ~10mm tall)
  // -------------------------------------------------------------------------
  doc.setFillColor(...JACXI.gold);
  doc.rect(0, 0, pageWidth, 10, "F");

  // -------------------------------------------------------------------------
  // 2. BRAND (left) — configured logo with a text fallback
  // -------------------------------------------------------------------------
  let y = 26;
  if (logoData) {
    try {
      const maxLogoWidth = 32;
      const maxLogoHeight = 18;
      const scale = Math.min(maxLogoWidth / logoData.width, maxLogoHeight / logoData.height);
      const logoWidth = logoData.width * scale;
      const logoHeight = logoData.height * scale;
      doc.addImage(
        logoData.data,
        logoData.format,
        marginX,
        13 + (maxLogoHeight - logoHeight) / 2,
        logoWidth,
        logoHeight,
        undefined,
        "FAST"
      );
    } catch {
      // Fall back to the text wordmark if the configured image format is unsupported.
    }
  }
  const brandX = logoData ? marginX + 37 : marginX;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...JACXI.black);
  doc.text(JACXI.brand, brandX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...JACXI.medGrey);
  doc.text(JACXI.subbrand, brandX, y + 6);

  // -------------------------------------------------------------------------
  // 3. INVOICE LABEL (right) — gold, large, bold
  // -------------------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...JACXI.gold);
  doc.text("INVOICE", pageWidth - marginX, y, { align: "right" });

  // Invoice number below INVOICE label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...JACXI.medGrey);
  doc.text(invoice.invoiceNumber, pageWidth - marginX, y + 6, {
    align: "right",
  });

  // -------------------------------------------------------------------------
  // 4. STATUS BADGE (right-aligned, below invoice number)
  //    Pill shape with orange background + white uppercase text
  // -------------------------------------------------------------------------
  const statusText = (invoice.status || "PENDING").toUpperCase().replace(/_/g, " ");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const badgeTextWidth = doc.getTextWidth(statusText);
  const badgePadX = 4;
  const badgePadY = 1.8;
  const badgeW = badgeTextWidth + badgePadX * 2;
  const badgeH = 6 + badgePadY * 2;
  const badgeX = pageWidth - marginX - badgeW;
  const badgeY = y + 9;

  // Draw rounded pill (using rounded rectangle)
  doc.setFillColor(...statusBadgeColor(invoice.status));
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2, badgeH / 2, "F");

  // White uppercase status text centered in pill
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1, {
    align: "center",
  });

  // -------------------------------------------------------------------------
  // 5. DIVIDER LINE under header (full content width)
  // -------------------------------------------------------------------------
  y = 50;
  doc.setDrawColor(...JACXI.divider);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 10;

  // -------------------------------------------------------------------------
  // 6. BILL TO (left) + INVOICE DETAILS (right) — two-column section
  // -------------------------------------------------------------------------
  const colLeftX = marginX;
  const colRightX = pageWidth / 2 + 5;
  const colRightW = pageWidth - marginX - colRightX;

  // --- BILL TO (left column) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...JACXI.black);
  doc.text("BILL TO", colLeftX, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...JACXI.darkGrey);
  doc.text(customer?.name || "—", colLeftX, y);

  if (customer?.companyName) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...JACXI.medGrey);
    doc.text(customer.companyName, colLeftX, y);
  }

  if (customer?.email) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...JACXI.medGrey);
    doc.text(customer.email, colLeftX, y);
  }

  if (customer?.phone) {
    y += 5;
    doc.text(customer.phone, colLeftX, y);
  }

  if (customer?.address) {
    y += 5;
    // split long addresses into wrapped lines
    const addrLines = doc.splitTextToSize(customer.address, 80) as string[];
    addrLines.forEach((line) => {
      doc.text(line, colLeftX, y);
      y += 5;
    });
  }

  // --- INVOICE DETAILS (right column) ---
  // Reset y for right column to align with BILL TO header
  let yR = 50 + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...JACXI.black);
  doc.text("INVOICE DETAILS", colRightX, yR);

  // helper: key-value row (key left grey, value right black, bolder for vehicle/vin)
  const detailRow = (
    label: string,
    value: string,
    bold: boolean = false
  ) => {
    yR += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...JACXI.medGrey);
    doc.text(label, colRightX, yR);

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...JACXI.darkGrey);
    doc.text(value, pageWidth - marginX, yR, { align: "right" });
  };

  detailRow("Invoice Date", formatDateLong(invoice.issueDate));
  detailRow("Due Date", formatDateLong(invoice.dueDate));

  if (vehicle) {
    const vehicleStr = `${vehicle.year || ""} ${(vehicle.make || "").toUpperCase()} ${vehicle.model || ""}`.trim();
    detailRow("Vehicle", vehicleStr || "—", true);
    detailRow("VIN", vehicle.vin || "—", true);
    // color field — not in our schema, omit (reference shows vehicle color)
  }

  // -------------------------------------------------------------------------
  // 7. LINE ITEMS TABLE — gold top border, light grey header, white rows
  // -------------------------------------------------------------------------
  // Position table below the taller of the two columns
  const tableY = Math.max(y, yR) + 14;

  // Thick gold rule above the table
  doc.setDrawColor(...JACXI.gold);
  doc.setLineWidth(1.2);
  doc.line(marginX, tableY, pageWidth - marginX, tableY);

  // Build rows
  const expenseItems = (data.expenses || []).map((expense: any) => {
    const vin = expense.vehicle?.vin || "—";
    const note = expense.notes?.trim() || expense.title || "Expense";
    return {
      description: `${vin} — ${note}`,
      quantity: 1,
      unitPrice: expense.customerCharge,
      total: expense.customerCharge,
    };
  });
  const allItems = [...(items || []), ...expenseItems];
  const tableItems = (allItems.length > 0)
    ? allItems
    : [
        {
          description: "SHIPPING FEE",
          quantity: 1,
          unitPrice: invoice.subtotal || 0,
          total: invoice.subtotal || 0,
        },
      ];

  // Use autoTable for the items grid
  autoTable(doc, {
    startY: tableY + 1,
    head: [["Description", "Type", "Qty", "Unit Price", "Amount"]],
    body: tableItems.map((it: any) => [
      String(it.description || "").toUpperCase(),
      inferLineItemType(it.description || ""),
      String(it.quantity || 1),
      money(it.unitPrice),
      money(it.total),
    ]),
    theme: "plain",
    margin: { left: marginX, right: marginX },
    headStyles: {
      fillColor: [...JACXI.headerBg],
      textColor: [...JACXI.headerGrey],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineColor: [...JACXI.rowBorder],
      lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [...JACXI.darkGrey],
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      lineColor: [...JACXI.rowBorder],
      lineWidth: { bottom: 0.2, top: 0, left: 0, right: 0 },
    },
    alternateRowStyles: {
      fillColor: [...JACXI.altRow],
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.36, fontStyle: "normal" },
      1: {
        cellWidth: contentWidth * 0.18,
        textColor: [...JACXI.medGrey],
        fontSize: 9,
      },
      2: { cellWidth: contentWidth * 0.10, halign: "center" },
      3: { cellWidth: contentWidth * 0.18, halign: "right" },
      4: {
        cellWidth: contentWidth * 0.18,
        halign: "right",
        fontStyle: "bold",
        textColor: [...JACXI.black],
      },
    },
  });

  // @ts-ignore - lastAutoTable is added by the plugin
  let endY: number = (doc as any).lastAutoTable?.finalY || tableY + 20;
  endY += 8;

  // -------------------------------------------------------------------------
  // 8. TOTALS SECTION — right aligned with Subtotal + bold gold TOTAL
  // -------------------------------------------------------------------------
  const totalsX = pageWidth - marginX - 70; // right column block width = 70mm
  const totalsLabelX = totalsX;
  const totalsValueX = pageWidth - marginX;

  // Subtotal row
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...JACXI.darkGrey);
  doc.text("Subtotal", totalsLabelX, endY);
  doc.setTextColor(...JACXI.black);
  doc.text(money(invoice.subtotal), totalsValueX, endY, {
    align: "right",
  });

  // Tax row (only if tax > 0)
  if (invoice.tax && Number(invoice.tax) > 0) {
    endY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...JACXI.medGrey);
    doc.text("Tax", totalsLabelX, endY);
    doc.setTextColor(...JACXI.darkGrey);
    doc.text(money(invoice.tax), totalsValueX, endY, {
      align: "right",
    });
  }

  // TOTAL row — gold value, larger, bolder
  endY += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...JACXI.black);
  doc.text("TOTAL", totalsLabelX, endY);
  doc.setTextColor(...JACXI.gold);
  doc.text(money(invoice.total), totalsValueX, endY, {
    align: "right",
  });

  // -------------------------------------------------------------------------
  // 9. FOOTER — gold rule, thank-you message, confidentiality, page number
  // -------------------------------------------------------------------------
  // Position footer with generous whitespace above (matches reference)
  const footerY = pageHeight - 30;

  // Thick gold rule above footer
  doc.setDrawColor(...JACXI.gold);
  doc.setLineWidth(1.0);
  doc.line(marginX, footerY, pageWidth - marginX, footerY);

  // "Thank you for your business with JACXI Shipping" — centered, grey
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...JACXI.medGrey);
  const thankYouText = `Thank you for your business with ${settings?.companyName || `${JACXI.brand} ${JACXI.subbrand}`}`;
  doc.text(thankYouText, pageWidth / 2, footerY + 6, { align: "center" });

  // Confidentiality notice — smaller, dimmer grey, italic-style (helvetica has no italic-bold)
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...JACXI.footerItalic);
  const confidentialText =
    "This invoice is confidential and intended solely for the addressee.";
  doc.text(confidentialText, pageWidth / 2, footerY + 11, {
    align: "center",
  });

  // Page number — far right of footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...JACXI.footerDim);
  doc.text("Page 1", pageWidth - marginX, footerY + 6, { align: "right" });

  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}

// =============================================================================
// === VEHICLE STATEMENT PDF (uses AUTOLOGIX branding, dark header) ===
// =============================================================================

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

// =============================================================================
// === LEDGER STATEMENT PDF (uses AUTOLOGIX branding, dark header) ===
// =============================================================================

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

export function generateCustomerStatementPdf(customer: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "CUSTOMER STATEMENT", customer.name);
  let y = 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...JACXI.black);
  doc.text(customer.name, 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...JACXI.medGrey);
  doc.text(customer.companyName || customer.email || "", 14, y);

  const invoices = (customer.invoices || []).filter((invoice: any) => invoice.status !== "DRAFT");
  const payments = customer.payments || [];
  const invoiced = invoices.reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0);
  const paid = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
  y += 14;
  autoTable(doc, {
    startY: y,
    head: [["Account Summary", "Amount"]],
    body: [["Invoiced", formatCurrency(invoiced)], ["Payments received", formatCurrency(paid)], ["Balance due", formatCurrency(invoiced - paid)]],
    theme: "grid",
    headStyles: { fillColor: JACXI.black, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: y,
    head: [["Date", "Type", "Reference", "Amount"]],
    body: [
      ...invoices.map((invoice: any) => [formatDate(invoice.issueDate), "Invoice", invoice.invoiceNumber, formatCurrency(invoice.total)]),
      ...payments.map((payment: any) => [formatDate(payment.createdAt), "Payment", payment.referenceNo || payment.method, `-${formatCurrency(payment.amount)}`]),
    ].sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    theme: "striped",
    headStyles: { fillColor: JACXI.gold, textColor: JACXI.black },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });
  footer(doc);
  doc.save(`Customer-Statement-${customer.name.replace(/\s+/g, "_")}.pdf`);
}

// =============================================================================
// === GENERIC REPORT PDF (uses AUTOLOGIX branding) ===
// =============================================================================

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
