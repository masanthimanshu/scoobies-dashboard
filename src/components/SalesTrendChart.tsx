import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { TimeSeriesPoint } from '../types';

interface SalesTrendChartProps {
  data: TimeSeriesPoint[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
  onGranularityChange: (g: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  granularity,
  onGranularityChange,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [metricView, setMetricView] = useState<'revenue' | 'units' | 'margin'>('revenue');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: TimeSeriesPoint = payload[0].payload;
      return (
        <div className="bg-[#2D2A26] text-white p-3.5 rounded-2xl shadow-xl text-xs border border-[#433E37] min-w-[190px]">
          <p className="font-extrabold text-[#F9F7F2] border-b border-[#433E37] pb-1.5 mb-2">{point.label || label}</p>
          <div className="space-y-1.5 font-medium">
            <div className="flex justify-between text-[#C5D5C7]">
              <span>Net Sales:</span>
              <span className="font-bold text-white">₹{point.netSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#CEC4B5]">
              <span>Gross Dispatched:</span>
              <span>₹{point.grossSales.toLocaleString()}</span>
            </div>
            {point.returns > 0 && (
              <div className="flex justify-between text-[#E7AB79]">
                <span>Returns:</span>
                <span>-₹{point.returns.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[#E7AB79] pt-1.5 border-t border-[#433E37]">
              <span>Net Units Sold:</span>
              <span className="font-bold">{point.netQty.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#FAF0E6]">
              <span>Scoobies Margin:</span>
              <span>₹{point.margin.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#CEC4B5]">
              <span>Orders:</span>
              <span>{point.orderCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#EBE5D9] rounded-[28px] p-6 shadow-sm mb-6">
      {/* Header with Granularity & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-3.5 border-b border-[#EBE5D9]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#2D2A26] tracking-tight">
              Sales Performance Timeline
            </h3>
            <span className="text-xs text-[#8C8376] font-medium">
              ({data.length} intervals)
            </span>
          </div>
          <p className="text-xs text-[#8C8376] font-medium mt-0.5">
            Track gross sales, net revenue, margins, and unit volumes across periods
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex bg-[#F1EDE5] p-1 rounded-xl text-xs border border-[#EBE5D9]">
            <button
              onClick={() => setMetricView('revenue')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metricView === 'revenue' ? 'bg-white text-[#2D2A26] font-extrabold shadow-2xs' : 'text-[#8C8376] font-semibold hover:text-[#2D2A26]'
              }`}
            >
              Revenue (₹)
            </button>
            <button
              onClick={() => setMetricView('units')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metricView === 'units' ? 'bg-white text-[#2D2A26] font-extrabold shadow-2xs' : 'text-[#8C8376] font-semibold hover:text-[#2D2A26]'
              }`}
            >
              Units (Qty)
            </button>
            <button
              onClick={() => setMetricView('margin')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metricView === 'margin' ? 'bg-white text-[#2D2A26] font-extrabold shadow-2xs' : 'text-[#8C8376] font-semibold hover:text-[#2D2A26]'
              }`}
            >
              Margin (₹)
            </button>
          </div>

          {/* Granularity Selector */}
          <div className="flex bg-[#F1EDE5] p-1 rounded-xl text-xs border border-[#EBE5D9]">
            <button
              onClick={() => onGranularityChange('daily')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                granularity === 'daily' ? 'bg-[#5F7161] text-white shadow-2xs' : 'text-[#8C8376] hover:text-[#2D2A26]'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => onGranularityChange('weekly')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                granularity === 'weekly' ? 'bg-[#5F7161] text-white shadow-2xs' : 'text-[#8C8376] hover:text-[#2D2A26]'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => onGranularityChange('monthly')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                granularity === 'monthly' ? 'bg-[#5F7161] text-white shadow-2xs' : 'text-[#8C8376] hover:text-[#2D2A26]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => onGranularityChange('yearly')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                granularity === 'yearly' ? 'bg-[#5F7161] text-white shadow-2xs' : 'text-[#8C8376] hover:text-[#2D2A26]'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-[#F1EDE5] p-1 rounded-xl text-xs border border-[#EBE5D9]">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                chartType === 'area' ? 'bg-white text-[#2D2A26] shadow-2xs' : 'text-[#8C8376]'
              }`}
              title="Area view"
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                chartType === 'bar' ? 'bg-white text-[#2D2A26] shadow-2xs' : 'text-[#8C8376]'
              }`}
              title="Bar view"
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[320px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#8C8376] text-sm">
            No sales records match the active filter criteria.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="netSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5F7161" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#5F7161" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AF8260" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#AF8260" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="unitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E7AB79" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#E7AB79" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EDE5" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#8C8376' }} 
                  axisLine={{ stroke: '#EBE5D9' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#8C8376' }}
                  axisLine={{ stroke: '#EBE5D9' }}
                  tickLine={false}
                  tickFormatter={(v) => metricView === 'units' ? String(v) : `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                {metricView === 'revenue' && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="netSales"
                      name="Net Revenue"
                      stroke="#5F7161"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#netSalesGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="returns"
                      name="Returns Refunded"
                      stroke="#AF8260"
                      strokeWidth={2}
                      fill="#FAF0E6"
                      fillOpacity={0.35}
                    />
                  </>
                )}

                {metricView === 'units' && (
                  <Area
                    type="monotone"
                    dataKey="netQty"
                    name="Net Units Sold"
                    stroke="#AF8260"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#unitsGrad)"
                  />
                )}

                {metricView === 'margin' && (
                  <Area
                    type="monotone"
                    dataKey="margin"
                    name="Scoobies Margin"
                    stroke="#5F7161"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#marginGrad)"
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EDE5" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#8C8376' }} 
                  axisLine={{ stroke: '#EBE5D9' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#8C8376' }}
                  axisLine={{ stroke: '#EBE5D9' }}
                  tickLine={false}
                  tickFormatter={(v) => metricView === 'units' ? String(v) : `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                {metricView === 'revenue' && (
                  <>
                    <Bar dataKey="netSales" name="Net Revenue" fill="#5F7161" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="returns" name="Returns" fill="#AF8260" radius={[6, 6, 0, 0]} />
                  </>
                )}

                {metricView === 'units' && (
                  <Bar dataKey="netQty" name="Net Units Sold" fill="#AF8260" radius={[6, 6, 0, 0]} />
                )}

                {metricView === 'margin' && (
                  <Bar dataKey="margin" name="Scoobies Margin" fill="#5F7161" radius={[6, 6, 0, 0]} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
