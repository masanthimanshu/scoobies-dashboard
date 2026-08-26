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

export function filterRecords(
  records: SaleRecord[],
  filters: FilterState,
): SaleRecord[] {
  return records.filter((r) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        r.productName.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.channel.toLowerCase().includes(q) ||
        r.deliveryPlace.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Year
    if (
      filters.years &&
      filters.years.length > 0 &&
      !filters.years.includes("ALL")
    ) {
      if (!filters.years.map(String).includes(String(r.year))) {
        return false;
      }
    } else if (
      filters.year &&
      filters.year !== "ALL" &&
      String(r.year) !== String(filters.year)
    ) {
      return false;
    }

    // Month
    if (
      filters.months &&
      filters.months.length > 0 &&
      !filters.months.includes("ALL")
    ) {
      const monthMatch = filters.months.some(
        (m) => m.toLowerCase() === r.month.toLowerCase(),
      );
      if (!monthMatch) return false;
    } else if (
      filters.month &&
      filters.month !== "ALL" &&
      r.month.toLowerCase() !== filters.month.toLowerCase()
    ) {
      return false;
    }

    // Week
    if (
      filters.weeks &&
      filters.weeks.length > 0 &&
      !filters.weeks.includes("ALL")
    ) {
      const weekMatch = filters.weeks.some(
        (w) => w.toLowerCase() === r.week.toLowerCase(),
      );
      if (!weekMatch) return false;
    } else if (
      filters.week &&
      filters.week !== "ALL" &&
      r.week.toLowerCase() !== filters.week.toLowerCase()
    ) {
      return false;
    }

    // Custom Dates
    if (filters.startDate && r.dateStr < filters.startDate) {
      return false;
    }
    if (filters.endDate && r.dateStr > filters.endDate) {
      return false;
    }

    // Channel
    if (filters.channels.length > 0 && !filters.channels.includes(r.channel)) {
      return false;
    }

    // Category
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(r.category)
    ) {
      return false;
    }

    // Zone
    if (filters.zones.length > 0 && !filters.zones.includes(r.zone)) {
      return false;
    }

    // State
    if (filters.states.length > 0 && !filters.states.includes(r.state)) {
      return false;
    }

    // Status
    if (filters.status === "Dispatched" && r.status !== "Dispatched") {
      return false;
    }
    if (filters.status === "Return" && r.status !== "Return") {
      return false;
    }

    // Campaign
    if (filters.campaign === "B2S") {
      const isB2S =
        r.backToSchool.toLowerCase().includes("back to school") ||
        r.backToSchool.toLowerCase().includes("b2s");
      if (!isB2S) return false;
    } else if (filters.campaign === "NON_B2S") {
      const isB2S =
        r.backToSchool.toLowerCase().includes("back to school") ||
        r.backToSchool.toLowerCase().includes("b2s");
      if (isB2S) return false;
    }

    // Value Range
    if (
      filters.minSaleValue !== undefined &&
      Math.abs(r.saleValue) < filters.minSaleValue
    ) {
      return false;
    }
    if (
      filters.maxSaleValue !== undefined &&
      Math.abs(r.saleValue) > filters.maxSaleValue
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Shared helper to extract normalized transaction values and return status from a SaleRecord.
 * Consolidates duplicated calculations across metrics, aggregation, and UI views.
 */
export function getRecordMetrics(r: SaleRecord) {
  const isReturn = r.status === "Return" || r.qty < 0 || r.saleValue < 0;
  const val = Math.abs(r.saleValue || r.mrp * r.qty || 0);
  const qty = Math.abs(r.qty || 1);
  const margin = r.scoobiesMargin || 0;
  const exGstMargin = r.exGstMargin || 0;
  return { isReturn, val, qty, margin, exGstMargin };
}

/**
 * Shared helper to calculate percentage safely.
 */
export function computeSharePct(
  val: number,
  total: number,
  decimals = 1,
): number {
  if (!total || total <= 0) return 0;
  return Number(((Math.max(0, val) / total) * 100).toFixed(decimals));
}

export function computeDashboardMetrics(
  records: SaleRecord[],
): DashboardMetrics {
  let totalGrossSales = 0;
  let totalNetSales = 0;
  let totalReturnedSales = 0;
  let totalUnitsSold = 0; // net units
  let totalGrossUnits = 0;
  let totalReturnedUnits = 0;
  let totalScoobiesMargin = 0;
  let totalExGstMargin = 0;
  let retailersMarginTotal = 0;
  let b2sNetSales = 0;

  const ordersSet = new Set<string>();

  records.forEach((r) => {
    ordersSet.add(r.orderNumber);

    const { isReturn, val, qty } = getRecordMetrics(r);

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

    const isB2S =
      r.backToSchool.toLowerCase().includes("back to school") ||
      r.backToSchool.toLowerCase().includes("b2s");
    if (isB2S) {
      b2sNetSales += isReturn ? -val : val;
    }
  });

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

  return {
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
}

export function computeTimeSeries(
  records: SaleRecord[],
  granularity: "daily" | "weekly" | "monthly" | "yearly" = "daily",
): TimeSeriesPoint[] {
  const map = new Map<
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

  records.forEach((r) => {
    let key = r.dateStr; // default YYYY-MM-DD
    let label = r.dateStr;

    if (granularity === "weekly") {
      key = `${r.year}-${r.month}-${r.week}`;
      label = `${r.month} ${r.week}`;
    } else if (granularity === "monthly") {
      key = `${r.year}-${r.month}`;
      label = `${r.month} ${r.year}`;
    } else if (granularity === "yearly") {
      key = `${r.year}`;
      label = `${r.year}`;
    }

    const { isReturn, val, qty } = getRecordMetrics(r);

    const curr = map.get(key) || {
      gross: 0,
      net: 0,
      returns: 0,
      qty: 0,
      count: 0,
      margin: 0,
      ts: r.timestamp,
      label,
    };

    if (isReturn) {
      curr.returns += val;
      curr.net -= val;
      curr.qty -= qty;
    } else {
      curr.gross += val;
      curr.net += val;
      curr.qty += qty;
    }
    curr.count += 1;
    curr.margin += r.scoobiesMargin;

    map.set(key, curr);
  });

  const sortedKeys = Array.from(map.keys()).sort((a, b) => {
    const itemA = map.get(a)!;
    const itemB = map.get(b)!;
    return itemA.ts - itemB.ts;
  });

  return sortedKeys.map((key) => {
    const data = map.get(key)!;
    return {
      date: key,
      label: data.label,
      timestamp: data.ts,
      grossSales: Math.round(data.gross),
      netSales: Math.round(data.net),
      returns: Math.round(data.returns),
      netQty: data.qty,
      orderCount: data.count,
      margin: Math.round(data.margin),
    };
  });
}

export function computeChannelMetrics(
  records: SaleRecord[],
  totalNetSales: number,
): ChannelMetric[] {
  const map = new Map<
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

  records.forEach((r) => {
    const ch = r.channel || "Direct";
    const { isReturn, val, qty } = getRecordMetrics(r);

    const curr = map.get(ch) || {
      gross: 0,
      net: 0,
      returns: 0,
      orders: new Set<string>(),
      units: 0,
      returnUnits: 0,
      margin: 0,
    };

    curr.orders.add(r.orderNumber);

    if (isReturn) {
      curr.returns += val;
      curr.net -= val;
      curr.returnUnits += qty;
      curr.units -= qty;
    } else {
      curr.gross += val;
      curr.net += val;
      curr.units += qty;
    }
    curr.margin += r.scoobiesMargin;

    map.set(ch, curr);
  });

  return Array.from(map.entries())
    .map(([channel, data]) => {
      const orderCount = data.orders.size;
      const avgOrderValue = orderCount > 0 ? data.net / orderCount : 0;
      const totalAttempted = data.units + data.returnUnits * 2;
      const returnRate =
        totalAttempted > 0
          ? (data.returnUnits / (data.units + data.returnUnits)) * 100
          : 0;
      const sharePct = computeSharePct(data.net, totalNetSales);

      return {
        channel,
        grossSales: Math.round(data.gross),
        netSales: Math.round(data.net),
        returns: Math.round(data.returns),
        orderCount,
        units: data.units,
        returnUnits: data.returnUnits,
        returnRate: Math.max(0, returnRate),
        avgOrderValue: Math.round(avgOrderValue),
        margin: Math.round(data.margin),
        sharePct,
      };
    })
    .sort((a, b) => b.netSales - a.netSales);
}

export function computeCategoryMetrics(
  records: SaleRecord[],
  totalNetSales: number,
): CategoryMetric[] {
  const map = new Map<
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

  records.forEach((r) => {
    const cat = r.category || "OTHER";
    const { isReturn, val, qty } = getRecordMetrics(r);

    const curr = map.get(cat) || {
      gross: 0,
      net: 0,
      returns: 0,
      units: 0,
      returnUnits: 0,
      orders: new Set<string>(),
      margin: 0,
    };

    curr.orders.add(r.orderNumber);

    if (isReturn) {
      curr.returns += val;
      curr.net -= val;
      curr.units -= qty;
      curr.returnUnits += qty;
    } else {
      curr.gross += val;
      curr.net += val;
      curr.units += qty;
    }
    curr.margin += r.scoobiesMargin;

    map.set(cat, curr);
  });

  return Array.from(map.entries())
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
}

export function computeProductMetrics(
  records: SaleRecord[],
  totalNetSales: number = 0,
): ProductMetric[] {
  const map = new Map<
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

  records.forEach((r) => {
    const name = r.productName;
    const { isReturn, val, qty } = getRecordMetrics(r);
    const ch = r.channel ? r.channel.trim() : "Direct";

    const curr = map.get(name) || {
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

    if (ch) {
      curr.channels.add(ch);
    }

    if (isReturn) {
      curr.returns += val;
      curr.net -= val;
      curr.returnUnits += qty;
      curr.units -= qty;
      if (ch) {
        curr.returnChannels.add(ch);
      }
    } else {
      curr.gross += val;
      curr.net += val;
      curr.units += qty;
    }
    curr.margin += r.scoobiesMargin;

    map.set(name, curr);
  });

  return Array.from(map.entries())
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
}

export function computeGeoMetrics(
  records: SaleRecord[],
  type: "zone" | "state" | "city",
  totalNetSales: number,
): GeoMetric[] {
  const map = new Map<
    string,
    { sales: number; orders: Set<string>; units: number }
  >();

  records.forEach((r) => {
    let key = r.zone;
    if (type === "state") key = r.state || "Unassigned";
    if (type === "city") key = r.deliveryPlace || "Unassigned";

    const { isReturn, val, qty } = getRecordMetrics(r);

    const curr = map.get(key) || {
      sales: 0,
      orders: new Set<string>(),
      units: 0,
    };

    curr.orders.add(r.orderNumber);
    curr.sales += isReturn ? -val : val;
    curr.units += isReturn ? -qty : qty;

    map.set(key, curr);
  });

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      sales: Math.round(data.sales),
      orders: data.orders.size,
      units: data.units,
      sharePct: computeSharePct(data.sales, totalNetSales),
    }))
    .sort((a, b) => b.sales - a.sales);
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
  const curr = map.get(key) || {
    label,
    profit: 0,
    netSales: 0,
    orders: new Set<string>(),
  };
  curr.netSales += isReturn ? -val : val;
  curr.profit += profit;
  if (orderNumber) curr.orders.add(orderNumber);
  map.set(key, curr);
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
    .sort((a, b) => (b.profit !== a.profit ? b.profit - a.profit : b.netSales - a.netSales));

  if (sorted.length > 0 && sorted[0].profit > 0) {
    const top = sorted[0];
    const marginPctStr =
      top.marginPct > 0 ? ` (${top.marginPct.toFixed(1)}% margin)` : "";
    return {
      type: "positive",
      title: `Most Profitable ${periodType}: ${top.label}`,
      description: `Delivered ₹${Math.round(top.profit).toLocaleString()} in profit${marginPctStr} on ₹${Math.round(top.netSales).toLocaleString()} net sales across ${top.orderCount} orders.`,
      metric: `₹${Math.round(top.profit).toLocaleString()} Profit`,
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

    records.forEach((r) => {
      const { isReturn, val } = getRecordMetrics(r);
      const profitVal = r.scoobiesMargin || 0;

      // Month
      let monthName = r.month || "";
      if (!monthName && r.dateStr) {
        const d = new Date(r.dateStr);
        if (!isNaN(d.getTime())) {
          monthName = d.toLocaleString("default", { month: "long" });
        }
      }
      if (!monthName) monthName = "August";
      const yr =
        r.year || (r.timestamp ? new Date(r.timestamp).getFullYear() : 2026);
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
      const weekName = r.week || `Week ${Math.ceil(r.day / 7)}`;
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
    });

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
      description: `Generated ₹${topCh.netSales.toLocaleString()} in net revenue (${topCh.sharePct.toFixed(1)}% of total) across ${topCh.orderCount} orders.`,
      metric: `₹${topCh.netSales.toLocaleString()}`,
    });
  }

  // Margin Efficiency
  if (metrics.totalNetSales > 0) {
    const marginPct = metrics.marginPercentage.toFixed(1);
    insights.push({
      type: metrics.marginPercentage > 40 ? "positive" : "neutral",
      title: `Gross Margin at ${marginPct}%`,
      description: `Scoobies total margin generated is ₹${Math.round(metrics.totalScoobiesMargin).toLocaleString()} (Ex-GST: ₹${Math.round(metrics.totalExGstMargin).toLocaleString()}).`,
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
      description: `${worst.returnUnits} units returned (${worst.returnRate}% return rate), resulting in ₹${worst.returns.toLocaleString()} refunded value.`,
      metric: `${worst.returnRate}% Return Rate`,
    });
  } else if (metrics.returnRateQtyPct > 0) {
    insights.push({
      type: metrics.returnRateQtyPct > 10 ? "warning" : "positive",
      title: `Overall Return Rate: ${metrics.returnRateQtyPct.toFixed(1)}%`,
      description: `${metrics.totalReturnedUnits} returned units vs ${metrics.totalGrossUnits} dispatched units. Total return value: ₹${Math.round(metrics.totalReturnedSales).toLocaleString()}.`,
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
      metric: `₹${topZone.sales.toLocaleString()}`,
    });
  }

  // Back To School Campaign
  if (metrics.b2sNetSales > 0) {
    insights.push({
      type: "highlight",
      title: `Back To School Campaign`,
      description: `Contributed ₹${Math.round(metrics.b2sNetSales).toLocaleString()} (${metrics.b2sSalesPct.toFixed(1)}% of total net sales).`,
      metric: `${metrics.b2sSalesPct.toFixed(1)}%`,
    });
  }

  return insights;
}
