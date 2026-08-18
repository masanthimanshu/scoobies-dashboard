import Papa from 'papaparse';
import { SaleRecord } from '../types';

export interface ParseResult {
  records: SaleRecord[];
  errors: string[];
  totalRows: number;
  years: number[];
  channels: string[];
  categories: string[];
  zones: string[];
}

/**
 * Normalizes number fields from diverse formats (e.g., "  1,829.66 ", " - ", "-329.03", "₹1,200", etc.)
 */
export function cleanNumber(val: any, defaultVal = 0): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const str = String(val).trim().replace(/[₹$,]/g, '');
  if (!str || str === '-' || str === '--') return defaultVal;
  const num = parseFloat(str);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Normalizes date to parse year, month, day and timestamp safely.
 * Accepts formats: D/M/YYYY, DD/MM/YYYY, YYYY-MM-DD, M/D/YYYY, etc.
 */
export function parseDateComponents(dateStr: string, yearHint?: number, monthHint?: string, dayHint?: number): {
  year: number;
  month: string;
  day: number;
  dateFormatted: string;
  timestamp: number;
} {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let y = yearHint || 2026;
  let mName = monthHint || 'Aug';
  let mIndex = months.findIndex((m) => m.toLowerCase() === mName.toLowerCase());
  if (mIndex === -1) mIndex = 7; // default Aug
  let d = dayHint || 1;

  if (dateStr && typeof dateStr === 'string') {
    const trimmed = dateStr.trim();
    if (trimmed.includes('/') || trimmed.includes('-')) {
      const sep = trimmed.includes('/') ? '/' : '-';
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
        mName = months[mIndex] || mName;
      }
    }
  }

  const dateObj = new Date(y, mIndex, d);
  const isoFormatted = `${y}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  
  return {
    year: y,
    month: mName,
    day: d,
    dateFormatted: isoFormatted,
    timestamp: dateObj.getTime(),
  };
}

/**
 * Normalizes column header keys regardless of case, extra whitespace, or slight differences
 */
function findValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const key of possibleKeys) {
    const directMatch = row[key];
    if (directMatch !== undefined && directMatch !== null && directMatch !== '') {
      return directMatch;
    }
    const cleanTarget = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = rowKeys.find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget
    );
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
      return row[matchedKey];
    }
  }
  return '';
}

export function parseSalesCsv(csvText: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const records: SaleRecord[] = [];
        const errors: string[] = [];
        const yearsSet = new Set<number>();
        const channelsSet = new Set<string>();
        const categoriesSet = new Set<string>();
        const zonesSet = new Set<string>();

        results.data.forEach((row, idx) => {
          try {
            const rawYear = cleanNumber(findValue(row, ['Year', 'year', 'Yr']));
            const rawMonth = String(findValue(row, ['Month', 'month', 'Mo']) || '').trim();
            const rawWeek = String(findValue(row, ['Week', 'week', 'Wk']) || '').trim();
            const rawDay = cleanNumber(findValue(row, ['Day', 'day', 'D']));
            const rawDate = String(findValue(row, ['Date', 'date', 'Order Date', 'Sale Date']) || '').trim();

            const dateInfo = parseDateComponents(rawDate, rawYear || 2026, rawMonth || 'Aug', rawDay || 1);

            const orderNumber = String(
              findValue(row, ['Order Number', 'Order No', 'Order Id', 'Order_Number', 'order_id']) || `ORD-${idx + 1}`
            ).trim();

            const customerName = String(
              findValue(row, ['Customer name', 'Customer Name', 'Customer', 'Buyer Name']) || 'Valued Customer'
            ).trim();

            const barCode = String(findValue(row, ['Bar Code', 'Barcode', 'SKU', 'Item Code']) || '').trim();
            const productName = String(
              findValue(row, ['Product name', 'Product Name', 'Item Name', 'Title', 'Product']) || 'General Item'
            ).trim();

            const color = String(findValue(row, ['Color', 'Colour', 'Variant']) || 'Standard').trim();
            const category = String(
              findValue(row, ['PRODUCT CATEGORY', 'Product Category', 'Category', 'Item Category']) || 'General'
            ).trim();

            const qty = cleanNumber(findValue(row, ['QTY', 'Qty', 'Quantity', 'Units']), 1);
            const mrp = cleanNumber(findValue(row, ['MRP', 'Mrp', 'Price', 'Unit Price']), 0);
            const mrpValue = cleanNumber(findValue(row, ['MRP Value', 'MRP_Value', 'Total MRP']), qty * mrp);

            const scoobiesMargin = cleanNumber(
              findValue(row, ['Scoobies Margin', 'Margin', 'Gross Margin']),
              0
            );
            const retailersMargin = cleanNumber(
              findValue(row, ['Retailers Margin', 'Retailer Margin', 'Channel Margin']),
              0
            );
            const exGstMargin = cleanNumber(
              findValue(row, ['EX-GST Scoobies Margin', 'Ex-GST Margin', 'Ex GST Margin', 'EX GST']),
              scoobiesMargin * 0.85
            );

            const deliveryPlace = String(
              findValue(row, ['Delivery Place', 'City', 'Location', 'Delivery City']) || 'Unspecified'
            ).trim();

            const state = String(findValue(row, ['State', 'Province', 'Region']) || 'Unassigned').trim();
            const websiteRaw = String(
              findValue(row, ['Website', 'Channel', 'Platform', 'Portal', 'Source']) || 'Direct'
            ).trim();
            const channel = websiteRaw || 'Direct Website';

            const rawStatus = String(findValue(row, ['Status', 'Order Status', 'Delivery Status']) || 'Dispatched').trim();
            let status: 'Dispatched' | 'Return' | 'Cancelled' | 'Other' = 'Dispatched';
            if (rawStatus.toLowerCase().includes('return') || qty < 0) {
              status = 'Return';
            } else if (rawStatus.toLowerCase().includes('cancel')) {
              status = 'Cancelled';
            } else if (rawStatus.toLowerCase().includes('dispatch') || rawStatus.toLowerCase().includes('delivered')) {
              status = 'Dispatched';
            }

            const backToSchool = String(
              findValue(row, ['Back To School', 'Back to School', 'Campaign', 'B2S']) || 'Standard'
            ).trim();

            const zone = String(findValue(row, ['Zone', 'Sales Zone', 'Area']) || 'General').trim();
            
            const saleValue = cleanNumber(
              findValue(row, ['Sale Value', 'Sale_Value', 'Net Sales', 'Sales', 'Total Value']),
              qty < 0 ? -(Math.abs(mrp * qty)) : mrp * qty
            );

            const record: SaleRecord = {
              id: `${orderNumber}-${idx}`,
              year: dateInfo.year,
              month: dateInfo.month,
              week: rawWeek || `Week ${Math.ceil(dateInfo.day / 7)}`,
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
            if (record.year) yearsSet.add(record.year);
            if (record.channel) channelsSet.add(record.channel);
            if (record.category) categoriesSet.add(record.category);
            if (record.zone) zonesSet.add(record.zone);
          } catch (err: any) {
            errors.push(`Row ${idx + 1}: ${err.message}`);
          }
        });

        resolve({
          records,
          errors,
          totalRows: records.length,
          years: Array.from(yearsSet).sort((a, b) => b - a),
          channels: Array.from(channelsSet).sort(),
          categories: Array.from(categoriesSet).sort(),
          zones: Array.from(zonesSet).sort(),
        });
      },
    });
  });
}
