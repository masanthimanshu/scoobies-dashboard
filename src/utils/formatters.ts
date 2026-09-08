/**
 * Shared Formatter and Utility Functions for Scoobies Dashboard
 * Consolidates duplicate number/currency/string formatting and chart palettes
 * with zero-allocation performance optimizations.
 */

// Cached Indian Number Formatter instance for fast currency formatting
const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const MAX_CACHE_SIZE = 2000;
const currencyCache = new Map<number, string>();
const numberCache = new Map<number, string>();

/**
 * Formats a numeric value into INR currency format (e.g. ₹1,23,456)
 */
export function formatCurrency(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  const rounded = Math.round(val);
  const cached = currencyCache.get(rounded);
  if (cached !== undefined) return cached;

  const formatted = `₹${inrFormatter.format(rounded)}`;
  if (currencyCache.size >= MAX_CACHE_SIZE) currencyCache.clear();
  currencyCache.set(rounded, formatted);
  return formatted;
}

/**
 * Formats a number with Indian thousand separators (e.g. 1,23,456)
 */
export function formatNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  const rounded = Math.round(val);
  const cached = numberCache.get(rounded);
  if (cached !== undefined) return cached;

  const formatted = inrFormatter.format(rounded);
  if (numberCache.size >= MAX_CACHE_SIZE) numberCache.clear();
  numberCache.set(rounded, formatted);
  return formatted;
}

/**
 * Formats a percentage value safely to a fixed decimal precision
 */
export function formatPercent(
  val: number | undefined | null,
  decimals = 1,
): string {
  if (val === undefined || val === null || isNaN(val))
    return `0.${"0".repeat(decimals)}%`;
  return `${val.toFixed(decimals)}%`;
}

/**
 * Checks if a filter string or option is valid and not empty / Excel error artifact
 */
export function isValidFilterOption(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  const str = String(val).trim();
  return (
    str.length > 0 &&
    str !== "#N/A" &&
    str !== "N/A" &&
    str !== "#VALUE!" &&
    str !== "#REF!" &&
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
