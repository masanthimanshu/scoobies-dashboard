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
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { CategoryMetric, ProductMetric } from '../types';

interface ProductCategoryAnalyticsProps {
  categories: CategoryMetric[];
  products: ProductMetric[];
}

export const ProductCategoryAnalytics: React.FC<ProductCategoryAnalyticsProps> = ({
  categories,
  products,
}) => {
  const [activeTab, setActiveTab] = useState<'topProducts' | 'categories' | 'returns'>('topProducts');

  const topProductsList = products.slice(0, 8);
  const highReturnProducts = products
    .filter((p) => p.returnUnits > 0)
    .sort((a, b) => b.returnUnits - a.returnUnits)
    .slice(0, 8);

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
            Identify top revenue drivers, best seller items, and high return SKUs
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
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'returns'
                ? 'bg-white text-[#2D2A26] shadow-2xs font-extrabold'
                : 'text-[#8C8376] hover:text-[#2D2A26]'
            }`}
          >
            Return Analysis
          </button>
        </div>
      </div>

      {/* Tab 1: Top Products */}
      {activeTab === 'topProducts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart View */}
          <div className="lg:col-span-6 h-[280px]">
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
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Net Sales']}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EDE5]">
                {topProductsList.map((p, idx) => (
                  <tr key={p.productName} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-2.5 font-bold text-[#2D2A26] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#E9EFEA] text-[#5F7161] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[170px]" title={p.productName}>
                        {p.productName}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#8C8376] text-[11px]">
                      <span className="bg-[#F1EDE5] px-2 py-0.5 rounded-md font-semibold text-[#433E37]">{p.category}</span>
                    </td>
                    <td className="py-2.5 text-right text-[#433E37] font-bold">
                      {p.units.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-black text-[#5F7161]">
                      ₹{p.netSales.toLocaleString()}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="bg-[#F9F7F2] border border-[#EBE5D9] rounded-2xl p-4 hover:bg-[#F1EDE5] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-[#2D2A26] uppercase tracking-wide truncate max-w-[140px]">
                  {cat.category}
                </span>
                <span className="text-xs font-bold text-[#AF8260]">
                  {cat.sharePct.toFixed(1)}%
                </span>
              </div>
              <div className="text-xl font-black text-[#5F7161]">
                ₹{cat.sales.toLocaleString()}
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#8C8376] font-medium mt-2.5 pt-2.5 border-t border-[#EBE5D9]">
                <span>{cat.units.toLocaleString()} units sold</span>
                <span>{cat.orders} orders</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Return Analysis */}
      {activeTab === 'returns' && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-[#FAF0E6] border border-[#E8D2C2] text-[#AF8260] text-xs flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 text-[#AF8260] shrink-0" />
            <span>
              Items with high return rates may require packaging checks, customer description updates, or quality inspections.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#EBE5D9] text-[#8C8376] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-2.5">Product Name</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5 text-right">Units Returned</th>
                  <th className="pb-2.5 text-right">Return Rate</th>
                  <th className="pb-2.5 text-right">Refunded Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EDE5]">
                {highReturnProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-[#8C8376]">
                      No returns recorded in this filter window.
                    </td>
                  </tr>
                ) : (
                  highReturnProducts.map((p) => (
                    <tr key={p.productName} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-2.5 font-bold text-[#2D2A26] truncate max-w-[220px]">
                        {p.productName}
                      </td>
                      <td className="py-2.5 text-[#8C8376] font-medium">{p.category}</td>
                      <td className="py-2.5 text-right font-black text-[#AF8260]">
                        {p.returnUnits} units
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#AF8260] border border-[#E8D2C2] font-bold text-[11px]">
                          {p.returnRate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-[#433E37]">
                        ₹{p.returns.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
