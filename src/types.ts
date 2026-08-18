export interface RawSaleRecord {
  Year?: string | number;
  Month?: string;
  Week?: string;
  Day?: string | number;
  Date?: string;
  'Order Number'?: string;
  'Customer name'?: string;
  'Bar Code'?: string;
  'Product name'?: string;
  Color?: string;
  'PRODUCT CATEGORY'?: string;
  QTY?: string | number;
  MRP?: string | number;
  'MRP Value'?: string | number;
  'Scoobies Margin'?: string | number;
  'Retailers Margin'?: string | number;
  'EX-GST Scoobies Margin'?: string | number;
  'Delivery Place'?: string;
  State?: string;
  Website?: string;
  Status?: string;
  'Received Payment'?: string;
  'Back To School'?: string;
  Zone?: string;
  'Sale Value'?: string | number;
  [key: string]: any;
}

export interface SaleRecord {
  id: string;
  year: number;
  month: string;
  week: string;
  day: number;
  dateStr: string;
  timestamp: number; // For sorting & time range filtering
  orderNumber: string;
  customerName: string;
  barCode: string;
  productName: string;
  color: string;
  category: string;
  qty: number;
  mrp: number;
  mrpValue: number;
  scoobiesMargin: number;
  retailersMargin: number;
  exGstMargin: number;
  deliveryPlace: string;
  state: string;
  channel: string; // Website / Marketplace (Amazon, Blinkit, etc.)
  status: 'Dispatched' | 'Return' | 'Cancelled' | 'Other';
  backToSchool: string;
  zone: string;
  saleValue: number;
}

export interface FilterState {
  search: string;
  year: string; // 'ALL' or specific year like '2026'
  month: string; // 'ALL' or specific month
  dateRangePreset: 'ALL' | '7D' | '15D' | '30D' | 'MTD' | 'YTD' | 'CUSTOM';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  channels: string[]; // empty = all
  categories: string[]; // empty = all
  zones: string[]; // empty = all
  states: string[]; // empty = all
  status: 'ALL' | 'Dispatched' | 'Return';
  campaign: 'ALL' | 'B2S' | 'NON_B2S';
  minSaleValue?: number;
  maxSaleValue?: number;
}

export interface DashboardMetrics {
  totalGrossSales: number;
  totalNetSales: number;
  totalReturnedSales: number;
  totalOrders: number;
  totalUnitsSold: number; // Net Qty
  totalGrossUnits: number;
  totalReturnedUnits: number;
  returnRateQtyPct: number;
  returnRateValPct: number;
  averageOrderValue: number;
  totalScoobiesMargin: number;
  totalExGstMargin: number;
  marginPercentage: number;
  retailersMarginTotal: number;
  b2sNetSales: number;
  b2sSalesPct: number;
  uniqueCustomers: number;
  uniqueProducts: number;
  uniqueStates: number;
  topChannel: { name: string; sales: number; share: number };
  topCategory: { name: string; sales: number; share: number };
  topProduct: { name: string; sales: number; units: number };
  topZone: { name: string; sales: number; share: number };
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  rawDate: string;
  timestamp: number;
  grossSales: number;
  netSales: number;
  returns: number;
  netQty: number;
  orderCount: number;
  margin: number;
}

export interface ChannelMetric {
  channel: string;
  grossSales: number;
  netSales: number;
  returns: number;
  orderCount: number;
  units: number;
  returnUnits: number;
  returnRate: number;
  avgOrderValue: number;
  margin: number;
  sharePct: number;
}

export interface CategoryMetric {
  category: string;
  sales: number;
  grossSales: number;
  returns: number;
  units: number;
  orders: number;
  margin: number;
  sharePct: number;
}

export interface ProductMetric {
  productName: string;
  barCode: string;
  category: string;
  netSales: number;
  grossSales: number;
  returns: number;
  units: number;
  returnUnits: number;
  returnRate: number;
  mrp: number;
  margin: number;
}

export interface GeoMetric {
  name: string; // state or city or zone
  sales: number;
  orders: number;
  units: number;
  sharePct: number;
}

export interface ExecutiveInsight {
  type: 'positive' | 'warning' | 'neutral' | 'highlight';
  title: string;
  description: string;
  metric?: string;
  iconName?: string;
}
