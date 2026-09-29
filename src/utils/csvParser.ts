import Papa from "papaparse";
import { SaleRecord } from "../types";
import { MONTHS_SHORT, MONTH_INDEX_MAP, parseNumericInput } from "./formatters";

interface ParseResult {
  records: SaleRecord[];
  errors: string[];
  totalRows: number;
}

const cleanNumber = parseNumericInput;

/**
 * Normalizes date to parse year, month, day and timestamp safely.
 * Accepts formats: D/M/YYYY, DD/MM/YYYY, YYYY-MM-DD, M/D/YYYY, Excel serial dates, named months.
 */
function parseDateComponents(
  dateStr: string,
  yearHint = 2026,
  monthHint = "Aug",
  dayHint = 1,
): {
  year: number;
  month: string;
  day: number;
  dateFormatted: string;
  timestamp: number;
} {
  let y = yearHint;
  let mIndex = MONTH_INDEX_MAP.get(monthHint.toLowerCase().slice(0, 3)) ?? 7;
  let d = dayHint;

  if (dateStr && typeof dateStr === "string") {
    const str = dateStr.trim();
    const num = Number(str);
    if (!isNaN(num) && num > 20000 && num < 70000) {
      // Excel serial date number
      const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        y = dateObj.getFullYear();
        mIndex = dateObj.getMonth();
        d = dateObj.getDate();
      }
    } else {
      const parts = str.split(/[/.\s-]+/).filter(Boolean);
      if (parts.length >= 3) {
        const monthIdx = parts.findIndex((p) =>
          MONTH_INDEX_MAP.has(p.toLowerCase().slice(0, 3)),
        );
        if (monthIdx !== -1) {
          mIndex = MONTH_INDEX_MAP.get(
            parts[monthIdx].toLowerCase().slice(0, 3),
          )!;
          const nums = parts
            .filter((_, i) => i !== monthIdx)
            .map((p) => parseInt(p, 10))
            .filter((n) => !isNaN(n));
          if (nums.length >= 2) {
            y =
              nums[0] > 1000
                ? nums[0]
                : nums[1] > 1000
                  ? nums[1]
                  : 2000 + (nums[1] || 0);
            d = nums[0] > 1000 ? nums[1] : nums[0];
          }
        } else {
          const [p0, p1, p2] = parts.map((p) => parseInt(p, 10));
          if (p0 > 1000) {
            y = p0;
            mIndex = Math.max(0, Math.min(11, p1 - 1));
            d = p2 || 1;
          } else {
            y = p2 > 1000 ? p2 : 2000 + (p2 || 0);
            if (p0 > 12) {
              d = p0;
              mIndex = Math.max(0, Math.min(11, p1 - 1));
            } else if (p1 > 12) {
              d = p1;
              mIndex = Math.max(0, Math.min(11, p0 - 1));
            } else {
              d = p0;
              mIndex = Math.max(0, Math.min(11, p1 - 1));
            }
          }
        }
      }
    }
  }

  d = Math.max(1, Math.min(31, d));
  const mName = MONTHS_SHORT[mIndex] || monthHint;
  const isoFormatted = `${y}-${String(mIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const timestamp = new Date(y, mIndex, d).getTime();

  return {
    year: y,
    month: mName,
    day: d,
    dateFormatted: isoFormatted,
    timestamp: isNaN(timestamp) ? Date.now() : timestamp,
  };
}

/**
 * Normalizes strings by trimming and stripping null / error values.
 */
function cleanString(val: unknown, fallback = ""): string {
  if (val == null) return fallback;
  const str = String(val).trim();
  return str.length > 0 && !str.startsWith("#") ? str : fallback;
}

/**
 * Normalizes week values from diverse formats in CSV/Excel sheets.
 */
function normalizeWeek(val: unknown, fallbackDay = 1): string {
  if (val != null) {
    const match = String(val).match(/\d+/);
    if (match) {
      return `Week${Math.min(5, Math.max(1, parseInt(match[0], 10)))}`;
    }
  }
  return `Week${Math.min(5, Math.max(1, Math.ceil(fallbackDay / 7)))}`;
}

/**
 * Pre-computes column key mappings once for O(1) row lookups.
 */
function createHeaderKeyResolver(rowKeys: string[]) {
  const cleanMap = new Map<string, string>();
  for (const k of rowKeys) {
    cleanMap.set(k.toLowerCase().replace(/[^a-z0-9]/g, ""), k);
  }

  return (...patterns: string[]): string | undefined => {
    for (const [cleanKey, originalKey] of cleanMap.entries()) {
      for (const p of patterns) {
        if (cleanKey === p || cleanKey.includes(p)) {
          return originalKey;
        }
      }
    }
    return undefined;
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

        const headerKeys =
          results.meta?.fields && results.meta.fields.length > 0
            ? results.meta.fields
            : Object.keys(results.data[0] || {});
        const resolveKey = createHeaderKeyResolver(headerKeys);

        const kYear = resolveKey("year", "yr");
        const kMonth = resolveKey("month", "mo");
        const kWeek = resolveKey("week", "wk");
        const kDay = resolveKey("day");
        const kDate = resolveKey("date");
        const kOrderNumber = resolveKey(
          "orderno",
          "orderid",
          "ordernumber",
          "order",
        );
        const kCustomerName = resolveKey("customer", "buyer");
        const kBarCode = resolveKey("barcode", "sku", "itemcode");
        const kProductName = resolveKey(
          "productname",
          "itemname",
          "product",
          "title",
        );
        const kColor = resolveKey("color", "colour", "variant");
        const kCategory = resolveKey("category");
        const kQty = resolveKey("qty", "quantity", "units");
        const kMrpValue = resolveKey("mrpvalue", "totalmrp", "mrpval");
        const kMrp = resolveKey("mrp", "price", "unitprice");
        const kScoobiesMargin = resolveKey("scoobiesmargin", "margin");
        const kRetailersMargin = resolveKey("retailer", "channelmargin");
        const kExGstMargin = resolveKey("exgst");
        const kDeliveryPlace = resolveKey("deliveryplace", "city", "location");
        const kState = resolveKey("state", "province", "region");
        const kWebsite = resolveKey(
          "channel",
          "website",
          "platform",
          "portal",
          "source",
        );
        const kStatus = resolveKey("status");
        const kBackToSchool = resolveKey("backtoschool", "b2s", "campaign");
        const kZone = resolveKey("zone", "area");
        const kSaleValue = resolveKey(
          "salevalue",
          "netsales",
          "sales",
          "totalvalue",
        );

        const getVal = (row: Record<string, unknown>, key?: string): unknown =>
          key ? row[key] : undefined;

        const len = results.data.length;
        for (let idx = 0; idx < len; idx++) {
          const row = results.data[idx];
          try {
            const rawYear = cleanNumber(getVal(row, kYear));
            const rawMonth = String(getVal(row, kMonth) || "").trim();
            const rawDay = cleanNumber(getVal(row, kDay));
            const rawDate = String(getVal(row, kDate) || "").trim();

            const dateInfo = parseDateComponents(
              rawDate,
              rawYear || 2026,
              rawMonth || "Aug",
              rawDay || 1,
            );

            const rawWeek = normalizeWeek(getVal(row, kWeek), dateInfo.day);
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
            const channel = cleanString(getVal(row, kWebsite), "Direct");

            const rawStatus = cleanString(
              getVal(row, kStatus),
              "Dispatched",
            ).toLowerCase();
            const status: "Dispatched" | "Return" | "Cancelled" | "Other" =
              rawStatus.includes("return") || qty < 0
                ? "Return"
                : rawStatus.includes("cancel")
                  ? "Cancelled"
                  : "Dispatched";

            const backToSchool = cleanString(
              getVal(row, kBackToSchool),
              "Standard",
            );

            const zone = cleanString(getVal(row, kZone), "Unassigned");

            const baseTotal = qty < 0 ? -Math.abs(mrp * qty) : mrp * qty;
            const saleValue = cleanNumber(getVal(row, kSaleValue), baseTotal);
            let mrpValue = cleanNumber(getVal(row, kMrpValue), baseTotal);
            if (status === "Return" || qty < 0) {
              mrpValue = -Math.abs(mrpValue);
            }

            records.push({
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
            });
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
