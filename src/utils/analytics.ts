import {
  SaleRecord,
  FilterState,
  DashboardMetrics,
  TimeSeriesPoint,
  ChannelMetric,
  CategoryMetric,
  ProductMetric,
  GeoMetric,
  ExecutiveInsight,
} from "../types";
import { isB2SCampaign, formatCurrency } from "./formatters";

/**
 * High-performance records filter. Pre-compiles filter sets and lowercased lookups
 * outside the loop to achieve O(N) linear filtering with zero redundant allocations.
 */
export function filterRecords(
  records: SaleRecord[],
  filters: FilterState,
): SaleRecord[] {
  // Fast path: if no filters are active, return records immediately
  const hasActiveFilters =
    (filters.years &&
      filters.years.length > 0 &&
      !filters.years.includes("ALL")) ||
    (filters.year && filters.year !== "ALL") ||
    (filters.months &&
      filters.months.length > 0 &&
      !filters.months.includes("ALL")) ||
    (filters.month && filters.month !== "ALL") ||
    (filters.weeks &&
      filters.weeks.length > 0 &&
      !filters.weeks.includes("ALL")) ||
    (filters.week && filters.week !== "ALL") ||
    (filters.channels && filters.channels.length > 0) ||
    (filters.categories && filters.categories.length > 0) ||
    (filters.zones && filters.zones.length > 0) ||
    (filters.states && filters.states.length > 0) ||
    Boolean(filters.status && filters.status !== "ALL") ||
    Boolean(filters.campaign && filters.campaign !== "ALL") ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    filters.minSaleValue !== undefined ||
    filters.maxSaleValue !== undefined ||
    Boolean(filters.search && filters.search.trim());

  if (!hasActiveFilters) {
    return records;
  }

  // Pre-compile multi-select lookup sets (O(1) lookups)
  const yearSet =
    filters.years && filters.years.length > 0 && !filters.years.includes("ALL")
      ? new Set(filters.years.map(String))
      : null;

  const monthSet =
    filters.months &&
    filters.months.length > 0 &&
    !filters.months.includes("ALL")
      ? new Set(filters.months.map((m) => m.toLowerCase()))
      : null;

  const cleanWeekKey = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

  const weekSet =
    filters.weeks && filters.weeks.length > 0 && !filters.weeks.includes("ALL")
      ? new Set(filters.weeks.map(cleanWeekKey))
      : null;

  const channelSet =
    filters.channels && filters.channels.length > 0
      ? new Set(filters.channels)
      : null;

  const categorySet =
    filters.categories && filters.categories.length > 0
      ? new Set(filters.categories)
      : null;

  const zoneSet =
    filters.zones && filters.zones.length > 0 ? new Set(filters.zones) : null;

  const stateSet =
    filters.states && filters.states.length > 0
      ? new Set(filters.states)
      : null;

  // Pre-calculate single-value filter constants
  const singleYearStr =
    filters.year && filters.year !== "ALL" ? String(filters.year) : null;
  const singleMonthLower =
    filters.month && filters.month !== "ALL"
      ? filters.month.toLowerCase()
      : null;
  const singleWeekClean =
    filters.week && filters.week !== "ALL" ? cleanWeekKey(filters.week) : null;
  const searchQuery = filters.search ? filters.search.trim().toLowerCase() : "";
  const startDate = filters.startDate || "";
  const endDate = filters.endDate || "";
  const statusFilter = filters.status;
  const campaignFilter = filters.campaign;
  const minSale = filters.minSaleValue;
  const maxSale = filters.maxSaleValue;

  return records.filter((r) => {
    // 1. Status Filter (Fastest early-exit check)
    if (statusFilter === "Dispatched" && r.status !== "Dispatched")
      return false;
    if (statusFilter === "Return" && r.status !== "Return") return false;

    // 2. Year Filter
    if (yearSet) {
      if (!yearSet.has(String(r.year))) return false;
    } else if (singleYearStr && String(r.year) !== singleYearStr) {
      return false;
    }

    // 3. Month Filter
    if (monthSet) {
      if (!monthSet.has(r.month.toLowerCase())) return false;
    } else if (singleMonthLower && r.month.toLowerCase() !== singleMonthLower) {
      return false;
    }

    // 4. Week Filter (resilient to spacing and formatting e.g. "Week 1" vs "Week1")
    if (weekSet || singleWeekClean) {
      const rWeekClean = cleanWeekKey(r.week);
      if (weekSet) {
        if (!weekSet.has(rWeekClean)) return false;
      } else if (singleWeekClean && rWeekClean !== singleWeekClean) {
        return false;
      }
    }

    // 5. Channel Filter
    if (channelSet && !channelSet.has(r.channel)) return false;

    // 6. Category Filter
    if (categorySet && !categorySet.has(r.category)) return false;

    // 7. Zone Filter
    if (zoneSet && !zoneSet.has(r.zone)) return false;

    // 8. State Filter
    if (stateSet && !stateSet.has(r.state)) return false;

    // 9. Campaign Filter
    if (campaignFilter === "B2S" && !isB2SCampaign(r.backToSchool))
      return false;
    if (campaignFilter === "NON_B2S" && isB2SCampaign(r.backToSchool))
      return false;

    // 10. Custom Date Window
    if (startDate && r.dateStr < startDate) return false;
    if (endDate && r.dateStr > endDate) return false;

    // 11. Sale Value Range
    if (minSale !== undefined || maxSale !== undefined) {
      const { val } = getRecordMetrics(r);
      if (minSale !== undefined && val < minSale) return false;
      if (maxSale !== undefined && val > maxSale) return false;
    }

    // 12. Search Query (Executed last only for candidates that pass all discrete filters)
    if (searchQuery) {
      const match =
        r.productName.toLowerCase().includes(searchQuery) ||
        r.orderNumber.toLowerCase().includes(searchQuery) ||
        r.customerName.toLowerCase().includes(searchQuery) ||
        r.category.toLowerCase().includes(searchQuery) ||
        r.channel.toLowerCase().includes(searchQuery) ||
        r.deliveryPlace.toLowerCase().includes(searchQuery) ||
        r.state.toLowerCase().includes(searchQuery);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Shared helper to extract normalized transaction values and return status from a SaleRecord.
 * Consolidates duplicated calculations across metrics, aggregation, and UI views.
 * Prioritizes MRP Value from the sheet (fallback to mrp * qty) as requested.
 */
export function getRecordMetrics(r: SaleRecord) {
  const isReturn =
    r.status === "Return" ||
    r.qty < 0 ||
    (Number.isFinite(r.mrpValue) && r.mrpValue < 0) ||
    (Number.isFinite(r.saleValue) && r.saleValue < 0);
  const val = Math.abs(
    Number.isFinite(r.mrpValue)
      ? r.mrpValue
      : Number.isFinite(r.mrp) && Number.isFinite(r.qty)
      ? r.mrp * r.qty
      : Number.isFinite(r.saleValue)
      ? r.saleValue
      : 0,
  );
  const qty = Math.abs(Number.isFinite(r.qty) ? r.qty : 1);
  const margin = Number.isFinite(r.scoobiesMargin) ? r.scoobiesMargin : 0;
  const exGstMargin = Number.isFinite(r.exGstMargin) ? r.exGstMargin : 0;
  return { isReturn, val, qty, margin, exGstMargin };
}

/**
 * Shared helper to calculate percentage safely with decimal formatting.
 */
export function computeSharePct(
  val: number,
  total: number,
  decimals = 1,
): number {
  if (!total || total <= 0) return 0;
  return Number(((Math.max(0, val) / total) * 100).toFixed(decimals));
}

export interface AllAnalyticsResult {
  metrics: DashboardMetrics;
  timeSeriesData: TimeSeriesPoint[];
  channelMetrics: ChannelMetric[];
  categoryMetrics: CategoryMetric[];
  productMetrics: ProductMetric[];
  zoneMetrics: GeoMetric[];
  stateMetrics: GeoMetric[];
  cityMetrics: GeoMetric[];
}

/**
 * High-performance unified analytics aggregator.
 * Computes dashboard KPIs, timeseries, channels, categories, products,
 * and geographic distributions in a SINGLE linear O(N) pass.
 */
export function computeAllAnalytics(
  records: SaleRecord[],
  granularity: "daily" | "weekly" | "monthly" | "yearly" = "daily",
): AllAnalyticsResult {
  let totalGrossSales = 0;
  let totalNetSales = 0;
  let totalReturnedSales = 0;
  let totalUnitsSold = 0;
  let totalGrossUnits = 0;
  let totalReturnedUnits = 0;
  let totalScoobiesMargin = 0;
  let totalExGstMargin = 0;
  let retailersMarginTotal = 0;
  let b2sNetSales = 0;

  const ordersSet = new Set<string>();

  // TimeSeries map
  const timeSeriesMap = new Map<
    string,
    {
      gross: number;
      net: number;
      returns: number;
      qty: number;
      count: number;
      margin: number;
      ts: number;
      label: string;
    }
  >();

  // Channel map
  const channelMap = new Map<
    string,
    {
      gross: number;
      net: number;
      returns: number;
      orders: Set<string>;
      units: number;
      returnUnits: number;
      margin: number;
    }
  >();

  // Category map
  const categoryMap = new Map<
    string,
    {
      gross: number;
      net: number;
      returns: number;
      units: number;
      returnUnits: number;
      orders: Set<string>;
      margin: number;
    }
  >();

  // Product map
  const productMap = new Map<
    string,
    {
      barCode: string;
      category: string;
      channels: Set<string>;
      returnChannels: Set<string>;
      gross: number;
      net: number;
      returns: number;
      units: number;
      returnUnits: number;
      mrp: number;
      margin: number;
    }
  >();

  // Geo maps
  const zoneMap = new Map<
    string,
    { sales: number; orders: Set<string>; units: number }
  >();
  const stateMap = new Map<
    string,
    { sales: number; orders: Set<string>; units: number }
  >();
  const cityMap = new Map<
    string,
    { sales: number; orders: Set<string>; units: number }
  >();

  const len = records.length;
  for (let i = 0; i < len; i++) {
    const r = records[i];
    ordersSet.add(r.orderNumber);

    const { isReturn, val, qty } = getRecordMetrics(r);

    // 1. Dashboard Metrics
    if (isReturn) {
      totalReturnedSales += val;
      totalReturnedUnits += qty;
      totalNetSales -= val;
      totalUnitsSold -= qty;
    } else {
      totalGrossSales += val;
      totalGrossUnits += qty;
      totalNetSales += val;
      totalUnitsSold += qty;
    }

    totalScoobiesMargin += r.scoobiesMargin;
    totalExGstMargin += r.exGstMargin;
    retailersMarginTotal += r.retailersMargin;

    if (isB2SCampaign(r.backToSchool)) {
      b2sNetSales += isReturn ? -val : val;
    }

    // 2. TimeSeries
    let timeKey = r.dateStr;
    let timeLabel = r.dateStr;
    if (granularity === "weekly") {
      timeKey = `${r.year}-${r.month}-${r.week}`;
      timeLabel = `${r.month} ${r.week}`;
    } else if (granularity === "monthly") {
      timeKey = `${r.year}-${r.month}`;
      timeLabel = `${r.month} ${r.year}`;
    } else if (granularity === "yearly") {
      timeKey = `${r.year}`;
      timeLabel = `${r.year}`;
    }

    let tsCurr = timeSeriesMap.get(timeKey);
    if (!tsCurr) {
      tsCurr = {
        gross: 0,
        net: 0,
        returns: 0,
        qty: 0,
        count: 0,
        margin: 0,
        ts: r.timestamp,
        label: timeLabel,
      };
      timeSeriesMap.set(timeKey, tsCurr);
    }
    if (isReturn) {
      tsCurr.returns += val;
      tsCurr.net -= val;
      tsCurr.qty -= qty;
    } else {
      tsCurr.gross += val;
      tsCurr.net += val;
      tsCurr.qty += qty;
    }
    tsCurr.count += 1;
    tsCurr.margin += r.scoobiesMargin;

    // 3. Channel
    const ch = r.channel || "Direct";
    let chCurr = channelMap.get(ch);
    if (!chCurr) {
      chCurr = {
        gross: 0,
        net: 0,
        returns: 0,
        orders: new Set<string>(),
        units: 0,
        returnUnits: 0,
        margin: 0,
      };
      channelMap.set(ch, chCurr);
    }
    chCurr.orders.add(r.orderNumber);
    if (isReturn) {
      chCurr.returns += val;
      chCurr.net -= val;
      chCurr.returnUnits += qty;
      chCurr.units -= qty;
    } else {
      chCurr.gross += val;
      chCurr.net += val;
      chCurr.units += qty;
    }
    chCurr.margin += r.scoobiesMargin;

    // 4. Category
    const cat = r.category || "OTHER";
    let catCurr = categoryMap.get(cat);
    if (!catCurr) {
      catCurr = {
        gross: 0,
        net: 0,
        returns: 0,
        units: 0,
        returnUnits: 0,
        orders: new Set<string>(),
        margin: 0,
      };
      categoryMap.set(cat, catCurr);
    }
    catCurr.orders.add(r.orderNumber);
    if (isReturn) {
      catCurr.returns += val;
      catCurr.net -= val;
      catCurr.units -= qty;
      catCurr.returnUnits += qty;
    } else {
      catCurr.gross += val;
      catCurr.net += val;
      catCurr.units += qty;
    }
    catCurr.margin += r.scoobiesMargin;

    // 5. Product
    const pName = r.productName;
    const cleanCh = r.channel ? r.channel.trim() : "Direct";
    let prodCurr = productMap.get(pName);
    if (!prodCurr) {
      prodCurr = {
        barCode: r.barCode,
        category: r.category,
        channels: new Set<string>(),
        returnChannels: new Set<string>(),
        gross: 0,
        net: 0,
        returns: 0,
        units: 0,
        returnUnits: 0,
        mrp: r.mrp,
        margin: 0,
      };
      productMap.set(pName, prodCurr);
    }
    if (cleanCh) prodCurr.channels.add(cleanCh);
    if (isReturn) {
      prodCurr.returns += val;
      prodCurr.net -= val;
      prodCurr.returnUnits += qty;
      prodCurr.units -= qty;
      if (cleanCh) prodCurr.returnChannels.add(cleanCh);
    } else {
      prodCurr.gross += val;
      prodCurr.net += val;
      prodCurr.units += qty;
    }
    prodCurr.margin += r.scoobiesMargin;

    // 6. Geo (Zone, State, City)
    const zoneKey = r.zone || "Unassigned";
    const stateKey = r.state || "Unassigned";
    const cityKey = r.deliveryPlace || "Unassigned";

    let zCurr = zoneMap.get(zoneKey);
    if (!zCurr) {
      zCurr = { sales: 0, orders: new Set<string>(), units: 0 };
      zoneMap.set(zoneKey, zCurr);
    }
    zCurr.orders.add(r.orderNumber);
    zCurr.sales += isReturn ? -val : val;
    zCurr.units += isReturn ? -qty : qty;

    let sCurr = stateMap.get(stateKey);
    if (!sCurr) {
      sCurr = { sales: 0, orders: new Set<string>(), units: 0 };
      stateMap.set(stateKey, sCurr);
    }
    sCurr.orders.add(r.orderNumber);
    sCurr.sales += isReturn ? -val : val;
    sCurr.units += isReturn ? -qty : qty;

    let cCurr = cityMap.get(cityKey);
    if (!cCurr) {
      cCurr = { sales: 0, orders: new Set<string>(), units: 0 };
      cityMap.set(cityKey, cCurr);
    }
    cCurr.orders.add(r.orderNumber);
    cCurr.sales += isReturn ? -val : val;
    cCurr.units += isReturn ? -qty : qty;
  }

  const totalOrders = ordersSet.size;
  const returnRateQtyPct =
    totalGrossUnits > 0 ? (totalReturnedUnits / totalGrossUnits) * 100 : 0;
  const returnRateValPct =
    totalGrossSales > 0 ? (totalReturnedSales / totalGrossSales) * 100 : 0;
  const averageOrderValue = totalOrders > 0 ? totalNetSales / totalOrders : 0;
  const marginPercentage =
    totalNetSales > 0 ? (totalScoobiesMargin / totalNetSales) * 100 : 0;
  const b2sSalesPct =
    totalNetSales > 0 ? (Math.max(0, b2sNetSales) / totalNetSales) * 100 : 0;

  const metrics: DashboardMetrics = {
    totalGrossSales,
    totalNetSales,
    totalReturnedSales,
    totalOrders,
    totalUnitsSold,
    totalGrossUnits,
    totalReturnedUnits,
    returnRateQtyPct,
    returnRateValPct,
    averageOrderValue,
    totalScoobiesMargin,
    totalExGstMargin,
    marginPercentage,
    retailersMarginTotal,
    b2sNetSales,
    b2sSalesPct,
  };

  const timeSeriesData: TimeSeriesPoint[] = Array.from(timeSeriesMap.entries())
    .sort((a, b) => a[1].ts - b[1].ts)
    .map(([key, data]) => ({
      date: key,
      label: data.label,
      timestamp: data.ts,
      grossSales: Math.round(data.gross),
      netSales: Math.round(data.net),
      returns: Math.round(data.returns),
      netQty: data.qty,
      orderCount: data.count,
      margin: Math.round(data.margin),
    }));

  const channelMetrics: ChannelMetric[] = Array.from(channelMap.entries())
    .map(([channel, data]) => {
      const orderCount = data.orders.size;
      const avgOrderValue = orderCount > 0 ? data.net / orderCount : 0;
      const totalAttempted = data.units + data.returnUnits;
      const returnRate =
        totalAttempted > 0 ? (data.returnUnits / totalAttempted) * 100 : 0;
      const sharePct = computeSharePct(data.net, totalNetSales);

      return {
        channel,
        grossSales: Math.round(data.gross),
        netSales: Math.round(data.net),
        returns: Math.round(data.returns),
        orderCount,
        units: data.units,
        returnUnits: data.returnUnits,
        returnRate: Math.max(0, Number(returnRate.toFixed(1))),
        avgOrderValue: Math.round(avgOrderValue),
        margin: Math.round(data.margin),
        sharePct,
      };
    })
    .sort((a, b) => b.netSales - a.netSales);

  const categoryMetrics: CategoryMetric[] = Array.from(categoryMap.entries())
    .map(([category, data]) => {
      const sharePct = computeSharePct(data.net, totalNetSales);
      const totalAttempted = data.units + data.returnUnits;
      const returnRate =
        totalAttempted > 0 ? (data.returnUnits / totalAttempted) * 100 : 0;
      return {
        category,
        sales: Math.round(data.net),
        grossSales: Math.round(data.gross),
        returns: Math.round(data.returns),
        units: data.units,
        returnUnits: data.returnUnits,
        returnRate: Number(returnRate.toFixed(1)),
        orders: data.orders.size,
        margin: Math.round(data.margin),
        sharePct,
      };
    })
    .sort((a, b) => b.sales - a.sales);

  const productMetrics: ProductMetric[] = Array.from(productMap.entries())
    .map(([productName, data]) => {
      const grossUnits = data.units + data.returnUnits;
      const returnRate =
        grossUnits > 0 ? (data.returnUnits / grossUnits) * 100 : 0;
      const sharePct = computeSharePct(data.net, totalNetSales);
      const channelArray = Array.from(data.channels);
      const returnChannelArray = Array.from(data.returnChannels);
      const primaryChannel =
        returnChannelArray.length > 0
          ? returnChannelArray.join(", ")
          : channelArray.length > 0
            ? channelArray.join(", ")
            : "Direct";

      return {
        productName,
        barCode: data.barCode,
        category: data.category,
        channel: primaryChannel,
        channels: channelArray,
        returnChannels: returnChannelArray,
        netSales: Math.round(data.net),
        grossSales: Math.round(data.gross),
        returns: Math.round(data.returns),
        units: data.units,
        returnUnits: data.returnUnits,
        returnRate: Math.round(returnRate * 10) / 10,
        mrp: data.mrp,
        margin: Math.round(data.margin),
        sharePct,
      };
    })
    .sort((a, b) => b.netSales - a.netSales);

  const zoneMetrics: GeoMetric[] = Array.from(zoneMap.entries())
    .map(([name, data]) => ({
      name,
      sales: Math.round(data.sales),
      orders: data.orders.size,
      units: data.units,
      sharePct: computeSharePct(data.sales, totalNetSales),
    }))
    .sort((a, b) => b.sales - a.sales);

  const stateMetrics: GeoMetric[] = Array.from(stateMap.entries())
    .map(([name, data]) => ({
      name,
      sales: Math.round(data.sales),
      orders: data.orders.size,
      units: data.units,
      sharePct: computeSharePct(data.sales, totalNetSales),
    }))
    .sort((a, b) => b.sales - a.sales);

  const cityMetrics: GeoMetric[] = Array.from(cityMap.entries())
    .map(([name, data]) => ({
      name,
      sales: Math.round(data.sales),
      orders: data.orders.size,
      units: data.units,
      sharePct: computeSharePct(data.sales, totalNetSales),
    }))
    .sort((a, b) => b.sales - a.sales);

  return {
    metrics,
    timeSeriesData,
    channelMetrics,
    categoryMetrics,
    productMetrics,
    zoneMetrics,
    stateMetrics,
    cityMetrics,
  };
}

interface PeriodAggregate {
  label: string;
  profit: number;
  netSales: number;
  orders: Set<string>;
}

function updatePeriodMap(
  map: Map<string, PeriodAggregate>,
  key: string,
  label: string,
  isReturn: boolean,
  val: number,
  profit: number,
  orderNumber: string,
) {
  let curr = map.get(key);
  if (!curr) {
    curr = {
      label,
      profit: 0,
      netSales: 0,
      orders: new Set<string>(),
    };
    map.set(key, curr);
  }
  curr.netSales += isReturn ? -val : val;
  curr.profit += profit;
  if (orderNumber) curr.orders.add(orderNumber);
}

function createPeriodInsight(
  periodMap: Map<string, PeriodAggregate>,
  periodType: "Month" | "Week",
): ExecutiveInsight | null {
  const sorted = Array.from(periodMap.values())
    .map((p) => ({
      ...p,
      orderCount: p.orders.size,
      marginPct: p.netSales > 0 ? (p.profit / p.netSales) * 100 : 0,
    }))
    .sort((a, b) =>
      b.profit !== a.profit ? b.profit - a.profit : b.netSales - a.netSales,
    );

  if (sorted.length > 0 && sorted[0].profit > 0) {
    const top = sorted[0];
    const marginPctStr =
      top.marginPct > 0 ? ` (${top.marginPct.toFixed(1)}% margin)` : "";
    return {
      type: "positive",
      title: `Most Profitable ${periodType}: ${top.label}`,
      description: `Delivered ${formatCurrency(top.profit)} in profit${marginPctStr} on ${formatCurrency(top.netSales)} net sales across ${top.orderCount} orders.`,
      metric: `${formatCurrency(top.profit)} Profit`,
    };
  }
  return null;
}

export function generateExecutiveInsights(
  metrics: DashboardMetrics,
  channels: ChannelMetric[],
  products: ProductMetric[],
  zones: GeoMetric[],
  records?: SaleRecord[],
): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];

  // Most Profitable Month & Most Profitable Week
  if (records && records.length > 0) {
    const monthMap = new Map<string, PeriodAggregate>();
    const weekMap = new Map<string, PeriodAggregate>();
    const rLen = records.length;

    for (let i = 0; i < rLen; i++) {
      const r = records[i];
      const { isReturn, val } = getRecordMetrics(r);
      const profitVal = r.scoobiesMargin || 0;

      // Month
      const monthName = r.month || "August";
      const yr = r.year || 2026;
      const monthLabel = `${monthName} ${yr}`;
      const monthKey = `${yr}-${monthName}`;

      updatePeriodMap(
        monthMap,
        monthKey,
        monthLabel,
        isReturn,
        val,
        profitVal,
        r.orderNumber,
      );

      // Week
      const weekName =
        r.week || `Week${Math.min(5, Math.ceil(r.day / 7) || 1)}`;
      const weekLabel = r.month ? `${weekName} (${r.month})` : weekName;
      const weekKey = `${yr}-${r.month || "Aug"}-${weekName}`;

      updatePeriodMap(
        weekMap,
        weekKey,
        weekLabel,
        isReturn,
        val,
        profitVal,
        r.orderNumber,
      );
    }

    const topMonthInsight = createPeriodInsight(monthMap, "Month");
    if (topMonthInsight) insights.push(topMonthInsight);

    const topWeekInsight = createPeriodInsight(weekMap, "Week");
    if (topWeekInsight) insights.push(topWeekInsight);
  }

  // Top Channel Driver
  if (channels.length > 0) {
    const topCh = channels[0];
    insights.push({
      type: "highlight",
      title: `${topCh.channel} is Leading Sales`,
      description: `Generated ${formatCurrency(topCh.netSales)} in net revenue (${topCh.sharePct.toFixed(1)}% of total) across ${topCh.orderCount} orders.`,
      metric: formatCurrency(topCh.netSales),
    });
  }

  // Margin Efficiency
  if (metrics.totalNetSales > 0) {
    const marginPct = metrics.marginPercentage.toFixed(1);
    insights.push({
      type: metrics.marginPercentage > 40 ? "positive" : "neutral",
      title: `Gross Margin at ${marginPct}%`,
      description: `Scoobies total margin generated is ${formatCurrency(metrics.totalScoobiesMargin)} (Ex-GST: ${formatCurrency(metrics.totalExGstMargin)}).`,
      metric: `${marginPct}%`,
    });
  }

  // Return Watchlist
  const highReturnProds = products.filter(
    (p) =>
      p.returnUnits > 0 && p.units + p.returnUnits >= 3 && p.returnRate > 20,
  );
  if (highReturnProds.length > 0) {
    const worst = highReturnProds.sort(
      (a, b) => b.returnRate - a.returnRate,
    )[0];
    insights.push({
      type: "warning",
      title: `High Return Item: ${worst.productName}`,
      description: `${worst.returnUnits} units returned (${worst.returnRate}% return rate), resulting in ${formatCurrency(worst.returns)} refunded value.`,
      metric: `${worst.returnRate}% Return Rate`,
    });
  } else if (metrics.returnRateQtyPct > 0) {
    insights.push({
      type: metrics.returnRateQtyPct > 10 ? "warning" : "positive",
      title: `Overall Return Rate: ${metrics.returnRateQtyPct.toFixed(1)}%`,
      description: `${metrics.totalReturnedUnits} returned units vs ${metrics.totalGrossUnits} dispatched units. Total return value: ${formatCurrency(metrics.totalReturnedSales)}.`,
      metric: `${metrics.returnRateQtyPct.toFixed(1)}%`,
    });
  }

  // Zone Leader
  if (zones.length > 0) {
    const topZone = zones[0];
    insights.push({
      type: "positive",
      title: `Top Geographical Zone: ${topZone.name}`,
      description: `Dominating regional demand with ${topZone.sharePct.toFixed(1)}% of sales and ${topZone.orders} orders fulfilled.`,
      metric: formatCurrency(topZone.sales),
    });
  }

  // Back To School Campaign
  if (metrics.b2sNetSales > 0) {
    insights.push({
      type: "highlight",
      title: `Back To School Campaign`,
      description: `Contributed ${formatCurrency(metrics.b2sNetSales)} (${metrics.b2sSalesPct.toFixed(1)}% of total net sales).`,
      metric: `${metrics.b2sSalesPct.toFixed(1)}%`,
    });
  }

  return insights;
}
