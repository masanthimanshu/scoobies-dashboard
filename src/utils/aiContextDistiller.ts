import {
  SaleRecord,
  DashboardMetrics,
  ChannelMetric,
  CategoryMetric,
  ProductMetric,
  GeoMetric,
  TimeSeriesPoint,
  FilterState,
} from "../types";
import { formatCurrency, formatNumber, formatPercent } from "./formatters";

export interface DistilledSalesContext {
  datasetInfo: {
    fileName: string;
    totalRecords: number;
    activeFiltersDescription: string;
    dateSpan: string;
  };
  kpis: {
    netSales: number;
    grossSales: number;
    returnsValue: number;
    returnRateValPct: number;
    returnRateQtyPct: number;
    totalOrders: number;
    totalUnits: number;
    totalGrossUnits: number;
    totalReturnedUnits: number;
    averageOrderValue: number;
    scoobiesMargin: number;
    scoobiesMarginPct: number;
    exGstMargin: number;
    retailersMargin: number;
    salesTarget: number;
    targetProgressPct: number;
    targetGap: number;
    b2sContributionPct: number;
    b2sNetSales: number;
  };
  channels: Array<{
    name: string;
    netSales: number;
    sharePct: number;
    orderCount: number;
    aov: number;
    returnRatePct: number;
    margin: number;
  }>;
  categories: Array<{
    name: string;
    sales: number;
    sharePct: number;
    units: number;
    margin: number;
    marginPct: number;
    returnRatePct?: number;
  }>;
  topVolumeProducts: Array<{
    name: string;
    category: string;
    sales: number;
    units: number;
    margin: number;
    returnRatePct: number;
  }>;
  topMarginDrivers: Array<{
    name: string;
    category: string;
    margin: number;
    sales: number;
    units: number;
  }>;
  returnWatchlist: Array<{
    name: string;
    category: string;
    returnUnits: number;
    returnRatePct: number;
    returnedValue: number;
    channels?: string[];
  }>;
  regions: {
    topZones: Array<{
      name: string;
      sales: number;
      sharePct: number;
      orders: number;
    }>;
    topStates: Array<{
      name: string;
      sales: number;
      sharePct: number;
      orders: number;
    }>;
  };
  trends: {
    peakPeriod: { label: string; sales: number; orders: number };
    troughPeriod: { label: string; sales: number; orders: number };
    totalPeriods: number;
    averagePeriodSales: number;
  };
}

/**
 * Distills active filtered sales records and pre-calculated dashboard metrics into
 * an executive-grade prompt payload (~1,200 tokens) without blowing context memory.
 */
