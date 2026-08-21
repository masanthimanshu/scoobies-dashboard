import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ShoppingBag, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { CategoryMetric, ProductMetric } from '../types';

interface ProductCategoryAnalyticsProps {
  categories: CategoryMetric[];
  products: ProductMetric[];
}

export const ProductCategoryAnalytics: React.FC<ProductCategoryAnalyticsProps> = ({
  categories,
  products,
}) => {
  const [activeTab, setActiveTab] = useState<'topProducts' | 'categories'>('topProducts');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const topProductsList = products.slice(0, 10);
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 12);
  const hasMoreThan12Categories = categories.length > 12;

  return (
    <div className="bg-white border border-[#EBE5D9] rounded-[28px] p-6 shadow-sm mb-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3.5 border-b border-[#EBE5D9]">
        <div>
          <h3 className="text-base font-extrabold text-[#2D2A26] flex items-center gap-2 tracking-tight">
            <ShoppingBag className="w-4 h-4 text-[#AF8260]" />
            Product & Category Intelligence
          </h3>
          <p className="text-xs text-[#8C8376] font-medium mt-0.5">
            Identify top revenue drivers, best seller items, and category performance
          </p>
        </div>

        <div className="flex bg-[#F1EDE5] p-1 rounded-xl text-xs border border-[#EBE5D9]">
          <button
            onClick={() => setActiveTab('topProducts')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'topProducts'
                ? 'bg-white text-[#2D2A26] shadow-2xs font-extrabold'
                : 'text-[#8C8376] hover:text-[#2D2A26]'
            }`}
          >
            Top Products
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-[#2D2A26] shadow-2xs font-extrabold'
                : 'text-[#8C8376] hover:text-[#2D2A26]'
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Tab 1: Top Products */}
      {activeTab === 'topProducts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart View */}
          <div className="lg:col-span-6 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProductsList}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1EDE5" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#8C8376' }}
                  axisLine={{ stroke: '#EBE5D9' }}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tick={{ fontSize: 11, fill: '#433E37', fontWeight: 600 }}
                  axisLine={{ stroke: '#EBE5D9' }}
                  width={130}
                  tickFormatter={(name) => (name.length > 18 ? `${name.substring(0, 16)}...` : name)}
                />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => {
                    const share = item?.payload?.sharePct;
                    const shareText = share !== undefined ? ` • ${share}% of total sales` : '';
                    return [`₹${Number(val).toLocaleString()}${shareText}`, 'Net Sales'];
                  }}
                  contentStyle={{
                    backgroundColor: '#2D2A26',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="netSales" fill="#5F7161" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* List Table */}
          <div className="lg:col-span-6 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#EBE5D9] text-[#8C8376] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Units</th>
                  <th className="pb-2 text-right">Net Sales</th>
                  <th className="pb-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EDE5]">
                {topProductsList.map((p, idx) => (
                  <tr key={p.productName} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-2 font-bold text-[#2D2A26] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#E9EFEA] text-[#5F7161] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[150px]" title={p.productName}>
                        {p.productName}
                      </span>
                    </td>
                    <td className="py-2 text-[#8C8376] text-[11px]">
                      <span className="bg-[#F1EDE5] px-2 py-0.5 rounded-md font-semibold text-[#433E37] truncate max-w-[90px] inline-block">{p.category}</span>
                    </td>
                    <td className="py-2 text-right text-[#433E37] font-bold">
                      {p.units.toLocaleString()}
                    </td>
                    <td className="py-2 text-right font-black text-[#5F7161]">
                      ₹{p.netSales.toLocaleString()}
                    </td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FAF0E6] text-[#AF8260] border border-[#E8D2C2] text-[10px] font-bold">
                        {p.sharePct ? `${p.sharePct.toFixed(1)}%` : '0.0%'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedCategories.map((cat) => (
              <div
                key={cat.category}
                className="bg-[#F9F7F2] border border-[#EBE5D9] rounded-2xl p-4 hover:bg-[#F1EDE5] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-[#2D2A26] uppercase tracking-wide truncate max-w-[140px]" title={cat.category}>
                      {cat.category}
                    </span>
                    <span className="text-xs font-bold text-[#AF8260]">
                      {cat.sharePct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="text-xl font-black text-[#5F7161]">
                    ₹{cat.sales.toLocaleString()}
                  </div>

                  {/* Returns Metric Display inside Category Box */}
                  <div className="mt-2">
                    {cat.returns > 0 ? (
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#AF8260] bg-[#FAF0E6] px-2.5 py-1 rounded-lg border border-[#E8D2C2]">
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-[#AF8260]" />
                          Returns
                        </span>
                        <span className="font-bold">
                          ₹{cat.returns.toLocaleString()}
                          {cat.returnUnits !== undefined && cat.returnUnits > 0 ? ` (${cat.returnUnits} ${cat.returnUnits === 1 ? 'unit' : 'units'})` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#8C8376] bg-[#F1EDE5]/60 px-2.5 py-1 rounded-lg border border-[#EBE5D9]">
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-[#A89F91]" />
                          Returns
                        </span>
                        <span>₹0 (0%)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-[#8C8376] font-medium mt-3 pt-2.5 border-t border-[#EBE5D9]">
                  <span>{cat.units.toLocaleString()} units sold</span>
                  <span>{cat.orders} orders</span>
                </div>
              </div>
            ))}
          </div>

          {hasMoreThan12Categories && (
            <div className="mt-5 pt-3.5 border-t border-[#F1EDE5] flex justify-center">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#433E37] bg-[#F9F7F2] hover:bg-[#F1EDE5] border border-[#EBE5D9] rounded-xl transition-colors cursor-pointer"
              >
                <span>
                  {showAllCategories
                    ? 'Show Top 12 Categories'
                    : `View All Categories (${categories.length})`}
                </span>
                {showAllCategories ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#8C8376]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C8376]" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

