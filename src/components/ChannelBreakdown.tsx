import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Store, ChevronDown, ChevronUp } from "lucide-react";
import { ChannelMetric } from "../types";
import {
  CHART_PALETTE,
  CHART_TOOLTIP_STYLE,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../utils/formatters";

interface ChannelBreakdownProps {
  channels: ChannelMetric[];
}

export const ChannelBreakdown: React.FC<ChannelBreakdownProps> = React.memo(
  ({ channels }) => {
    const [showAll, setShowAll] = useState(false);

    const displayedChannels = useMemo(() => {
      return showAll ? channels : channels.slice(0, 10);
    }, [showAll, channels]);

    const hasMoreThan10 = channels.length > 10;

    const pieData = useMemo(() => {
      return channels
        .filter((c) => c.netSales > 0)
        .slice(0, 8)
        .map((c) => ({
          name: c.channel,
          value: c.netSales,
          share: c.sharePct,
          orders: c.orderCount,
        }));
    }, [channels]);

    return (
      <div className="bg-white border border-[#EBE5D9] rounded-[28px] p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-[#EBE5D9]">
          <div>
            <h3 className="text-base font-extrabold text-[#2D2A26] flex items-center gap-2 tracking-tight">
              <Store className="w-4 h-4 text-[#5F7161]" />
              Channel & Marketplace Performance
            </h3>
            <p className="text-xs text-[#8C8376] font-medium mt-0.5">
              Sales volume, revenue share & return rates across portals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Pie Chart Share */}
          <div className="lg:col-span-5 h-[270px] flex flex-col items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-[#8C8376] text-xs">
                No channel revenue data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(
                      val: unknown,
                      name: unknown,
                      item: { payload?: { share?: number } },
                    ) => {
                      const share = item?.payload?.share;
                      const shareStr =
                        share !== undefined ? ` (${formatPercent(share)})` : "";
                      return [
                        `${formatCurrency(Number(val || 0))}${shareStr}`,
                        String(name || ""),
                      ];
                    }}
                    contentStyle={CHART_TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="text-center text-xs font-bold text-[#433E37] mt-[-10px]">
              Marketplace Revenue Share
            </div>
          </div>

          {/* Detailed Channel Table / Leaderboard */}
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#EBE5D9] text-[#8C8376] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-2.5">Channel</th>
                  <th className="pb-2.5 text-right">Net Revenue</th>
                  <th className="pb-2.5 text-right">Share</th>
                  <th className="pb-2.5 text-right">Orders</th>
                  <th className="pb-2.5 text-right">AOV</th>
                  <th className="pb-2.5 text-right">Return %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EDE5]">
                {displayedChannels.map((ch, idx) => (
                  <tr
                    key={ch.channel}
                    className="hover:bg-[#FAF8F5] transition-colors"
                  >
                    <td className="py-2.5 font-bold text-[#2D2A26] flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CHART_PALETTE[idx % CHART_PALETTE.length],
                        }}
                      />
                      <span className="truncate max-w-[130px]">
                        {ch.channel}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-[#5F7161]">
                      {formatCurrency(ch.netSales)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#AF8260]">
                      {formatPercent(ch.sharePct)}
                    </td>
                    <td className="py-2.5 text-right text-[#433E37] font-semibold">
                      {formatNumber(ch.orderCount)}
                    </td>
                    <td className="py-2.5 text-right text-[#8C8376] font-medium">
                      {formatCurrency(ch.avgOrderValue)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ch.returnRate > 15
                            ? "bg-[#FAF0E6] text-[#AF8260] border border-[#E8D2C2]"
                            : ch.returnRate > 5
                              ? "bg-[#FDF4EB] text-[#E7AB79] border border-[#F5DCBF]"
                              : "bg-[#E9EFEA] text-[#5F7161] border border-[#C5D5C7]"
                        }`}
                      >
                        {formatPercent(ch.returnRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMoreThan10 && (
              <div className="mt-3.5 pt-2.5 border-t border-[#F1EDE5] flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#433E37] bg-[#F9F7F2] hover:bg-[#F1EDE5] border border-[#EBE5D9] rounded-xl transition-colors cursor-pointer"
                >
                  <span>
                    {showAll
                      ? "Show Top 10 Channels"
                      : `View All Channels (${channels.length})`}
                  </span>
                  {showAll ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#8C8376]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#8C8376]" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
