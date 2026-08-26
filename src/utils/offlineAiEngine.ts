import { DistilledSalesContext } from "./aiContextDistiller";
import { formatCurrency, formatNumber, formatPercent } from "./formatters";

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
      : `${formatCurrency(kpis.targetGap)} gap remaining (${formatPercent(kpis.targetProgressPct)} achieved)`;

  const worstReturnItem =
    returnWatchlist.length > 0 ? returnWatchlist[0] : null;

  return `### 📊 EXECUTIVE STRATEGIC BRIEF (OFFLINE DIAGNOSTIC)

#### 1. Performance Overview
- **Net Revenue**: **${formatCurrency(kpis.netSales)}** fulfilled across **${formatNumber(kpis.totalOrders)} orders** (${formatNumber(kpis.totalUnits)} units sold).
- **Margin Health**: **${formatCurrency(kpis.scoobiesMargin)}** (${formatPercent(kpis.scoobiesMarginPct)} margin) — *${marginHealth}*.
- **Quota Progress**: **${targetProgress}** against the ${formatCurrency(kpis.salesTarget)} goal.
- **Average Order Value (AOV)**: **${formatCurrency(kpis.averageOrderValue)}**.

#### 2. Channel Economics & Dominance
- **Primary Driver**: **${topChannel ? topChannel.name : "N/A"}** contributes **${topChannel ? formatPercent(topChannel.sharePct) : "0%"}** of net revenue (${topChannel ? formatCurrency(topChannel.netSales) : "₹0"}) with an AOV of ${topChannel ? formatCurrency(topChannel.aov) : "₹0"}.
- **Channel Margins**: ${channels.map((c) => `**${c.name}** (${formatCurrency(c.margin)} margin, ${formatPercent(c.returnRatePct)} returns)`).join(" | ")}.

#### 3. Top Profit Multipliers
${topMarginDrivers
  .slice(0, 3)
  .map(
    (p, i) =>
      `${i + 1}. **${p.name}** — ${formatCurrency(p.margin)} margin (${formatNumber(p.units)} units sold)`,
  )
  .join("\n")}

#### 4. Critical Margin Leaks & Return Risks
${
  worstReturnItem
    ? `⚠️ **High Return Alert**: **${worstReturnItem.name}** has a **${formatPercent(worstReturnItem.returnRatePct)} return rate** (${formatNumber(worstReturnItem.returnUnits)} units returned), causing a **${formatCurrency(worstReturnItem.returnedValue)}** refund leak.`
    : `✅ Overall return rate is healthy at **${formatPercent(kpis.returnRateQtyPct)}** with no severe product anomalies.`
}

#### 5. Demand Velocity
- Peak velocity observed during **${trends.peakPeriod.label}** (${formatCurrency(trends.peakPeriod.sales)}).
- Average sales velocity is **${formatCurrency(trends.averagePeriodSales)}** per active period.`;
}
