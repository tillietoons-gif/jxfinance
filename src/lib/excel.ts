// Excel export utilities - client-side using ExcelJS
'use client';

import ExcelJS from "exceljs";

const HEADER_FILL: Partial<ExcelJS.Fill> = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0F172A" }, // slate-900
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

function styleHeaderRow(sheet: ExcelJS.Worksheet, colCount: number) {
  const row = sheet.getRow(1);
  row.eachCell((cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF0F172A" } },
      };
    }
  });
  row.height = 22;
}

function autoWidth(sheet: ExcelJS.Worksheet) {
  sheet.columns!.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 3, 60);
  });
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, any>[];
  totals?: { label: string; value: string }[];
}

export async function exportToExcel(opts: ExportOptions) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AutoLogix";
  wb.created = new Date();
  const sheet = wb.addWorksheet(opts.sheetName || "Sheet1", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Optional title block
  let startRow = 1;
  if (opts.title) {
    sheet.mergeCells("A1:Z1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = opts.title;
    titleCell.font = { bold: true, size: 16, color: { argb: "FF0F172A" } };
    titleCell.alignment = { vertical: "middle" };
    sheet.getRow(1).height = 24;
    startRow = 2;
  }
  if (opts.subtitle) {
    sheet.mergeCells(`A${startRow}:Z${startRow}`);
    const c = sheet.getCell(`A${startRow}`);
    c.value = opts.subtitle;
    c.font = { italic: true, size: 10, color: { argb: "FF64748B" } };
    startRow++;
  }
  if (opts.title || opts.subtitle) startRow++;

  // Headers
  sheet.columns = opts.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width || 18,
  }));

  // Move header to startRow by clearing row 1 first if title was set
  if (startRow > 1) {
    sheet.spliceRows(1, startRow - 1);
    // Re-set headers at row 1
    const headerRow = sheet.getRow(1);
    opts.columns.forEach((col, i) => {
      headerRow.getCell(i + 1).value = col.header;
    });
    headerRow.commit();
  }

  // Add rows
  opts.rows.forEach((r) => {
    const row = sheet.addRow(r);
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = { vertical: "middle" };
    });
  });

  // Header style (always row 1 now)
  const headerRow = sheet.getRow(1);
  opts.columns.forEach((_, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
  headerRow.height = 22;

  // Totals rows
  if (opts.totals && opts.totals.length) {
    opts.totals.forEach((t, idx) => {
      const r = sheet.addRow({});
      sheet.mergeCells(
        `A${r.number}:${String.fromCharCode(64 + opts.columns.length - 1)}${r.number}`
      );
      const cell = sheet.getCell(`A${r.number}`);
      cell.value = `${t.label}:  ${t.value}`;
      cell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      r.height = 22;
    });
  }

  autoWidth(sheet);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
