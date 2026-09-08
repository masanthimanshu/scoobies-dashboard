import Papa from "papaparse";
import { SaleRecord } from "../types";
import {
  isValidFilterOption,
  MONTHS_SHORT,
  MONTH_INDEX_MAP,
} from "./formatters";

interface ParseResult {
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

/**
 * Normalizes date to parse year, month, day and timestamp safely.
 * Accepts formats: D/M/YYYY, DD/MM/YYYY, YYYY-MM-DD, M/D/YYYY, Excel serial dates, named months.
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
  let mIndex = MONTH_INDEX_MAP.get(mName.toLowerCase().slice(0, 3)) ?? 7;
  let d = dayHint || 1;

  if (dateStr && typeof dateStr === "string") {
    const trimmed = dateStr.trim();

    // Check for Excel serial date number (e.g. 45505)
    if (/^\d{5}(?:\.\d+)?$/.test(trimmed)) {
      const serial = parseFloat(trimmed);
      if (serial >= 20000 && serial <= 70000) {
        // Excel 1900 leap year bug offset: 25569 days between 1899-12-30 and 1970-01-01
        const dateObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          y = dateObj.getFullYear();
          mIndex = dateObj.getMonth();
          mName = MONTHS_SHORT[mIndex] || mName;
          d = dateObj.getDate();
        }
      }
    } else if (
      trimmed.includes("/") ||
      trimmed.includes("-") ||
      trimmed.includes(".") ||
      trimmed.includes(" ")
    ) {
      // Split on separators: /, -, ., or spaces
      const rawParts = trimmed.split(/[/.\s-]+/).filter(Boolean);

      if (rawParts.length >= 3) {
        // Check if any part is a named month (e.g. 01-Aug-2026)
        let namedMonthIdx = -1;
        for (let i = 0; i < rawParts.length; i++) {
          const lower = rawParts[i].toLowerCase().slice(0, 3);
          if (MONTH_INDEX_MAP.has(lower)) {
            namedMonthIdx = i;
            mIndex = MONTH_INDEX_MAP.get(lower)!;
            mName = MONTHS_SHORT[mIndex] || mName;
            break;
          }
        }

        if (namedMonthIdx !== -1) {
          // One part was a month name
          const otherNums = rawParts
            .filter((_, idx) => idx !== namedMonthIdx)
            .map((p) => parseInt(p.trim(), 10))
            .filter((n) => !isNaN(n));
          if (otherNums.length >= 2) {
            if (otherNums[0] > 1000) {
              y = otherNums[0];
              d = otherNums[1] || 1;
            } else if (otherNums[1] > 1000) {
              d = otherNums[0] || 1;
              y = otherNums[1];
            } else if (otherNums[1] < 100 && otherNums[1] >= 20) {
              d = otherNums[0] || 1;
              y = 2000 + otherNums[1];
            } else {
              d = otherNums[0] || 1;
            }
          }
        } else {
          // All parts are numbers
          const parts = rawParts.map((p) => parseInt(p.trim(), 10));
          if (parts.length >= 3 && !parts.some(isNaN)) {
            if (parts[0] > 1000) {
              // YYYY-MM-DD
              y = parts[0];
              mIndex = Math.max(0, Math.min(11, parts[1] - 1));
              d = parts[2] || 1;
              mName = MONTHS_SHORT[mIndex] || mName;
            } else {
              // Could be D/M/YYYY or M/D/YYYY or D/M/YY or M/D/YY
              if (parts[2] > 1000) {
                y = parts[2];
              } else if (parts[2] < 100 && parts[2] >= 0) {
                y = 2000 + parts[2];
              }

              // Disambiguate D/M vs M/D
              const p0 = parts[0];
              const p1 = parts[1];

              // Expected 1-based month from monthHint if provided
              const expectedMonth = mIndex + 1;

              if (p0 > 12) {
                // p0 can only be day (e.g. 15/08/2026) -> D/M/YYYY
                d = p0;
                mIndex = Math.max(0, Math.min(11, p1 - 1));
                mName = MONTHS_SHORT[mIndex] || mName;
              } else if (p1 > 12) {
                // p1 can only be day (e.g. 08/15/2026) -> M/D/YYYY
                mIndex = Math.max(0, Math.min(11, p0 - 1));
                d = p1;
                mName = MONTHS_SHORT[mIndex] || mName;
              } else if (p0 === expectedMonth && p1 !== expectedMonth) {
                // p0 matches monthHint -> M/D/YYYY (e.g. 8/1/2026 with month=Aug)
                mIndex = Math.max(0, Math.min(11, p0 - 1));
                d = p1;
                mName = MONTHS_SHORT[mIndex] || mName;
              } else if (p1 === expectedMonth && p0 !== expectedMonth) {
                // p1 matches monthHint -> D/M/YYYY (e.g. 1/8/2026 with month=Aug)
                d = p0;
                mIndex = Math.max(0, Math.min(11, p1 - 1));
                mName = MONTHS_SHORT[mIndex] || mName;
              } else {
                // Fallback default for Indian/UK standard: D/M/YYYY
                d = p0;
                mIndex = Math.max(0, Math.min(11, p1 - 1));
                mName = MONTHS_SHORT[mIndex] || mName;
              }
            }
          }
        }
      }
    }
  }

  // Ensure day is valid for the month
  d = Math.max(1, Math.min(31, d));
  const dateObj = new Date(y, mIndex, d);
  const isoFormatted = `${y}-${String(mIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return {
    year: y,
    month: mName,
    day: d,
    dateFormatted: isoFormatted,
    timestamp: isNaN(dateObj.getTime()) ? Date.now() : dateObj.getTime(),
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
 * Normalizes week values from diverse formats in CSV/Excel sheets.
 * - Converts "Week0", "Week 0", "Week 1", "Week1", "Week-1", "W1", "01", "1", etc. to "Week1".
 * - Converts "Week6", "Week 6", "6", and any week >= 5 to "Week5".
 * - Converts empty or placeholder values ("-", "N/A") to computed week based on day.
 */
function normalizeWeek(val: unknown, fallbackDay?: number): string {
  const getFallback = (): string => {
    if (fallbackDay !== undefined && !isNaN(fallbackDay) && fallbackDay > 0) {
      const calcWeek = Math.ceil(fallbackDay / 7);
      if (calcWeek <= 1) return "Week1";
      if (calcWeek >= 5) return "Week5";
      return `Week${calcWeek}`;
    }
    return "Week1";
  };

  if (val === undefined || val === null) {
    return getFallback();
  }

  // Strip zero-width spaces, BOM, and trailing/leading whitespace
  const str = String(val)
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

  // If empty or Excel error / placeholder value
  if (
    !str ||
    str === "-" ||
    str === "--" ||
    str.toLowerCase() === "n/a" ||
    str.toLowerCase() === "#n/a" ||
    str.toLowerCase() === "null" ||
    str.toLowerCase() === "undefined" ||
    str.toLowerCase() === "none" ||
    str.toLowerCase() === "nil"
  ) {
    return getFallback();
  }

  // Handle word forms: "first week", "1st week", etc.
  if (/first\s*week/i.test(str)) return "Week1";
  if (/second\s*week/i.test(str)) return "Week2";
  if (/third\s*week/i.test(str)) return "Week3";
  if (/fourth\s*week/i.test(str)) return "Week4";
  if (/fifth\s*week/i.test(str) || /sixth\s*week/i.test(str)) return "Week5";

  // Check for "week", "wk", or "w" followed by optional non-digit chars and digits
  // Matches: "Week 1", "Week1", "Week-1", "Week_1", "Week.1", "Wk 1", "Wk1", "W1", "W 1", "W01", "W-1", "Week 01", "Week 1 (Aug)"
  const weekMatch = /(?:week|wk|w)[^0-9]*(\d+)/i.exec(str);
  if (weekMatch) {
    const num = parseInt(weekMatch[1], 10);
    if (!isNaN(num)) {
      if (num <= 1) return "Week1";
      if (num >= 5) return "Week5";
      return `Week${num}`;
    }
  }

  // Check for ordinal week pattern: "1st Week", "2nd Week", "1st", "2nd"
  const ordinalMatch = /^(\d+)(?:st|nd|rd|th)?\s*week/i.exec(str);
  if (ordinalMatch) {
    const num = parseInt(ordinalMatch[1], 10);
    if (!isNaN(num)) {
      if (num <= 1) return "Week1";
      if (num >= 5) return "Week5";
      return `Week${num}`;
    }
  }

  // Check for plain number or decimal from Excel: "1", "01", "1.0", "0", "00", "0.0", "2", "3", "4", "5", "6"
  const numMatch = /^(\d+)(?:\.0+)?$/.exec(str);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (!isNaN(num)) {
      if (num <= 1) return "Week1";
      if (num >= 5) return "Week5";
      return `Week${num}`;
    }
  }

