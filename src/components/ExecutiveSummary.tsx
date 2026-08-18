import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  Percent
} from 'lucide-react';
import { ExecutiveInsight } from '../types';

interface ExecutiveSummaryProps {
  insights: ExecutiveInsight[];
  totalRecordsCount: number;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ insights, totalRecordsCount }) => {
  if (insights.length === 0) return null;

  return (
    <div className="bg-white rounded-[28px] p-6 mb-6 shadow-sm border border-[#EBE5D9]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EBE5D9]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#FAF0E6] border border-[#E8D2C2] flex items-center justify-center text-[#AF8260]">
            <Sparkles className="w-5 h-5 text-[#AF8260]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#2D2A26] tracking-tight">
              Executive Highlights & Briefing
            </h2>
            <p className="text-xs text-[#8C8376] font-medium">
              Actionable insights distilled from {totalRecordsCount.toLocaleString()} transactions
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E9EFEA] text-[#5F7161] border border-[#C5D5C7] self-start sm:self-auto">
          Team Focus Items
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {insights.map((insight, idx) => {
          let badgeBg = 'bg-[#E9EFEA] text-[#5F7161] border-[#C5D5C7]';
          let cardBg = 'bg-[#F9F7F2] border-[#EBE5D9]';
          let icon = <TrendingUp className="w-3.5 h-3.5 text-[#5F7161]" />;

          if (insight.type === 'warning') {
            badgeBg = 'bg-[#FAF0E6] text-[#AF8260] border-[#E8D2C2]';
            icon = <AlertTriangle className="w-3.5 h-3.5 text-[#AF8260]" />;
          } else if (insight.type === 'positive') {
            badgeBg = 'bg-[#E9EFEA] text-[#5F7161] border-[#C5D5C7]';
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#5F7161]" />;
          } else if (insight.type === 'highlight') {
            badgeBg = 'bg-[#FDF4EB] text-[#E7AB79] border-[#F5DCBF]';
            icon = <Sparkles className="w-3.5 h-3.5 text-[#E7AB79]" />;
          }

          return (
            <div
              key={idx}
              className={`${cardBg} hover:bg-[#F1EDE5] transition-colors border rounded-2xl p-4 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                    {icon}
                    <span>{insight.metric || 'Key Driver'}</span>
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#2D2A26] mb-1 leading-snug">
                  {insight.title}
                </h3>
                <p className="text-[11px] text-[#8C8376] font-medium leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