export function buildDistilledContext(
  records: SaleRecord[],
  metrics: DashboardMetrics,
  channelMetrics: ChannelMetric[],
  categoryMetrics: CategoryMetric[],
  productMetrics: ProductMetric[],
  zoneMetrics: GeoMetric[],
  stateMetrics: GeoMetric[],
  timeSeries: TimeSeriesPoint[],
  salesTarget: number,
  filters: FilterState,
  fileName: string,
): DistilledSalesContext {
  // Format filter summary
  const activeFilters: string[] = [];
  if (filters.search) activeFilters.push(`Search: "${filters.search}"`);
  if (
    filters.years &&
    filters.years.length > 0 &&
    !filters.years.includes("ALL")
  ) {
    activeFilters.push(`Years: ${filters.years.join(", ")}`);
  } else if (filters.year && filters.year !== "ALL") {
    activeFilters.push(`Year: ${filters.year}`);
  }
  if (
    filters.months &&
    filters.months.length > 0 &&
    !filters.months.includes("ALL")
  ) {
    activeFilters.push(`Months: ${filters.months.join(", ")}`);
  } else if (filters.month && filters.month !== "ALL") {
    activeFilters.push(`Month: ${filters.month}`);
  }
  if (
    filters.weeks &&
    filters.weeks.length > 0 &&
    !filters.weeks.includes("ALL")
  ) {
    activeFilters.push(`Weeks: ${filters.weeks.join(", ")}`);
  } else if (filters.week && filters.week !== "ALL") {
    activeFilters.push(`Week: ${filters.week}`);
  }
  if (filters.channels && filters.channels.length > 0) {
    activeFilters.push(`Channels: ${filters.channels.join(", ")}`);
  }
  if (filters.categories && filters.categories.length > 0) {
    activeFilters.push(`Categories: ${filters.categories.join(", ")}`);
  }
  if (filters.status && filters.status !== "ALL") {
    activeFilters.push(`Status: ${filters.status}`);
  }
  if (filters.campaign && filters.campaign !== "ALL") {
    activeFilters.push(`Campaign: ${filters.campaign}`);
  }

  // Fast linear O(N) Date span computation (avoids expensive full array clone & sort)
  let minDate = "";
  let maxDate = "";
  if (records.length > 0) {
    minDate = records[0].dateStr;
    maxDate = records[0].dateStr;
    for (let i = 1; i < records.length; i++) {
      const d = records[i].dateStr;
      if (d && d < minDate) minDate = d;
      if (d && d > maxDate) maxDate = d;
    }
  }
  const dateSpan =
    minDate && maxDate ? `${minDate} to ${maxDate}` : "Active Dataset Range";

  // Target metrics
  const targetGap = Math.max(0, salesTarget - metrics.totalScoobiesMargin);
  const targetProgressPct =
    salesTarget > 0 ? (metrics.totalScoobiesMargin / salesTarget) * 100 : 0;

  // Channel metrics
  const channels = channelMetrics.map((c) => ({
    name: c.channel,
    netSales: Math.round(c.netSales),
    sharePct: Number(c.sharePct.toFixed(1)),
    orderCount: c.orderCount,
    aov: Math.round(c.avgOrderValue),
    returnRatePct: Number(c.returnRate.toFixed(1)),
    margin: Math.round(c.margin),
  }));

  // Category metrics
  const categories = categoryMetrics.slice(0, 8).map((cat) => ({
    name: cat.category,
    sales: Math.round(cat.sales),
    sharePct: Number(cat.sharePct.toFixed(1)),
    units: cat.units,
    margin: Math.round(cat.margin),
    marginPct:
      cat.sales > 0 ? Number(((cat.margin / cat.sales) * 100).toFixed(1)) : 0,
    returnRatePct:
      cat.returnRate !== undefined
        ? Number(cat.returnRate.toFixed(1))
        : undefined,
  }));

  // Top volume products (Pareto top 6)
  const topVolumeProducts = productMetrics.slice(0, 6).map((p) => ({
    name: p.productName,
    category: p.category,
    sales: Math.round(p.netSales),
    units: p.units,
    margin: Math.round(p.margin),
    returnRatePct: Number(p.returnRate.toFixed(1)),
  }));

  // Top margin drivers
  const topMarginDrivers = [...productMetrics]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 6)
    .map((p) => ({
      name: p.productName,
      category: p.category,
      margin: Math.round(p.margin),
      sales: Math.round(p.netSales),
      units: p.units,
    }));

  // High return watchlist (Return rate > 10% with at least 2 returned units)
  const returnWatchlist = productMetrics
    .filter((p) => p.returnUnits >= 2 && p.returnRate > 10)
    .sort((a, b) => b.returns - a.returns || b.returnRate - a.returnRate)
    .slice(0, 6)
    .map((p) => ({
      name: p.productName,
      category: p.category,
      returnUnits: p.returnUnits,
      returnRatePct: Number(p.returnRate.toFixed(1)),
      returnedValue: Math.round(p.returns),
      channels: p.returnChannels || (p.channel ? [p.channel] : undefined),
    }));

  // Geographic top zones & states
  const topZones = zoneMetrics.slice(0, 5).map((z) => ({
    name: z.name,
    sales: Math.round(z.sales),
    sharePct: Number(z.sharePct.toFixed(1)),
    orders: z.orders,
  }));

  const topStates = stateMetrics.slice(0, 5).map((s) => ({
    name: s.name,
    sales: Math.round(s.sales),
    sharePct: Number(s.sharePct.toFixed(1)),
    orders: s.orders,
  }));

  // Trend analysis (peak and lowest periods)
  let peakPeriod = { label: "N/A", sales: 0, orders: 0 };
  let troughPeriod = { label: "N/A", sales: Infinity, orders: 0 };
  let totalPeriodSales = 0;

  if (timeSeries.length > 0) {
    for (let i = 0; i < timeSeries.length; i++) {
      const pt = timeSeries[i];
      totalPeriodSales += pt.netSales;
      if (pt.netSales > peakPeriod.sales) {
        peakPeriod = {
          label: pt.label,
          sales: Math.round(pt.netSales),
          orders: pt.orderCount,
        };
      }
      if (pt.netSales < troughPeriod.sales && pt.netSales > 0) {
        troughPeriod = {
          label: pt.label,
          sales: Math.round(pt.netSales),
          orders: pt.orderCount,
        };
      }
    }
    if (troughPeriod.sales === Infinity) {
      troughPeriod = { label: "N/A", sales: 0, orders: 0 };
    }
  }

  const averagePeriodSales =
    timeSeries.length > 0
      ? Math.round(totalPeriodSales / timeSeries.length)
      : 0;

  return {
    datasetInfo: {
      fileName,
      totalRecords: records.length,
      activeFiltersDescription:
        activeFilters.length > 0
          ? activeFilters.join(" | ")
          : "All transactions (No active filters)",
      dateSpan,
    },
    kpis: {
      netSales: Math.round(metrics.totalNetSales),
      grossSales: Math.round(metrics.totalGrossSales),
      returnsValue: Math.round(metrics.totalReturnedSales),
      returnRateValPct: Number(metrics.returnRateValPct.toFixed(1)),
      returnRateQtyPct: Number(metrics.returnRateQtyPct.toFixed(1)),
      totalOrders: metrics.totalOrders,
      totalUnits: metrics.totalUnitsSold,
      totalGrossUnits: metrics.totalGrossUnits,
      totalReturnedUnits: metrics.totalReturnedUnits,
      averageOrderValue: Math.round(metrics.averageOrderValue),
      scoobiesMargin: Math.round(metrics.totalScoobiesMargin),
      scoobiesMarginPct: Number(metrics.marginPercentage.toFixed(1)),
      exGstMargin: Math.round(metrics.totalExGstMargin),
      retailersMargin: Math.round(metrics.retailersMarginTotal),
      salesTarget,
      targetProgressPct: Number(targetProgressPct.toFixed(1)),
      targetGap: Math.round(targetGap),
      b2sContributionPct: Number(metrics.b2sSalesPct.toFixed(1)),
      b2sNetSales: Math.round(metrics.b2sNetSales),
    },
    channels,
    categories,
    topVolumeProducts,
    topMarginDrivers,
    returnWatchlist,
    regions: {
      topZones,
      topStates,
    },
    trends: {
      peakPeriod,
      troughPeriod,
      totalPeriods: timeSeries.length,
      averagePeriodSales,
    },
  };
}

