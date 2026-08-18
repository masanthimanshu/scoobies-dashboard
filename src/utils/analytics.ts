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
} from '../types';

export function filterRecords(records: SaleRecord[], filters: FilterState): SaleRecord[] {
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
    if (filters.year !== 'ALL' && String(r.year) !== String(filters.year)) {
      return false;
    }

    // Month
    if (filters.month !== 'ALL' && r.month.toLowerCase() !== filters.month.toLowerCase()) {
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
    if (filters.categories.length > 0 && !filters.categories.includes(r.category)) {
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
    if (filters.status === 'Dispatched' && r.status !== 'Dispatched') {
      return false;
    }
    if (filters.status === 'Return' && r.status !== 'Return') {
      return false;
    }

    // Campaign
    if (filters.campaign === 'B2S') {
      const isB2S = r.backToSchool.toLowerCase().includes('back to school') || r.backToSchool.toLowerCase().includes('b2s');
      if (!isB2S) return false;
    } else if (filters.campaign === 'NON_B2S') {
      const isB2S = r.backToSchool.toLowerCase().includes('back to school') || r.backToSchool.toLowerCase().includes('b2s');
      if (isB2S) return false;
    }

    // Value Range
    if (filters.minSaleValue !== undefined && Math.abs(r.saleValue) < filters.minSaleValue) {
      return false;
    }
    if (filters.maxSaleValue !== undefined && Math.abs(r.saleValue) > filters.maxSaleValue) {
      return false;
    }

    return true;
  });
}

export function computeDashboardMetrics(records: SaleRecord[]): DashboardMetrics {
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
  const customersSet = new Set<string>();
  const productsSet = new Set<string>();
  const statesSet = new Set<string>();

  const channelMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const productMap = new Map<string, { sales: number; units: number }>();
  const zoneMap = new Map<string, number>();

  records.forEach((r) => {
    ordersSet.add(r.orderNumber);
    if (r.customerName) customersSet.add(r.customerName);
    if (r.productName) productsSet.add(r.productName);
    if (r.state) statesSet.add(r.state);

    const isReturn = r.status === 'Return' || r.qty < 0 || r.saleValue < 0;
    const val = Math.abs(r.saleValue || (r.mrp * r.qty));
    const qty = Math.abs(r.qty || 1);

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

    const isB2S = r.backToSchool.toLowerCase().includes('back to school') || r.backToSchool.toLowerCase().includes('b2s');
    if (isB2S) {
      b2sNetSales += isReturn ? -val : val;
    }

    // Channel Aggregation
    channelMap.set(r.channel, (channelMap.get(r.channel) || 0) + (isReturn ? -val : val));

    // Category Aggregation
    categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + (isReturn ? -val : val));

    // Product Aggregation
    const prodCurr = productMap.get(r.productName) || { sales: 0, units: 0 };
    productMap.set(r.productName, {
      sales: prodCurr.sales + (isReturn ? -val : val),
      units: prodCurr.units + (isReturn ? -qty : qty),
    });

    // Zone Aggregation
    zoneMap.set(r.zone, (zoneMap.get(r.zone) || 0) + (isReturn ? -val : val));
  });

  const totalOrders = ordersSet.size;
  const returnRateQtyPct = totalGrossUnits > 0 ? (totalReturnedUnits / totalGrossUnits) * 100 : 0;
  const returnRateValPct = totalGrossSales > 0 ? (totalReturnedSales / totalGrossSales) * 100 : 0;
  const averageOrderValue = totalOrders > 0 ? totalNetSales / totalOrders : 0;
  const marginPercentage = totalNetSales > 0 ? (totalScoobiesMargin / totalNetSales) * 100 : 0;
  const b2sSalesPct = totalNetSales > 0 ? (Math.max(0, b2sNetSales) / totalNetSales) * 100 : 0;

  // Find Tops
  let topChannel = { name: 'N/A', sales: 0, share: 0 };
  channelMap.forEach((sales, name) => {
    if (sales > topChannel.sales) topChannel = { name, sales, share: 0 };
  });
  if (totalNetSales > 0) {
    topChannel.share = (topChannel.sales / totalNetSales) * 100;
  }

  let topCategory = { name: 'N/A', sales: 0, share: 0 };
  categoryMap.forEach((sales, name) => {
    if (sales > topCategory.sales) topCategory = { name, sales, share: 0 };
  });
  if (totalNetSales > 0) {
    topCategory.share = (topCategory.sales / totalNetSales) * 100;
  }

  let topProduct = { name: 'N/A', sales: 0, units: 0 };
  productMap.forEach((data, name) => {
    if (data.sales > topProduct.sales) topProduct = { name, sales: data.sales, units: data.units };
  });

  let topZone = { name: 'N/A', sales: 0, share: 0 };
  zoneMap.forEach((sales, name) => {
    if (sales > topZone.sales) topZone = { name, sales, share: 0 };
  });
  if (totalNetSales > 0) {
    topZone.share = (topZone.sales / totalNetSales) * 100;
  }

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
    uniqueCustomers: customersSet.size,
    uniqueProducts: productsSet.size,
    uniqueStates: statesSet.size,
    topChannel,
    topCategory,
    topProduct,
    topZone,
  };
}

