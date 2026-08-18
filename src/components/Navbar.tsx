import React from 'react';
import { 
  BarChart3, 
  UploadCloud, 
  RotateCcw, 
  Printer, 
  Target, 
  FileSpreadsheet, 
  TrendingUp,
  Download,
  Database
} from 'lucide-react';

interface NavbarProps {
  fileName: string;
  totalRows: number;
  filteredRows: number;
  netSales: number;
  salesTarget: number;
  onOpenUpload: () => void;
  onResetSample: () => void;
  onOpenGoal: () => void;
  onPrintReport: () => void;
  onExportFilteredCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  fileName,
  totalRows,
  filteredRows,
  netSales,
  salesTarget,
  onOpenUpload,
  onResetSample,
  onOpenGoal,
  onPrintReport,
  onExportFilteredCsv,
}) => {
  const targetPct = salesTarget > 0 ? Math.min(100, Math.round((netSales / salesTarget) * 100)) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#EBE5D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#5F7161] flex items-center justify-center text-white shadow-sm border border-[#4A594C]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#2D2A26] tracking-tight leading-tight">
                  Sales Performance Hub
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E9EFEA] text-[#5F7161] border border-[#C5D5C7]">
                  Active Engine
                </span>
              </div>
              <p className="text-xs text-[#8C8376] font-medium hidden sm:block">
                Multi-year sales analytics, marketplace tracking & margin insights
              </p>
            </div>
          </div>

          {/* Target Progress Quick Widget */}
          <div 
            onClick={onOpenGoal}
            className="hidden md:flex items-center gap-3 px-3.5 py-2 rounded-2xl border border-[#EBE5D9] bg-[#FAF8F5] hover:bg-[#F1EDE5] cursor-pointer transition-colors"
            title="Click to set sales target quota"
          >
            <div className="w-7 h-7 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#AF8260]">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#433E37]">
                <span>Target: ₹{salesTarget.toLocaleString()}</span>
                <span className="font-bold text-[#AF8260]">{targetPct}%</span>
              </div>
              <div className="w-28 h-1.5 bg-[#EBE5D9] rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-[#AF8260] rounded-full transition-all duration-500"
                  style={{ width: `${targetPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Active Data Info */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#433E37] bg-[#F1EDE5] border border-[#E4DCD0] rounded-xl font-medium">
              <Database className="w-3.5 h-3.5 text-[#5F7161]" />
              <span className="font-bold text-[#2D2A26] truncate max-w-[120px]">{fileName}</span>
              <span className="text-[#C4BAA9]">|</span>
              <span className="text-[#8C8376]">{filteredRows.toLocaleString()} / {totalRows.toLocaleString()} rows</span>
            </div>

            {/* Export CSV */}
            <button
              onClick={onExportFilteredCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#433E37] bg-white border border-[#EBE5D9] rounded-xl hover:bg-[#F9F7F2] transition-colors shadow-2xs"
              title="Download filtered dataset as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#8C8376]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Print / Report */}
            <button
              onClick={onPrintReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#433E37] bg-white border border-[#EBE5D9] rounded-xl hover:bg-[#F9F7F2] transition-colors shadow-2xs"
              title="Print executive team report"
            >
              <Printer className="w-3.5 h-3.5 text-[#8C8376]" />
              <span className="hidden sm:inline">Print Report</span>
            </button>

            {/* Reset Sample */}
            <button
              onClick={onResetSample}
              className="p-2 text-[#8C8376] hover:text-[#2D2A26] hover:bg-[#F1EDE5] border border-transparent hover:border-[#EBE5D9] rounded-xl transition-colors"
              title="Reset to Sample Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Upload New CSV Button */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#5F7161] hover:bg-[#4E5E50] rounded-xl transition-all shadow-sm shadow-[#5F7161]/20 border border-[#4A594C]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