  // If unknown text pattern but fallbackDay is provided
  if (fallbackDay !== undefined && !isNaN(fallbackDay) && fallbackDay > 0) {
    return getFallback();
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
    // 1. Direct or clean key match
    for (let i = 0; i < possibleKeys.length; i++) {
      const key = possibleKeys[i];
      if (cleanMap.has(key)) return cleanMap.get(key)!;
      const clean = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanMap.has(clean)) return cleanMap.get(clean)!;
    }

    // 2. Fuzzy prefix / substring match fallback for week/date/order columns
    for (let i = 0; i < possibleKeys.length; i++) {
      const pClean = possibleKeys[i].toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const [cKey, originalKey] of cleanMap.entries()) {
        if (
          cKey === pClean ||
          cKey.startsWith(pClean) ||
          pClean.startsWith(cKey)
        ) {
          return originalKey;
        }
      }
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

        // Pre-resolve all column keys once from parsed fields or first row keys
        const headerKeys =
          results.meta && results.meta.fields && results.meta.fields.length > 0
            ? results.meta.fields
            : Object.keys(results.data[0] || {});
        const resolveKey = createHeaderKeyResolver(headerKeys);

        const kYear = resolveKey([
          "Year",
          "year",
          "Yr",
          "Order Year",
          "Sale Year",
        ]);
        const kMonth = resolveKey([
          "Month",
          "month",
          "Mo",
          "Order Month",
          "Sale Month",
        ]);
        const kWeek = resolveKey([
          "Week",
          "week",
          "Wk",
          "Week No",
          "Week No.",
          "Week Number",
          "Week_Number",
          "Week_No",
          "Week#",
          "Weeks",
          "Wk No",
          "Wk#",
          "Wk_No",
          "WeekNum",
          "Weeknum",
          "Fiscal Week",
          "Calendar Week",
          "Sales Week",
        ]);
        const kDay = resolveKey([
          "Day",
          "day",
          "D",
          "Day No",
          "Day Number",
          "Day_No",
          "Day_Number",
          "Day of Month",
          "Date of Month",
        ]);
        const kDate = resolveKey([
          "Date",
          "date",
          "Order Date",
          "Sale Date",
          "Invoice Date",
          "Transaction Date",
          "Dispatch Date",
          "Order_Date",
          "Sale_Date",
          "Bill Date",
        ]);
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
        const kMrpValue = resolveKey([
          "MRP Value",
          "MRP_Value",
          "Mrp Value",
          "MRP Total",
          "Total MRP",
          "Mrp_Value",
          "MRP_Val",
        ]);
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

            let mrpValue = cleanNumber(
              getVal(row, kMrpValue),
              qty < 0 ? -Math.abs(mrp * qty) : mrp * qty,
            );
            if (status === "Return" || qty < 0) {
              mrpValue = -Math.abs(mrpValue);
            }

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
              mrpValue,
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
    "MRP Value": r.mrpValue,
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
