import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Pencil
} from 'lucide-react';
import { ChannelMetric, DashboardMetrics } from '../types';

interface BasketSizeAovProps {
  channels: ChannelMetric[];
  metrics: DashboardMetrics;
}

export const BasketSizeAov: React.FC<BasketSizeAovProps> = ({ channels, metrics }) => {
  const [showAll, setShowAll] = useState(false);
  const [customAov, setCustomAov] = useState<number | null>(null);
  const [isEditingAov, setIsEditingAov] = useState(false);
  const [tempAovInput, setTempAovInput] = useState<string>('');

  if (!channels || channels.length === 0) return null;

  // Filter out invalid/empty channels and sort by AOV
  const validChannels = channels
    .filter((ch) => ch.channel && ch.channel !== '#N/A' && ch.channel !== 'N/A' && ch.orderCount > 0)
    .sort((a, b) => b.avgOrderValue - a.avgOrderValue);

  if (validChannels.length === 0) return null;

  const storeAov = metrics.averageOrderValue || 0;
  const totalOrders = metrics.totalOrders || 1;
  const storeAvgBasket = metrics.totalUnitsSold > 0 && totalOrders > 0 
    ? (metrics.totalUnitsSold / totalOrders) 
    : 0;

  // Effective benchmark AOV (custom target if set, otherwise store average)
  const effectiveBenchmarkAov = (customAov !== null && customAov > 0) ? customAov : storeAov;

  // Channels to display (top 8 by default)
  const displayedChannels = showAll ? validChannels : validChannels.slice(0, 8);
  const hasMoreThan8 = validChannels.length > 8;

  // Find channel with highest AOV and highest Basket size
  const maxAovChannel = validChannels.reduce((max, curr) => curr.avgOrderValue > max.avgOrderValue ? curr : max, validChannels[0]);
  const maxBasketChannel = validChannels.reduce((max, curr) => {
    const currBasket = curr.orderCount > 0 ? curr.units / curr.orderCount : 0;
    const maxBasket = max.orderCount > 0 ? max.units / max.orderCount : 0;
    return currBasket > maxBasket ? curr : max;
  }, validChannels[0]);

  const maxAovValue = Math.max(...validChannels.map(c => c.avgOrderValue), 1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleSaveCustomAov = () => {
    const num = parseFloat(tempAovInput.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      setCustomAov(num);
    }
    setIsEditingAov(false);
  };

  const handleResetAov = () => {
    setCustomAov(null);
    setIsEditingAov(false);
  };

  const openAovEditor = () => {
    setTempAovInput(effectiveBenchmarkAov ? Math.round(effectiveBenchmarkAov).toString() : '');
    setIsEditingAov(true);
  };

  return (
    <div className="bg-white rounded-[28px] p-6 mb-6 shadow-sm border border-[#EBE5D9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#EBE5D9]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#E9EFEA] border border-[#C5D5C7] flex items-center justify-center text-[#5F7161] shrink-0">
            <Receipt className="w-5 h-5 text-[#5F7161]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#2D2A26] tracking-tight">
                Basket Size & AOV
              </h2>
            </div>
            <p className="text-xs text-[#8C8376] font-medium">
              Average Order Value (AOV) and units across sales channels
            </p>
          </div>
        </div>

        {/* Global Benchmark Badges & Custom AOV Setter */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Custom / Store AOV Benchmark Badge with Quick Edit */}
          {!isEditingAov ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9F7F2] border border-[#EBE5D9] text-xs font-semibold text-[#433E37]">
              <span className="text-[#8C8376] font-medium">
                {customAov ? 'Target AOV:' : 'Store AOV:'}
              </span>
              <span className="font-extrabold text-[#2D2A26]">
                {formatCurrency(effectiveBenchmarkAov)}
              </span>
              {customAov ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E9EFEA] text-[#5F7161] border border-[#C5D5C7]">
                  Custom
                </span>
              ) : null}
              <button
                onClick={openAovEditor}
                className="ml-1 p-1 hover:bg-[#EBE5D9] rounded-lg text-[#8C8376] hover:text-[#2D2A26] transition-colors cursor-pointer"
                title="Set custom benchmark AOV"
              >
                <Pencil className="w-3 h-3" />
              </button>
              {customAov && (
                <button
                  onClick={handleResetAov}
                  className="p-1 hover:bg-[#FAF0E6] rounded-lg text-[#AF8260] transition-colors cursor-pointer"
                  title="Reset to default store AOV"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border-2 border-[#5F7161] text-xs shadow-sm">
              <span className="text-[11px] font-bold text-[#8C8376]">Target ₹</span>
              <input
                type="number"
                value={tempAovInput}
                onChange={(e) => setTempAovInput(e.target.value)}
                placeholder="e.g. 1500"
                className="w-20 px-1 py-0.5 text-xs font-black text-[#2D2A26] border-b border-[#C5D5C7] focus:outline-hidden"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCustomAov();
                  if (e.key === 'Escape') setIsEditingAov(false);
                }}
              />
              <button
                onClick={handleSaveCustomAov}
                className="p-1 rounded bg-[#5F7161] text-white hover:bg-[#4E5E50] cursor-pointer"
                title="Save Custom AOV"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsEditingAov(false)}
                className="p-1 rounded bg-[#F1EDE5] text-[#8C8376] hover:text-[#2D2A26] cursor-pointer text-[10px] font-bold"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9F7F2] border border-[#EBE5D9] text-xs font-semibold text-[#433E37]">
            <span className="text-[#8C8376] font-medium">Store Basket Depth:</span>
            <span className="font-extrabold text-[#5F7161]">
              {storeAvgBasket > 0 ? storeAvgBasket.toFixed(1) : '1.0'} units/order
            </span>
          </div>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedChannels.map((ch) => {
          const basketSize = ch.orderCount > 0 ? ch.units / ch.orderCount : 0;
          const aovDiffPct = effectiveBenchmarkAov > 0 
            ? ((ch.avgOrderValue - effectiveBenchmarkAov) / effectiveBenchmarkAov) * 100 
            : 0;
          const isAboveAvg = aovDiffPct >= 0;
          // Progress bar percentage relative to effective benchmark AOV (100% = meeting target/store AOV)
          const targetComparisonPct = effectiveBenchmarkAov > 0
            ? Math.min(100, Math.max(5, (ch.avgOrderValue / effectiveBenchmarkAov) * 100))
            : Math.min(100, Math.max(5, (ch.avgOrderValue / maxAovValue) * 100));
          const achievementRatio = effectiveBenchmarkAov > 0 
            ? (ch.avgOrderValue / effectiveBenchmarkAov) * 100 
            : 100;

          return (
            <div
              key={ch.channel}
              className="bg-[#F9F7F2] hover:bg-[#F1EDE5] transition-all border border-[#EBE5D9] rounded-2xl p-4.5 flex flex-col justify-between group shadow-2xs"
            >
              <div>
                {/* Channel Header & Difference Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-xs font-black text-[#2D2A26] uppercase tracking-wide">
                      {ch.channel}
                    </h3>
                    <span className="text-[10px] text-[#8C8376] font-medium">
                      {ch.orderCount.toLocaleString()} {ch.orderCount === 1 ? 'order' : 'orders'} • {ch.sharePct.toFixed(1)}% rev share
                    </span>
                  </div>
                  
                  {effectiveBenchmarkAov > 0 && (
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        isAboveAvg
                          ? 'bg-[#E9EFEA] text-[#5F7161] border-[#C5D5C7]'
                          : 'bg-[#FAF0E6] text-[#AF8260] border-[#E8D2C2]'
                      }`}
                      title={`Compared against benchmark AOV of ${formatCurrency(effectiveBenchmarkAov)}`}
                    >
                      {isAboveAvg ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>{Math.abs(aovDiffPct).toFixed(0)}% {isAboveAvg ? 'above' : 'below'}</span>
                    </span>
                  )}
                </div>

                {/* Primary Metric: AOV */}
                <div className="mb-3.5 bg-white p-3 rounded-xl border border-[#EBE5D9]/80">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-[#8C8376] uppercase tracking-wider">
                      Average Order Value
                    </span>
                    <span className="text-base font-black text-[#2D2A26] tracking-tight">
                      {formatCurrency(ch.avgOrderValue)}
                    </span>
                  </div>

                  {/* Benchmark / Custom AOV Progress Track */}
                  <div 
                    className="w-full bg-[#EBE5D9]/60 h-2 rounded-full overflow-hidden" 
                    title={`${achievementRatio.toFixed(1)}% of benchmark AOV (${formatCurrency(effectiveBenchmarkAov)})`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAboveAvg ? 'bg-[#5F7161]' : 'bg-[#AF8260]'
                      }`}
                      style={{ width: `${targetComparisonPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-[#8C8376] font-medium">
                    <span>{achievementRatio.toFixed(0)}% of target</span>
                    <span>Target: {formatCurrency(effectiveBenchmarkAov)}</span>
                  </div>
                </div>

                {/* Secondary Metrics: Basket Size & Total Value */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/70 p-2.5 rounded-xl border border-[#EBE5D9]">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#8C8376] uppercase mb-0.5">
                      <Layers className="w-3 h-3 text-[#5F7161]" />
                      <span>Basket Size</span>
                    </div>
                    <div className="text-xs font-extrabold text-[#2D2A26]">
                      {basketSize.toFixed(1)} <span className="text-[10px] font-semibold text-[#8C8376]">units</span>
                    </div>
                  </div>

                  <div className="bg-white/70 p-2.5 rounded-xl border border-[#EBE5D9]">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#8C8376] uppercase mb-0.5">
                      <ShoppingBag className="w-3 h-3 text-[#AF8260]" />
                      <span>Net Sales</span>
                    </div>
                    <div className="text-xs font-extrabold text-[#2D2A26]">
                      {formatCurrency(ch.netSales)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Channel Tag */}
              {ch.channel === maxAovChannel.channel && validChannels.length > 1 && (
                <div className="mt-3 pt-2.5 border-t border-[#EBE5D9] flex items-center gap-1.5 text-[10px] font-bold text-[#5F7161]">
                  <Sparkles className="w-3 h-3 text-[#5F7161]" />
                  <span>Highest ticket size leader across all channels</span>
                </div>
              )}
              {ch.channel === maxBasketChannel.channel && ch.channel !== maxAovChannel.channel && validChannels.length > 1 && (
                <div className="mt-3 pt-2.5 border-t border-[#EBE5D9] flex items-center gap-1.5 text-[10px] font-bold text-[#AF8260]">
                  <CheckCircle2 className="w-3 h-3 text-[#AF8260]" />
                  <span>Highest multi-item basket depth leader</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View All / Show Less Toggle (shown when channels exceed 8) */}
      {hasMoreThan8 && (
        <div className="mt-5 pt-4 border-t border-[#EBE5D9] flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#433E37] bg-[#F9F7F2] hover:bg-[#F1EDE5] border border-[#EBE5D9] rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <span>
              {showAll
                ? `Show Top 8 Channels`
                : `View All Channels (${validChannels.length})`}
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
  );
};