/**
 * Converts distilled context into a clean, markdown-formatted structured briefing
 * for the LLM prompt. Uses ~1,000–1,400 tokens total.
 */
export function formatDistilledContextToMarkdown(
  ctx: DistilledSalesContext,
): string {
  const {
    datasetInfo,
    kpis,
    channels,
    categories,
    topVolumeProducts,
    topMarginDrivers,
    returnWatchlist,
    regions,
    trends,
  } = ctx;

  return `### CURRENT SALES DATASET CONTEXT
- **Dataset File**: ${datasetInfo.fileName} (${formatNumber(datasetInfo.totalRecords)} active transaction rows)
- **Active Filters**: ${datasetInfo.activeFiltersDescription}
- **Date Span**: ${datasetInfo.dateSpan}

### 1. FINANCIAL & OPERATIONAL KPIS
- **Net Revenue**: ${formatCurrency(kpis.netSales)} (Gross: ${formatCurrency(kpis.grossSales)})
- **Refunds / Returns**: ${formatCurrency(kpis.returnsValue)} (${formatPercent(kpis.returnRateValPct)} of value, ${formatPercent(kpis.returnRateQtyPct)} of quantity; ${formatNumber(kpis.totalReturnedUnits)} returned units)
- **Total Orders Fulfilled**: ${formatNumber(kpis.totalOrders)} | **Net Units Sold**: ${formatNumber(kpis.totalUnits)}
- **Average Order Value (AOV)**: ${formatCurrency(kpis.averageOrderValue)}
- **Scoobies Margin**: ${formatCurrency(kpis.scoobiesMargin)} (${formatPercent(kpis.scoobiesMarginPct)} margin rate)
- **Ex-GST Margin**: ${formatCurrency(kpis.exGstMargin)} | **Retailers Margin**: ${formatCurrency(kpis.retailersMargin)}
- **Margin Quota Target**: ${formatCurrency(kpis.salesTarget)} (Achieved: ${formatPercent(kpis.targetProgressPct)}, Quota Gap: ${formatCurrency(kpis.targetGap)})
- **Back-to-School (B2S) Contribution**: ${formatCurrency(kpis.b2sNetSales)} (${formatPercent(kpis.b2sContributionPct)} of total net revenue)

### 2. SALES CHANNELS ECONOMICS
${channels
  .map(
    (c) =>
      `- **${c.name}**: ${formatCurrency(c.netSales)} net sales (${formatPercent(c.sharePct)} share) | ${formatNumber(c.orderCount)} orders | AOV: ${formatCurrency(c.aov)} | Margin: ${formatCurrency(c.margin)} | Return Rate: ${formatPercent(c.returnRatePct)}`,
  )
  .join("\n")}

### 3. TOP REVENUE PRODUCT LEADERS
${topVolumeProducts
  .map(
    (p, i) =>
      `${i + 1}. **${p.name}** (${p.category}) — Net Sales: ${formatCurrency(p.sales)} (${formatNumber(p.units)} units) | Margin: ${formatCurrency(p.margin)} | Return Rate: ${formatPercent(p.returnRatePct)}`,
  )
  .join("\n")}

### 4. TOP PROFIT MARGIN DRIVERS
${topMarginDrivers
  .map(
    (p, i) =>
      `${i + 1}. **${p.name}** (${p.category}) — Profit Margin: ${formatCurrency(p.margin)} on ${formatCurrency(p.sales)} sales (${formatNumber(p.units)} units)`,
  )
  .join("\n")}

### 5. HIGH-RISK RETURN OFFENDERS & MARGIN LEAKS
${
  returnWatchlist.length > 0
    ? returnWatchlist
        .map(
          (r, i) =>
            `${i + 1}. **${r.name}** (${r.category}) — ${r.returnUnits} units returned (${formatPercent(r.returnRatePct)} return rate) | Lost Value: ${formatCurrency(r.returnedValue)}${
              r.channels && r.channels.length > 0
                ? ` (Channels: ${r.channels.join(", ")})`
                : ""
            }`,
        )
        .join("\n")
    : "No high-return outliers detected (return rates are within acceptable benchmarks < 10%)."
}

### 6. CATEGORY PERFORMANCE MATRIX
${categories
  .map(
    (cat) =>
      `- **${cat.name}**: ${formatCurrency(cat.sales)} (${formatPercent(cat.sharePct)} share, ${formatNumber(cat.units)} units) | Margin: ${formatCurrency(cat.margin)} (${formatPercent(cat.marginPct)} margin)`,
  )
  .join("\n")}

### 7. GEOGRAPHIC DEMAND HUBS
- **Top Zones**: ${regions.topZones.map((z) => `${z.name} (${formatCurrency(z.sales)}, ${formatPercent(z.sharePct)})`).join(", ")}
- **Top States**: ${regions.topStates.map((s) => `${s.name} (${formatCurrency(s.sales)}, ${formatPercent(s.sharePct)})`).join(", ")}

### 8. TEMPORAL VELOCITY & MOMENTUM
- **Peak Period**: ${trends.peakPeriod.label} (${formatCurrency(trends.peakPeriod.sales)} across ${formatNumber(trends.peakPeriod.orders)} orders)
- **Trough Period**: ${trends.troughPeriod.label} (${formatCurrency(trends.troughPeriod.sales)})
- **Average Period Velocity**: ${formatCurrency(trends.averagePeriodSales)}`;
}

