/**
 * Shared Formatter and Utility Functions for Scoobies Dashboard
 * Consolidates duplicate number/currency/string formatting and chart palettes
 * with zero-allocation performance optimizations.
 */

// Cached Indian Number Formatter instance for fast currency formatting
const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/**
 * Formats a numeric value into INR currency format (e.g. ₹1,23,456)
 */
export function formatCurrency(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  return `₹${inrFormatter.format(Math.round(val))}`;
}

/**
 * Formats a currency value compactly for chart axes (e.g. ₹15k, ₹500)
 */
export function formatCompactCurrency(val: number): string {
  if (Math.abs(val) >= 1000) {
    return `₹${(val / 1000).toFixed(0)}k`;
  }
  return `₹${val}`;
}

/**
 * Formats a number with Indian thousand separators (e.g. 1,23,456)
 */
export function formatNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return inrFormatter.format(Math.round(val));
}

/**
 * Formats a percentage value safely to a fixed decimal precision
 */
export function formatPercent(
  val: number | undefined | null,
  decimals = 1,
): string {
  if (val === undefined || val === null || isNaN(val)) {
    return decimals > 0 ? `0.${"0".repeat(decimals)}%` : "0%";
  }
  return `${val.toFixed(decimals)}%`;
}

/**
 * Computes a percentage ratio safely without NaN or Infinity, clamped to 0 minimum.
 */
export function computeSharePct(
  val: number,
  total: number,
  decimals = 1,
): number {
  if (!total || total <= 0) return 0;
  return Number(((Math.max(0, val) / total) * 100).toFixed(decimals));
}

/**
 * Computes return rate percentage from returned items vs total gross items.
 */
export function calculateReturnRate(
  returnUnits: number,
  totalUnits: number,
  decimals = 1,
): number {
  if (!totalUnits || totalUnits <= 0) return 0;
  return Number(
    ((Math.max(0, returnUnits) / totalUnits) * 100).toFixed(decimals),
  );
}

/**
 * Safely parses any number/currency string (e.g. "₹1,200", "  500.5 ", "500000") into a clean number.
 */
export function parseNumericInput(val: unknown, defaultVal = 0): number {
  if (val == null) return defaultVal;
  if (typeof val === "number") return isNaN(val) ? defaultVal : val;
  const num = parseFloat(String(val).replace(/[₹$,\s]/g, ""));
  return isNaN(num) ? defaultVal : num;
}

/**
 * Normalizes a week string (e.g. "Week 1", "Week1", "week-1") to a lowercase alphanumeric key.
 */
export function cleanWeekKey(val: string): string {
  return String(val || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if a filter string or option is valid and not empty / Excel error artifact
 */
export function isValidFilterOption(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  const str = String(val).trim();
  return (
    str.length > 0 &&
    !str.startsWith("#") &&
    str !== "N/A" &&
    str !== "null" &&
    str !== "undefined"
  );
}

/**
 * Checks whether a given transaction backToSchool field corresponds to B2S campaign
 */
export function isB2SCampaign(val: string | undefined | null): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return lower.includes("back to school") || lower.includes("b2s");
}

/**
 * Natural earthy color palette used across charts and category breakdowns
 */
export const CHART_PALETTE = [
  "#5F7161", // Forest Sage
  "#AF8260", // Terracotta
  "#E7AB79", // Ochre Amber
  "#6A7C6C", // Deep Sage
  "#C59B76", // Sandalwood
  "#869688", // Muted Olive
  "#8C8376", // Warm Stone
  "#2D2A26", // Espresso
] as const;

/**
 * Standard 3-letter month abbreviations for chronological ordering
 */
export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const MONTH_INDEX_MAP = new Map<string, number>(
  MONTHS_SHORT.flatMap((m, idx) => [
    [m.toLowerCase(), idx],
    [m.toLowerCase().slice(0, 3), idx],
  ]),
);

/**
 * Sorts month names chronologically (Jan -> Dec)
 */
export function sortMonthList(months: string[]): string[] {
  if (months.length <= 1) return [...months];
  return [...months].sort((a, b) => {
    const aLower = a.toLowerCase().slice(0, 3);
    const bLower = b.toLowerCase().slice(0, 3);
    const idxA = MONTH_INDEX_MAP.get(aLower) ?? -1;
    const idxB = MONTH_INDEX_MAP.get(bLower) ?? -1;
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });
}

/**
 * Sorts week identifiers numerically (Week 1 -> Week 52)
 */
export function sortWeekList(weeks: string[]): string[] {
  if (weeks.length <= 1) return [...weeks];
  return [...weeks].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

/**
 * Consistent tooltip styling across charts
 */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#2D2A26",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "12px",
  border: "none",
  fontWeight: 600,
} as const;