export function computeTimeSeries(
  records: SaleRecord[],
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
): TimeSeriesPoint[] {
  const map = new Map<string, { gross: number; net: number; returns: number; qty: number; count: number; margin: number; ts: number; label: string }>();

  records.forEach((r) => {
    let key = r.dateStr; // default YYYY-MM-DD
    let label = r.dateStr;

    if (granularity === 'weekly') {
      key = `${r.year}-${r.month}-${r.week}`;
      label = `${r.month} ${r.week}`;
    } else if (granularity === 'monthly') {
      key = `${r.year}-${r.month}`;
      label = `${r.month} ${r.year}`;
    } else if (granularity === 'yearly') {
      key = `${r.year}`;
      label = `${r.year}`;
    }

    const isReturn = r.status === 'Return' || r.qty < 0 || r.saleValue < 0;
    const val = Math.abs(r.saleValue || (r.mrp * r.qty));
    const qty = Math.abs(r.qty || 1);

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
      rawDate: key,
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

export function computeChannelMetrics(records: SaleRecord[], totalNetSales: number): ChannelMetric[] {
  const map = new Map<string, { gross: number; net: number; returns: number; orders: Set<string>; units: number; returnUnits: number; margin: number }>();

  records.forEach((r) => {
    const ch = r.channel || 'Direct';
    const isReturn = r.status === 'Return' || r.qty < 0 || r.saleValue < 0;
    const val = Math.abs(r.saleValue || (r.mrp * r.qty));
    const qty = Math.abs(r.qty || 1);

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
      const returnRate = totalAttempted > 0 ? (data.returnUnits / (data.units + data.returnUnits)) * 100 : 0;
      const sharePct = totalNetSales > 0 ? (Math.max(0, data.net) / totalNetSales) * 100 : 0;

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

export function computeCategoryMetrics(records: SaleRecord[], totalNetSales: number): CategoryMetric[] {
  const map = new Map<string, { gross: number; net: number; returns: number; units: number; orders: Set<string>; margin: number }>();

  records.forEach((r) => {
    const cat = r.category || 'OTHER';
    const isReturn = r.status === 'Return' || r.qty < 0 || r.saleValue < 0;
    const val = Math.abs(r.saleValue || (r.mrp * r.qty));
    const qty = Math.abs(r.qty || 1);

    const curr = map.get(cat) || {
      gross: 0,
      net: 0,
      returns: 0,
      units: 0,
      orders: new Set<string>(),
      margin: 0,
    };

    curr.orders.add(r.orderNumber);

    if (isReturn) {
      curr.returns += val;
      curr.net -= val;
      curr.units -= qty;
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
      const sharePct = totalNetSales > 0 ? (Math.max(0, data.net) / totalNetSales) * 100 : 0;
      return {
        category,
        sales: Math.round(data.net),
        grossSales: Math.round(data.gross),
        returns: Math.round(data.returns),
        units: data.units,
        orders: data.orders.size,
        margin: Math.round(data.margin),
        sharePct,
      };
    })
    .sort((a, b) => b.sales - a.sales);
}

export function computeProductMetrics(records: SaleRecord[]): ProductMetric[] {
  const map = new Map<string, { barCode: string; category: string; gross: number; net: number; returns: number; units: number; returnUnits: number; mrp: number; margin: number }>();

  records.forEach((r) => {
    const name = r.productName;
    const isReturn = r.status === 'Return' || r.qty < 0 || r.saleValue < 0;
    const val = Math.abs(r.saleValue || (r.mrp * r.qty));
    const qty = Math.abs(r.qty || 1);

    const curr = map.get(name) || {
      barCode: r.barCode,
      category: r.category,
      gross: 0,
      net: 0,
      returns: 0,
      units: 0,
      returnUnits: 0,
      mrp: r.mrp,
      margin: 0,
    };

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

    map.set(name, curr);
  });

  return Array.from(map.entries())
    .map(([productName, data]) => {
      const grossUnits = data.units + data.returnUnits;
      const returnRate = grossUnits > 0 ? (data.returnUnits / grossUnits) * 100 : 0;
      return {
        productName,
        barCode: data.barCode,
        category: data.category,
        netSales: Math.round(data.net),
        grossSales: Math.round(data.gross),
        returns: Math.round(data.returns),
        units: data.units,
        returnUnits: data.returnUnits,
        returnRate: Math.round(returnRate * 10) / 10,
        mrp: data.mrp,
        margin: Math.round(data.margin),
      };
    })
    .sort((a, b) => b.netSales - a.netSales);
}

export function computeGeoMetrics(records: SaleRecord[], type: 'zone' | 'state' | 'city', totalNetSales: number): GeoMetric[] {
  const map = new Map<string, { sales: number; orders: Set<string>; units: number }>();

  records.forEach((r) => {
    let key = r.zone;
    if (type === 'state') key = r.state || 'Unassigned';
    if (type === 'city') key = r.deliveryPlace || 'Unassigned';

    const isReturn = r.status === 'Return' || r.qty < 0 || r.saleValue < 0;
    const val = Math.abs(r.saleValue || (r.mrp * r.qty));
    const qty = Math.abs(r.qty || 1);

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
      sharePct: totalNetSales > 0 ? (Math.max(0, data.sales) / totalNetSales) * 100 : 0,
    }))
    .sort((a, b) => b.sales - a.sales);
}

export function generateExecutiveInsights(
  metrics: DashboardMetrics,
  channels: ChannelMetric[],
  categories: CategoryMetric[],
  products: ProductMetric[],
  zones: GeoMetric[]
): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];

  // Top Channel Driver
  if (channels.length > 0) {
    const topCh = channels[0];
    insights.push({
      type: 'highlight',
      title: `${topCh.channel} is Leading Sales`,
      description: `Generated ₹${topCh.netSales.toLocaleString()} in net revenue (${topCh.sharePct.toFixed(1)}% of total) across ${topCh.orderCount} orders.`,
      metric: `₹${topCh.netSales.toLocaleString()}`,
      iconName: 'TrendingUp',
    });
  }

  // Margin Efficiency
  if (metrics.totalNetSales > 0) {
    const marginPct = metrics.marginPercentage.toFixed(1);
    insights.push({
      type: metrics.marginPercentage > 40 ? 'positive' : 'neutral',
      title: `Gross Margin at ${marginPct}%`,
      description: `Scoobies total margin generated is ₹${Math.round(metrics.totalScoobiesMargin).toLocaleString()} (Ex-GST: ₹${Math.round(metrics.totalExGstMargin).toLocaleString()}).`,
      metric: `${marginPct}%`,
      iconName: 'Percent',
    });
  }

  // Return Watchlist
  const highReturnProds = products.filter((p) => p.returnUnits > 0 && (p.units + p.returnUnits) >= 3 && p.returnRate > 20);
  if (highReturnProds.length > 0) {
    const worst = highReturnProds.sort((a, b) => b.returnRate - a.returnRate)[0];
    insights.push({
      type: 'warning',
      title: `High Return Item: ${worst.productName}`,
      description: `${worst.returnUnits} units returned (${worst.returnRate}% return rate), resulting in ₹${worst.returns.toLocaleString()} refunded value.`,
      metric: `${worst.returnRate}% Return Rate`,
      iconName: 'AlertTriangle',
    });
  } else if (metrics.returnRateQtyPct > 0) {
    insights.push({
      type: metrics.returnRateQtyPct > 10 ? 'warning' : 'positive',
      title: `Overall Return Rate: ${metrics.returnRateQtyPct.toFixed(1)}%`,
      description: `${metrics.totalReturnedUnits} returned units vs ${metrics.totalGrossUnits} dispatched units. Total return value: ₹${Math.round(metrics.totalReturnedSales).toLocaleString()}.`,
      metric: `${metrics.returnRateQtyPct.toFixed(1)}%`,
      iconName: 'RotateCcw',
    });
  }

  // Zone Leader
  if (zones.length > 0) {
    const topZone = zones[0];
    insights.push({
      type: 'positive',
      title: `Top Geographical Zone: ${topZone.name}`,
      description: `Dominating regional demand with ${topZone.sharePct.toFixed(1)}% of sales and ${topZone.orders} orders fulfilled.`,
      metric: `₹${topZone.sales.toLocaleString()}`,
      iconName: 'MapPin',
    });
  }

  // Back To School Campaign
  if (metrics.b2sNetSales > 0) {
    insights.push({
      type: 'highlight',
      title: `Back To School Campaign`,
      description: `Contributed ₹${Math.round(metrics.b2sNetSales).toLocaleString()} (${metrics.b2sSalesPct.toFixed(1)}% of total net sales).`,
      metric: `${metrics.b2sSalesPct.toFixed(1)}%`,
      iconName: 'Sparkles',
    });
  }

  return insights;
}
