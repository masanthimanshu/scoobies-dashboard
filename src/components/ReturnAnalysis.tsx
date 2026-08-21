import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ArrowUpDown,
  PackageX,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ProductMetric, ChannelMetric, DashboardMetrics, SaleRecord } from '../types';
import { getRecordMetrics } from '../utils/analytics';

interface ReturnAnalysisProps {
  records?: SaleRecord[];
  products: ProductMetric[];
  channels: ChannelMetric[];
  metrics: DashboardMetrics;
}

export const ReturnAnalysis: React.FC<ReturnAnalysisProps> = ({
  records,
  products,
  channels,
  metrics,
}) => {
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'units' | 'value' | 'rate' | 'name'>('units');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [showAllReturns, setShowAllReturns] = useState(false);

  // Channels with return metrics for the breakdown cards (only channels with returns)
  const channelsWithReturns = useMemo(() => {
    const totalReturnsVal = metrics?.totalReturnedSales || 1;
    return (channels || [])
      .filter((ch) => (ch.returns > 0 || ch.returnUnits > 0))
      .map((ch) => {
        const returnSharePct = totalReturnsVal > 0 ? (ch.returns / totalReturnsVal) * 100 : 0;
        return {
          ...ch,
          returnSharePct: Math.min(100, Math.max(0, returnSharePct)),
        };
      })
      .sort((a, b) => b.returns - a.returns);
  }, [channels, metrics?.totalReturnedSales]);

  // Compute product returns dynamically based on selected channel filter
  const channelScopedReturnedProducts = useMemo(() => {
    if (records && records.length > 0) {
      // Group records by product within the selected channel scope
      const prodMap = new Map<
        string,
        {
          productName: string;
          barCode: string;
          category: string;
          returnChannels: Set<string>;
          channels: Set<string>;
          grossSales: number;
          netSales: number;
          returns: number;
          units: number;
          returnUnits: number;
        }
      >();

      records.forEach((r) => {
        const channelName = r.channel ? r.channel.trim() : 'Direct';
        
        // If a specific channel is selected, ignore records from other channels
        if (selectedChannelFilter !== 'ALL' && channelName.toLowerCase() !== selectedChannelFilter.toLowerCase()) {
          return;
        }

        const name = r.productName || 'Unknown';
        const { isReturn, val, qty } = getRecordMetrics(r);

        const curr = prodMap.get(name) || {
          productName: name,
          barCode: r.barCode || '',
          category: r.category || 'General',
          returnChannels: new Set<string>(),
          channels: new Set<string>(),
          grossSales: 0,
          netSales: 0,
          returns: 0,
          units: 0,
          returnUnits: 0,
        };

        curr.channels.add(channelName);

        if (isReturn) {
          curr.returns += val;
          curr.netSales -= val;
          curr.returnUnits += qty;
          curr.returnChannels.add(channelName);
        } else {
          curr.grossSales += val;
          curr.netSales += val;
          curr.units += qty;
        }

        prodMap.set(name, curr);
      });

      // Filter strictly to products that have returnUnits > 0 or returns > 0 in this channel scope
      const list: ProductMetric[] = [];
      prodMap.forEach((data) => {
        if (data.returnUnits > 0 || data.returns > 0) {
          const totalUnitsOrdered = data.units + data.returnUnits;
          const returnRate = totalUnitsOrdered > 0 ? (data.returnUnits / totalUnitsOrdered) * 100 : 100;
          const retChannelsList = Array.from(data.returnChannels);
          const allChannelsList = Array.from(data.channels);

          list.push({
            productName: data.productName,
            barCode: data.barCode,
            category: data.category,
            channel: selectedChannelFilter !== 'ALL' 
              ? selectedChannelFilter 
              : retChannelsList.length > 0 
                ? retChannelsList.join(', ') 
                : (allChannelsList.length > 0 ? allChannelsList.join(', ') : 'Direct'),
            channels: allChannelsList,
            returnChannels: retChannelsList,
            netSales: Math.round(data.netSales),
            grossSales: Math.round(data.grossSales),
            returns: Math.round(data.returns),
            units: data.units,
            returnUnits: data.returnUnits,
            returnRate: Number(returnRate.toFixed(1)),
            sharePct: 0,
            margin: 0,
            mrp: 0,
          });
        }
      });

      return list;
    }

    // Fallback if records prop is not provided
    if (selectedChannelFilter === 'ALL') {
      return products.filter((p) => p.returnUnits > 0 || p.returns > 0);
    }

    return products.filter((p) => {
      if (p.returnUnits <= 0 && p.returns <= 0) return false;
      if (p.returnChannels && p.returnChannels.length > 0) {
        return p.returnChannels.includes(selectedChannelFilter);
      }
      if (p.channels && p.channels.length > 0) {
        return p.channels.includes(selectedChannelFilter);
      }
      return (p.channel || 'Direct') === selectedChannelFilter;
    });
  }, [records, products, selectedChannelFilter]);

  // Filtered returned products based on search term and sort
  const filteredReturnedProducts = useMemo(() => {
    let list = channelScopedReturnedProducts;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.barCode && p.barCode.toLowerCase().includes(q))
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'units') comp = b.returnUnits - a.returnUnits;
      else if (sortBy === 'value') comp = b.returns - a.returns;
      else if (sortBy === 'rate') comp = b.returnRate - a.returnRate;
      else if (sortBy === 'name') comp = a.productName.localeCompare(b.productName);

      return sortDirection === 'desc' ? comp : -comp;
    });
  }, [channelScopedReturnedProducts, searchTerm, sortBy, sortDirection]);

  const displayedProducts = showAllReturns
    ? filteredReturnedProducts
    : filteredReturnedProducts.slice(0, 10);
  const hasMoreThan10 = filteredReturnedProducts.length > 10;

  // Channel specific totals when a filter is applied
  const activeScopeSummary = useMemo(() => {
    if (selectedChannelFilter === 'ALL') {
      return {
        title: 'All Channels',
        refundedValue: metrics?.totalReturnedSales ?? 0,
        returnUnits: metrics?.totalReturnedUnits ?? 0,
        returnRate: metrics?.returnRateValPct ?? 0,
        affectedSkus: channelScopedReturnedProducts.length,
      };
    }
    const ch = channels.find((c) => c.channel.toLowerCase() === selectedChannelFilter.toLowerCase());
    const totalRef = channelScopedReturnedProducts.reduce((sum, p) => sum + p.returns, 0);
    const totalUnits = channelScopedReturnedProducts.reduce((sum, p) => sum + p.returnUnits, 0);
    return {
      title: selectedChannelFilter,
      refundedValue: ch ? ch.returns : totalRef,
      returnUnits: ch ? ch.returnUnits : totalUnits,
      returnRate: ch ? ch.returnRate : 0,
      affectedSkus: channelScopedReturnedProducts.length,
    };
  }, [selectedChannelFilter, metrics, channels, channelScopedReturnedProducts]);

  // Key return insights
  const highestReturnChannel = useMemo(() => {
    const sorted = [...channels].filter((c) => c.returns > 0).sort((a, b) => b.returns - a.returns);
    return sorted.length > 0 ? sorted[0] : null;
  }, [channels]);

  return (
    <section id="return-analysis" className="bg-white border border-[#EBE5D9] rounded-[28px] p-6 shadow-sm mb-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#EBE5D9]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] border border-[#E8D2C2] flex items-center justify-center text-[#AF8260] shrink-0 mt-0.5">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-[#2D2A26] tracking-tight">
                Return & Refund Analysis
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF0E6] text-[#AF8260] border border-[#E8D2C2]">
                {activeScopeSummary.affectedSkus} {selectedChannelFilter !== 'ALL' ? `Returned on ${selectedChannelFilter}` : 'Affected SKUs'}
              </span>
            </div>
            <p className="text-xs text-[#8C8376] font-medium mt-0.5">
              Comprehensive breakdown of returns across marketplace channels and returned products
            </p>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#FAF0E6] border border-[#E8D2C2] px-3.5 py-1.5 rounded-xl text-left">
            <span className="block text-[10px] uppercase font-bold text-[#8C8376] tracking-wider">
              {selectedChannelFilter !== 'ALL' ? `${selectedChannelFilter} Refunded` : 'Total Refunded'}
            </span>
            <span className="text-sm font-black text-[#AF8260]">
              ₹{(activeScopeSummary.refundedValue ?? 0).toLocaleString()}
              <span className="text-[11px] font-semibold text-[#8C8376] ml-1">
                ({(activeScopeSummary.returnRate ?? 0).toFixed(1)}%)
              </span>
            </span>
          </div>

          <div className="bg-[#F9F7F2] border border-[#EBE5D9] px-3.5 py-1.5 rounded-xl text-left">
            <span className="block text-[10px] uppercase font-bold text-[#8C8376] tracking-wider">
              {selectedChannelFilter !== 'ALL' ? `${selectedChannelFilter} Return Units` : 'Returned Units'}
            </span>
            <span className="text-sm font-black text-[#2D2A26]">
              {(activeScopeSummary.returnUnits ?? 0).toLocaleString()} units
            </span>
          </div>
        </div>
      </div>

      {/* 1. Channel-by-Channel Returns Breakdown */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#AF8260]" />
            <h4 className="text-sm font-bold text-[#2D2A26]">
              Channel-by-Channel Returns Breakdown
            </h4>
          </div>
          <span className="text-xs text-[#8C8376]">
            Click any channel card to filter product returns to that channel only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* All Channels Quick Filter Card */}
          <button
            onClick={() => setSelectedChannelFilter('ALL')}
            className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedChannelFilter === 'ALL'
                ? 'bg-[#F1EDE5] border-[#2D2A26] shadow-xs'
                : 'bg-[#F9F7F2] border-[#EBE5D9] hover:bg-[#F5F1E9]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-[#2D2A26] uppercase">
                All Channels Overview
              </span>
              {selectedChannelFilter === 'ALL' && (
                <CheckCircle2 className="w-4 h-4 text-[#5F7161]" />
              )}
            </div>
            <div className="text-lg font-black text-[#2D2A26]">
              ₹{(metrics?.totalReturnedSales ?? 0).toLocaleString()}
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#8C8376] mt-2 pt-2 border-t border-[#EBE5D9]">
              <span>{(metrics?.totalReturnedUnits ?? 0).toLocaleString()} units returned</span>
              <span className="font-bold text-[#AF8260]">{(metrics?.returnRateValPct ?? 0).toFixed(1)}% rate</span>
            </div>
          </button>

          {/* Individual Channel Cards */}
          {channelsWithReturns.map((ch) => {
            const isSelected = selectedChannelFilter.toLowerCase() === ch.channel.toLowerCase();
            const hasReturns = ch.returns > 0;

            return (
              <button
                key={ch.channel}
                onClick={() => setSelectedChannelFilter(isSelected ? 'ALL' : ch.channel)}
                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF0E6] border-[#AF8260] shadow-xs ring-2 ring-[#AF8260]'
                    : hasReturns
                    ? 'bg-[#F9F7F2] border-[#EBE5D9] hover:bg-[#FAF0E6]/50'
                    : 'bg-[#F9F7F2]/60 border-[#EBE5D9] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-[#2D2A26] uppercase truncate max-w-[120px]" title={ch.channel}>
                    {ch.channel}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      ch.returnRate > 15
                        ? 'bg-[#FEE2E2] text-[#991B1B]'
                        : ch.returnRate > 5
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#E9EFEA] text-[#5F7161]'
                    }`}
                  >
                    {ch.returnRate.toFixed(1)}% rate
                  </span>
                </div>

                <div className="text-lg font-black text-[#AF8260]">
                  ₹{(ch.returns ?? 0).toLocaleString()}
                </div>

                <div className="flex justify-between items-center text-[11px] text-[#8C8376] mt-2 pt-2 border-t border-[#EBE5D9]">
                  <span>{ch.returnUnits ?? 0} {ch.returnUnits === 1 ? 'unit' : 'units'}</span>
                  <span>{ch.returnSharePct.toFixed(1)}% of total</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Returned Products Breakdown Section */}
      <div className="bg-[#FAF8F5] border border-[#EBE5D9] rounded-2xl p-4 sm:p-5">
        {/* Controls: Search, Channel Filter, Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <PackageX className="w-4 h-4 text-[#AF8260]" />
            <h4 className="text-sm font-bold text-[#2D2A26]">
              Returned Products Breakdown
              {selectedChannelFilter !== 'ALL' ? (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-[#FAF0E6] border border-[#E8D2C2] text-xs font-bold text-[#AF8260]">
                  Filtered to: {selectedChannelFilter} only
                </span>
              ) : (
                <span className="ml-2 text-xs font-semibold text-[#8C8376]">
                  (All Channels)
                </span>
              )}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8C8376] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search returned product / category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#EBE5D9] rounded-xl text-[#2D2A26] placeholder-[#8C8376] focus:outline-hidden focus:ring-1 focus:ring-[#AF8260] w-52 sm:w-60"
              />
            </div>

            {/* Channel Filter Selector */}
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#EBE5D9] rounded-xl text-[#2D2A26] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#AF8260] cursor-pointer"
            >
              <option value="ALL">All Channels ({metrics?.totalReturnedUnits ?? 0} total units)</option>
              {channelsWithReturns.map((ch) => (
                <option key={ch.channel} value={ch.channel}>
                  {ch.channel} ({ch.returnUnits ?? 0} returned)
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-white border border-[#EBE5D9] rounded-xl px-2 py-1">
              <span className="text-[11px] text-[#8C8376] font-medium flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-[#8C8376]" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-transparent font-bold text-[#2D2A26] border-none focus:outline-hidden cursor-pointer"
              >
                <option value="units">Units Returned</option>
                <option value="value">Refunded Value</option>
                <option value="rate">Return Rate %</option>
                <option value="name">Product Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Returned Products Table */}
        <div className="overflow-x-auto bg-white rounded-xl border border-[#EBE5D9]">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#EBE5D9] bg-[#F9F7F2] text-[#8C8376] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">
                  {selectedChannelFilter !== 'ALL' ? 'Channel' : 'Return Channel(s)'}
                </th>
                <th className="py-3 px-3 text-right">
                  {selectedChannelFilter !== 'ALL' ? `${selectedChannelFilter} Returns` : 'Units Returned'}
                </th>
                <th className="py-3 px-3 text-right">Return Rate</th>
                <th className="py-3 px-3.5 text-right">
                  {selectedChannelFilter !== 'ALL' ? `${selectedChannelFilter} Refund` : 'Refunded Value'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1EDE5]">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#8C8376]">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <RotateCcw className="w-6 h-6 text-[#A89F91]" />
                      <span className="font-semibold text-[#433E37]">
                        {selectedChannelFilter !== 'ALL'
                          ? `No returns recorded on "${selectedChannelFilter}"`
                          : 'No returns found'}
                      </span>
                      <span className="text-[11px] text-[#8C8376]">
                        {searchTerm || selectedChannelFilter !== 'ALL'
                          ? 'Try selecting "All Channels" or clearing the search keyword.'
                          : 'No return records found in this date window.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => {
                  const returnChs =
                    p.returnChannels && p.returnChannels.length > 0
                      ? p.returnChannels
                      : p.channels && p.channels.length > 0
                      ? p.channels
                      : [p.channel || 'Direct'];

                  return (
                    <tr key={p.productName} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-3.5 font-bold text-[#2D2A26]">
                        <div className="truncate max-w-[260px]" title={p.productName}>
                          {p.productName}
                        </div>
                        {p.barCode && (
                          <div className="text-[10px] text-[#8C8376] font-mono font-normal">
                            SKU: {p.barCode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#433E37] font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-[#F1EDE5] text-[#2D2A26] font-semibold text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {selectedChannelFilter !== 'ALL' ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#AF8260] font-bold text-[11px] border border-[#E8D2C2]">
                              {selectedChannelFilter}
                            </span>
                          ) : (
                            returnChs.map((ch) => (
                              <span
                                key={ch}
                                className="inline-block px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#AF8260] font-bold text-[11px] border border-[#E8D2C2]"
                              >
                                {ch}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-[#AF8260]">
                        {p.returnUnits} {p.returnUnits === 1 ? 'unit' : 'units'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                            p.returnRate > 25
                              ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                              : p.returnRate > 10
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : 'bg-[#FAF0E6] text-[#AF8260] border-[#E8D2C2]'
                          }`}
                        >
                          {p.returnRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-[#2D2A26]">
                        ₹{(p.returns ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* View All / Show Top 10 Toggle */}
        {hasMoreThan10 && (
          <div className="mt-3.5 pt-2.5 flex justify-center">
            <button
              onClick={() => setShowAllReturns(!showAllReturns)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#433E37] bg-white hover:bg-[#F1EDE5] border border-[#EBE5D9] rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <span>
                {showAllReturns
                  ? 'Show Top 10 Returned Products'
                  : `View All Returned Products (${filteredReturnedProducts.length})`}
              </span>
              {showAllReturns ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#8C8376]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#8C8376]" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* 3. Actionable Insights Card */}
      <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF0E6] border border-[#E8D2C2] text-xs text-[#433E37] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#AF8260] shrink-0" />
          <p className="font-medium">
            {highestReturnChannel ? (
              <span>
                <strong className="text-[#2D2A26]">{highestReturnChannel.channel}</strong> accounts for the largest share of refunds (₹{(highestReturnChannel.returns ?? 0).toLocaleString()} across {highestReturnChannel.returnUnits ?? 0} units).
              </span>
            ) : (
              <span>All return records are actively tracked across fulfillment channels.</span>
            )}
          </p>
        </div>
        <div className="text-[11px] font-bold text-[#AF8260] shrink-0">
          Recommendation: Verify packaging & product descriptions on high-return SKUs
        </div>
      </div>
    </section>
  );
};