/**
 * Targeted Semantic Slicing (RAG-Lite):
 * If a user asks about a specific entity (channel, product, category, state),
 * extracts relevant deeper details without blowing context.
 */
export function extractTargetedMicroSlice(
  query: string,
  records: SaleRecord[],
  distilled: DistilledSalesContext,
): string {
  const q = query.toLowerCase();
  const matchedSlices: string[] = [];

  // Check if asking about a specific channel
  distilled.channels.forEach((ch) => {
    if (q.includes(ch.name.toLowerCase())) {
      const channelRecords = records.filter(
        (r) => r.channel.toLowerCase() === ch.name.toLowerCase(),
      );
      const topItems = new Map<
        string,
        { units: number; sales: number; returns: number }
      >();

      for (let i = 0; i < channelRecords.length; i++) {
        const r = channelRecords[i];
        let item = topItems.get(r.productName);
        if (!item) {
          item = { units: 0, sales: 0, returns: 0 };
          topItems.set(r.productName, item);
        }
        if (r.status === "Return") {
          item.returns += r.qty;
        } else {
          item.units += r.qty;
          item.sales += Number.isFinite(r.mrpValue)
            ? r.mrpValue
            : (r.saleValue || (r.mrp * r.qty));
        }
      }

      const topItemEntries = Array.from(topItems.entries())
        .sort((a, b) => b[1].sales - a[1].sales)
        .slice(0, 5);

      matchedSlices.push(
        `#### DEEP-DIVE SLICE: ${ch.name.toUpperCase()} CHANNEL
- Total Channel Orders: ${formatNumber(ch.orderCount)} | Net Revenue: ${formatCurrency(ch.netSales)} | Return Rate: ${formatPercent(ch.returnRatePct)}
- Top 5 SKUs on ${ch.name}:
${topItemEntries.map(([name, data]) => `  • ${name}: ${formatCurrency(data.sales)} (${formatNumber(data.units)} sold, ${formatNumber(data.returns)} returned)`).join("\n")}`,
      );
    }
  });

  return matchedSlices.join("\n\n");
}
