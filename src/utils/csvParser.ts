import Papa from "papaparse";
import { SaleRecord } from "../types";
import { isValidFilterOption, MONTHS_SHORT } from "./formatters";

export interface ParseResult {
  records: SaleRecord[];
  errors: string[];
  totalRows: number;
}

/**
 * Normalizes number fields from diverse formats (e.g., "  1,829.66 ", " - ", "-329.03", "₹1,200", etc.)
 */
function cleanNumber(val: unknown, defaultVal = 0): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "number") return isNaN(val) ? defaultVal : val;
  const str = String(val).trim().replace(/[₹$,]/g, "");
  if (!str || str === "-" || str === "--") return defaultVal;
  const num = parseFloat(str);
  return isNaN(num) ? defaultVal : num;
}

const MONTH_MAP = new Map<string, number>(
  MONTHS_SHORT.flatMap((m, idx) => [
    [m.toLowerCase(), idx],
    [m.toLowerCase().slice(0, 3), idx],
  ]),
);

/**
 * Normalizes date to parse year, month, day and timestamp safely.
 * Accepts formats: D/M/YYYY, DD/MM/YYYY, YYYY-MM-DD, M/D/YYYY, etc.
 */
function parseDateComponents(
  dateStr: string,
  yearHint?: number,
  monthHint?: string,
  dayHint?: number,
): {
  year: number;
  month: string;
  day: number;
  dateFormatted: string;
  timestamp: number;
} {
  let y = yearHint || 2026;
  let mName = monthHint || "Aug";
  let mIndex = MONTH_MAP.get(mName.toLowerCase().slice(0, 3)) ?? 7;
  let d = dayHint || 1;

  if (dateStr && typeof dateStr === "string") {
    const trimmed = dateStr.trim();
    if (trimmed.includes("/") || trimmed.includes("-")) {
      const sep = trimmed.includes("/") ? "/" : "-";
      const parts = trimmed.split(sep).map((p) => parseInt(p.trim(), 10));
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          // YYYY-MM-DD
          y = parts[0];
          mIndex = Math.max(0, Math.min(11, parts[1] - 1));
          d = parts[2] || 1;
        } else if (parts[2] > 1000) {
          // D/M/YYYY or M/D/YYYY
          d = parts[0];
          mIndex = Math.max(0, Math.min(11, parts[1] - 1));
          y = parts[2];
        }
        mName = MONTHS_SHORT[mIndex] || mName;
      }
    }
  }

  const dateObj = new Date(y, mIndex, d);
  const isoFormatted = `${y}-${String(mIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return {
    year: y,
    month: mName,
    day: d,
    dateFormatted: isoFormatted,
    timestamp: dateObj.getTime(),
  };
}

/**
 * Normalizes strings by trimming and stripping null / error values.
 */
function cleanString(val: unknown, fallback = ""): string {
  if (!isValidFilterOption(val)) return fallback;
  return String(val).trim();
}

/**
 * Normalizes week values from the sheet/CSV.
 * - Converts "Week0" and "Week 1" (case-insensitive, with or without spaces) to "Week1".
 * - Converts "Week6" and "Week 6" to "Week5".
 */
export function normalizeWeek(val: unknown, fallbackDay?: number): string {
  const str = val !== undefined && val !== null ? String(val).trim() : "";

  if (!str) {
    if (fallbackDay !== undefined && !isNaN(fallbackDay) && fallbackDay > 0) {
      const calcWeek = Math.ceil(fallbackDay / 7);
      if (calcWeek === 0) return "Week1";
      if (calcWeek >= 6) return "Week5";
      return `Week${calcWeek}`;
    }
    return "Week1";
  }

  // Convert "Week0", "Week 0", "Week 1", "Week1", "Wk0", "Wk 1", "0", "1" to "Week1"
  if (/^(week\s*[01]|wk\s*[01]|[01])$/i.test(str)) {
    return "Week1";
  }

  // Convert "Week6", "Week 6", "Wk6", "Wk 6", "6" to "Week5"
  if (/^(week\s*6|wk\s*6|6)$/i.test(str)) {
    return "Week5";
  }

  // Standardize other numeric week patterns (e.g. "Week 2", "Wk 3") to "Week2", "Week3"
  const match = str.match(/^(?:week|wk)\s*(\d+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num <= 1) return "Week1";
    if (num === 6) return "Week5";
    return `Week${num}`;
  }

  return str;
}

/**
 * Pre-computes column key mappings once for O(1) row lookups instead of
 * scanning keys on every single row.
 */
function createHeaderKeyResolver(rowKeys: string[]) {
  const cleanMap = new Map<string, string>();
  for (let i = 0; i < rowKeys.length; i++) {
    const k = rowKeys[i];
    cleanMap.set(k, k);
    cleanMap.set(k.toLowerCase().replace(/[^a-z0-9]/g, ""), k);
  }

  return (possibleKeys: string[]): string | null => {
    for (let i = 0; i < possibleKeys.length; i++) {
      const key = possibleKeys[i];
      if (cleanMap.has(key)) return cleanMap.get(key)!;
      const clean = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanMap.has(clean)) return cleanMap.get(clean)!;
    }
    return null;
  };
}

export function parseSalesCsv(csvText: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(csvText, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const records: SaleRecord[] = [];
        const errors: string[] = [];

        if (!results.data || results.data.length === 0) {
          resolve({
            records: [],
            errors: ["CSV file contains no data rows."],
            totalRows: 0,
          });
          return;
        }

        // Pre-resolve all column keys once from the first available row keys
        const firstRow = results.data[0] || {};
        const resolveKey = createHeaderKeyResolver(Object.keys(firstRow));

        const kYear = resolveKey(["Year", "year", "Yr"]);
        const kMonth = resolveKey(["Month", "month", "Mo"]);
        const kWeek = resolveKey(["Week", "week", "Wk"]);
        const kDay = resolveKey(["Day", "day", "D"]);
        const kDate = resolveKey(["Date", "date", "Order Date", "Sale Date"]);
        const kOrderNumber = resolveKey([
          "Order Number",
          "Order No",
          "Order Id",
          "Order_Number",
          "order_id",
        ]);
        const kCustomerName = resolveKey([
          "Customer name",
          "Customer Name",
          "Customer",
          "Buyer Name",
        ]);
        const kBarCode = resolveKey([
          "Bar Code",
          "Barcode",
          "SKU",
          "Item Code",
        ]);
        const kProductName = resolveKey([
          "Product name",
          "Product Name",
          "Item Name",
          "Title",
          "Product",
        ]);
        const kColor = resolveKey(["Color", "Colour", "Variant"]);
        const kCategory = resolveKey([
          "PRODUCT CATEGORY",
          "Product Category",
          "Category",
          "Item Category",
        ]);
        const kQty = resolveKey(["QTY", "Qty", "Quantity", "Units"]);
        const kMrp = resolveKey(["MRP", "Mrp", "Price", "Unit Price"]);
        const kScoobiesMargin = resolveKey([
          "Scoobies Margin",
          "Margin",
          "Gross Margin",
        ]);
        const kRetailersMargin = resolveKey([
          "Retailers Margin",
          "Retailer Margin",
          "Channel Margin",
        ]);
        const kExGstMargin = resolveKey([
          "EX-GST Scoobies Margin",
          "Ex-GST Margin",
          "Ex GST Margin",
          "EX GST",
        ]);
        const kDeliveryPlace = resolveKey([
          "Delivery Place",
          "City",
          "Location",
          "Delivery City",
        ]);
        const kState = resolveKey(["State", "Province", "Region"]);
        const kWebsite = resolveKey([
          "Website",
          "Channel",
          "Platform",
          "Portal",
          "Source",
        ]);
        const kStatus = resolveKey([
          "Status",
          "Order Status",
          "Delivery Status",
        ]);
        const kBackToSchool = resolveKey([
          "Back To School",
          "Back to School",
          "Campaign",
          "B2S",
        ]);
        const kZone = resolveKey(["Zone", "Sales Zone", "Area"]);
        const kSaleValue = resolveKey([
          "Sale Value",
          "Sale_Value",
          "Net Sales",
          "Sales",
          "Total Value",
        ]);

        const getVal = (
          row: Record<string, unknown>,
          resolvedKey: string | null,
        ): unknown => {
          return resolvedKey ? row[resolvedKey] : undefined;
        };

        const len = results.data.length;
        for (let idx = 0; idx < len; idx++) {
          const row = results.data[idx];
          try {
            const rawYear = cleanNumber(getVal(row, kYear));
            const rawMonth = String(getVal(row, kMonth) || "").trim();
            const rawWeekInput = getVal(row, kWeek);
            const rawDay = cleanNumber(getVal(row, kDay));
            const rawDate = String(getVal(row, kDate) || "").trim();

            const dateInfo = parseDateComponents(
              rawDate,
              rawYear || 2026,
              rawMonth || "Aug",
              rawDay || 1,
            );

            const rawWeek = normalizeWeek(rawWeekInput, dateInfo.day);

            const orderNumber = String(
              getVal(row, kOrderNumber) || `ORD-${idx + 1}`,
            ).trim();

            const customerName = String(
              getVal(row, kCustomerName) || "Valued Customer",
            ).trim();

            const barCode = String(getVal(row, kBarCode) || "").trim();
            const productName = String(
              getVal(row, kProductName) || "General Item",
            ).trim();

            const color = String(getVal(row, kColor) || "Standard").trim();
            const category = String(getVal(row, kCategory) || "General").trim();

            const qty = cleanNumber(getVal(row, kQty), 1);
            const mrp = cleanNumber(getVal(row, kMrp), 0);

            const scoobiesMargin = cleanNumber(getVal(row, kScoobiesMargin), 0);
            const retailersMargin = cleanNumber(
              getVal(row, kRetailersMargin),
              0,
            );
            const exGstMargin = cleanNumber(
              getVal(row, kExGstMargin),
              scoobiesMargin * 0.85,
            );

            const deliveryPlace = cleanString(
              getVal(row, kDeliveryPlace),
              "Unspecified",
            );

            const state = cleanString(getVal(row, kState), "Unassigned");
            const websiteRaw = cleanString(getVal(row, kWebsite), "Direct");
            const channel = websiteRaw || "Direct Website";

            const rawStatus = cleanString(getVal(row, kStatus), "Dispatched");
            let status: "Dispatched" | "Return" | "Cancelled" | "Other" =
              "Dispatched";
            if (rawStatus.toLowerCase().includes("return") || qty < 0) {
              status = "Return";
            } else if (rawStatus.toLowerCase().includes("cancel")) {
              status = "Cancelled";
            } else if (
              rawStatus.toLowerCase().includes("dispatch") ||
              rawStatus.toLowerCase().includes("delivered")
            ) {
              status = "Dispatched";
            }

            const backToSchool = cleanString(
              getVal(row, kBackToSchool),
              "Standard",
            );

            const zone = cleanString(getVal(row, kZone), "Unassigned");

            const saleValue = cleanNumber(
              getVal(row, kSaleValue),
              qty < 0 ? -Math.abs(mrp * qty) : mrp * qty,
            );

            const record: SaleRecord = {
              id: `${orderNumber}-${idx}`,
              year: dateInfo.year,
              month: dateInfo.month,
              week: rawWeek,
              day: dateInfo.day,
              dateStr: dateInfo.dateFormatted,
              timestamp: dateInfo.timestamp,
              orderNumber,
              customerName,
              barCode,
              productName,
              color,
              category: category.toUpperCase(),
              qty,
              mrp,
              scoobiesMargin,
              retailersMargin,
              exGstMargin,
              deliveryPlace,
              state,
              channel,
              status,
              backToSchool,
              zone,
              saleValue,
            };

            records.push(record);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Row ${idx + 1}: ${msg}`);
          }
        }

        resolve({
          records,
          errors,
          totalRows: records.length,
        });
      },
    });
  });
}

/**
 * Triggers a browser file download for text/CSV content via a transient Blob URL.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8;",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Serializes and triggers download of SaleRecords as a formatted CSV file.
 */
export function exportRecordsToCsv(
  records: SaleRecord[],
  filename?: string,
): void {
  if (!records || records.length === 0) return;
  const exportData = records.map((r) => ({
    Date: r.dateStr,
    Year: r.year,
    Month: r.month,
    Week: r.week,
    "Order Number": r.orderNumber,
    "Customer Name": r.customerName,
    "Bar Code": r.barCode,
    "Product Name": r.productName,
    Color: r.color,
    Category: r.category,
    QTY: r.qty,
    MRP: r.mrp,
    "Sale Value": r.saleValue,
    "Scoobies Margin": r.scoobiesMargin,
    "EX-GST Margin": r.exGstMargin,
    Channel: r.channel,
    Status: r.status,
    Location: r.deliveryPlace,
    State: r.state,
    Zone: r.zone,
    Campaign: r.backToSchool,
  }));

  const csvStr = Papa.unparse(exportData);
  const name =
    filename ||
    `filtered_sales_export_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csvStr, name);
}
