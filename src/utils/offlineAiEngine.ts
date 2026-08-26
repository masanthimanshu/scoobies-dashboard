import { DistilledSalesContext } from "./aiContextDistiller";

/**
 * Deterministic offline intelligence engine.
 * Generates an instant, executive-grade strategic brief directly from client-side math.
 */
export function generateOfflineStrategicBrief(
  ctx: DistilledSalesContext,
): string {
  const { kpis, channels, topMarginDrivers, returnWatchlist, trends } = ctx;

  const topChannel = channels[0];
  const marginHealth =
    kpis.scoobiesMarginPct >= 40
      ? "Strong (Above 40% benchmark)"
      : kpis.scoobiesMarginPct >= 30
        ? "Moderate (30-40% range)"
        : "Under pressure (Below 30%)";

  const targetProgress =
    kpis.targetGap <= 0
      ? "✅ Target Quota Achieved!"
      : `₹${kpis.targetGap.toLocaleString()} gap remaining (${kpis.targetProgressPct}% achieved)`;

  const worstReturnItem =
    returnWatchlist.length > 0 ? returnWatchlist[0] : null;

  return `### 📊 EXECUTIVE STRATEGIC BRIEF (OFFLINE DIAGNOSTIC)

#### 1. Performance Overview
- **Net Revenue**: **₹${kpis.netSales.toLocaleString()}** fulfilled across **${kpis.totalOrders.toLocaleString()} orders** (${kpis.totalUnits.toLocaleString()} units sold).
- **Margin Health**: **₹${kpis.scoobiesMargin.toLocaleString()}** (${kpis.scoobiesMarginPct}% margin) — *${marginHealth}*.
- **Quota Progress**: **${targetProgress}** against the ₹${kpis.salesTarget.toLocaleString()} goal.
- **Average Order Value (AOV)**: **₹${kpis.averageOrderValue.toLocaleString()}**.

#### 2. Channel Economics & Dominance
- **Primary Driver**: **${topChannel ? topChannel.name : "N/A"}** contributes **${topChannel ? topChannel.sharePct : 0}%** of net revenue (₹${topChannel ? topChannel.netSales.toLocaleString() : 0}) with an AOV of ₹${topChannel ? topChannel.aov.toLocaleString() : 0}.
- **Channel Margins**: ${channels.map((c) => `**${c.name}** (₹${c.margin.toLocaleString()} margin, ${c.returnRatePct}% returns)`).join(" | ")}.

#### 3. Top Profit Multipliers
${topMarginDrivers
  .slice(0, 3)
  .map(
    (p, i) =>
      `${i + 1}. **${p.name}** — ₹${p.margin.toLocaleString()} margin (${p.units} units sold)`,
  )
  .join("\n")}

#### 4. Critical Margin Leaks & Return Risks
${
  worstReturnItem
    ? `⚠️ **High Return Alert**: **${worstReturnItem.name}** has a **${worstReturnItem.returnRatePct}% return rate** (${worstReturnItem.returnUnits} units returned), causing a **₹${worstReturnItem.returnedValue.toLocaleString()}** refund leak.`
    : `✅ Overall return rate is healthy at **${kpis.returnRateQtyPct}%** with no severe product anomalies.`
}

#### 5. Demand Velocity
- Peak velocity observed during **${trends.peakPeriod.label}** (₹${trends.peakPeriod.sales.toLocaleString()}).
- Average sales velocity is **₹${trends.averagePeriodSales.toLocaleString()}** per active period.`;
}
