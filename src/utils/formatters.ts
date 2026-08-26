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
  const rounded = Math.round(val);
  return `₹${inrFormatter.format(rounded)}`;
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

/**
 * Sorts month names chronologically (Jan -> Dec)
 */
export function sortMonthList(months: string[]): string[] {
  return [...months].sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const idxA = MONTHS_SHORT.findIndex(
      (m) => m.toLowerCase() === aLower || aLower.startsWith(m.toLowerCase()),
    );
    const idxB = MONTHS_SHORT.findIndex(
      (m) => m.toLowerCase() === bLower || bLower.startsWith(m.toLowerCase()),
    );
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });
}

/**
 * Sorts week identifiers numerically (Week 1 -> Week 52)
 */
export function sortWeekList(weeks: string[]): string[] {
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
