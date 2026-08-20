import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  RotateCcw, 
  Percent, 
  PackageCheck,
  Target
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface KpiGridProps {
  metrics: DashboardMetrics;
  salesTarget: number;
  onOpenGoalModal: () => void;
}

export const KpiGrid: React.FC<KpiGridProps> = ({
  metrics,
  salesTarget,
  onOpenGoalModal,
}) => {
  const targetPct = salesTarget > 0 ? (metrics.totalNetSales / salesTarget) * 100 : 0;
  const remainingToTarget = Math.max(0, salesTarget - metrics.totalNetSales);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {/* 1. Net Sales Value */}
      <div className="bg-white border border-[#EBE5D9] rounded-[24px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider">Net Sales Value</span>
          <div className="w-8 h-8 rounded-xl bg-[#E9EFEA] text-[#5F7161] flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[#5F7161] tracking-tight">
            ₹{Math.round(metrics.totalNetSales).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8C8376]">
            <span>Gross: <strong className="text-[#433E37]">₹{Math.round(metrics.totalGrossSales).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Total Net Units Sold */}
      <div className="bg-white border border-[#EBE5D9] rounded-[24px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider">Units Sold (Net)</span>
          <div className="w-8 h-8 rounded-xl bg-[#FAF0E6] text-[#AF8260] flex items-center justify-center font-bold">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[#AF8260] tracking-tight">
            {metrics.totalUnitsSold.toLocaleString()} <span className="text-xs font-bold text-[#8C8376]">units</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8C8376]">
            <span>{metrics.totalGrossUnits} gross dispatched</span>
          </div>
        </div>
      </div>

      {/* 3. Total Orders & AOV */}
      <div className="bg-white border border-[#EBE5D9] rounded-[24px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider">Orders & Basket Size</span>
          <div className="w-8 h-8 rounded-xl bg-[#F1EDE5] text-[#433E37] flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[#2D2A26] tracking-tight">
            {metrics.totalOrders.toLocaleString()} <span className="text-xs font-bold text-[#8C8376]">orders</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8C8376]">
            <span>AOV: <strong className="text-[#2D2A26]">₹{Math.round(metrics.averageOrderValue).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Scoobies Net Margin */}
      <div className="bg-white border border-[#EBE5D9] rounded-[24px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider">Scoobies Margin</span>
          <div className="w-8 h-8 rounded-xl bg-[#E9EFEA] text-[#5F7161] flex items-center justify-center font-bold">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[#5F7161] tracking-tight">
            ₹{Math.round(metrics.totalScoobiesMargin).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8C8376]">
            <span className="font-bold text-[#5F7161] bg-[#E9EFEA] px-1.5 py-0.5 rounded-md">
              {metrics.marginPercentage.toFixed(1)}% margin
            </span>
          </div>
        </div>
      </div>

      {/* 5. Returns Rate */}
      <div className="bg-white border border-[#EBE5D9] rounded-[24px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider">Returns Impact</span>
          <div className="w-8 h-8 rounded-xl bg-[#FAF0E6] text-[#AF8260] flex items-center justify-center font-bold">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[#AF8260] tracking-tight">
            {metrics.returnRateQtyPct.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8C8376]">
            <span className="text-[#AF8260] font-semibold">-₹{Math.round(metrics.totalReturnedSales).toLocaleString()}</span>
            <span>({metrics.totalReturnedUnits} units)</span>
          </div>
        </div>
      </div>

      {/* 6. Target Goal Meter */}
      <div 
        onClick={onOpenGoalModal}
        className="bg-[#5F7161] text-white rounded-[24px] p-5 shadow-sm border border-[#4A594C] flex flex-col justify-between hover:bg-[#4E5E50] transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#D9E3D8] uppercase tracking-wider">Goal Tracker</span>
          <Target className="w-4 h-4 text-[#D9E3D8]" />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black">{targetPct.toFixed(0)}%</div>
            <span className="text-xs text-[#D9E3D8] font-medium">of ₹{salesTarget.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-[#4A594C] rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-[#E7AB79] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, targetPct)}%` }}
            />
          </div>
          <div className="text-[11px] text-[#D9E3D8] mt-1.5 flex justify-between font-medium">
            <span>{remainingToTarget > 0 ? `₹${Math.round(remainingToTarget).toLocaleString()} left` : 'Goal Met!'}</span>
            <span className="underline font-bold">Edit Goal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
