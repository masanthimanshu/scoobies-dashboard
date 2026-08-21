import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  RotateCcw, 
  Printer, 
  Target, 
  TrendingUp,
  Download,
  Database,
  ChevronDown,
  FileSpreadsheet,
  Pencil
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
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EBE5D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3 sm:gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#5F7161] flex items-center justify-center text-white shadow-sm border border-[#4A594C]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#2D2A26] tracking-tight leading-tight">
                  Scoobies Sales
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#E9EFEA] text-[#5F7161] border border-[#C5D5C7]">
                  Active Engine
                </span>
              </div>
              <p className="text-xs text-[#8C8376] font-medium hidden sm:block">
                Sales analytics & tracking dashboard
              </p>
            </div>
          </div>

          {/* Center / Target & Data Status Info */}
          <div className="flex items-center gap-2.5">
            {/* Target Widget */}
            <div 
              onClick={onOpenGoal}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border border-[#EBE5D9] bg-[#FAF8F5] hover:bg-[#F1EDE5] hover:border-[#D9CFC1] cursor-pointer transition-all group"
              title="Click to edit margin target quota"
            >
              <div className="w-6 h-6 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#AF8260] shrink-0 group-hover:bg-[#F3E5D4] transition-colors">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#2D2A26] whitespace-nowrap">
                  Margin Target: ₹{salesTarget.toLocaleString()}
                </span>
                <Pencil className="w-3 h-3 text-[#8C8376] group-hover:text-[#AF8260] transition-colors shrink-0" />
              </div>
            </div>

            {/* Active Data Info - Shows Full Filename */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs text-[#433E37] bg-[#F1EDE5] border border-[#E4DCD0] rounded-2xl font-medium shrink-0">
              <Database className="w-3.5 h-3.5 text-[#5F7161] shrink-0" />
              <span className="font-bold text-[#2D2A26] whitespace-nowrap" title={fileName}>
                {fileName}
              </span>
              <span className="text-[#C4BAA9]">|</span>
              <span className="text-[#8C8376] whitespace-nowrap">
                {filteredRows.toLocaleString()} / {totalRows.toLocaleString()} rows
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Consolidated Actions Dropdown (Export CSV, Print Report, Reset) */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#2D2A26] bg-white border border-[#EBE5D9] rounded-xl hover:bg-[#F9F7F2] transition-all shadow-2xs cursor-pointer ${
                  isActionsOpen ? 'ring-2 ring-[#5F7161]/20 border-[#5F7161]' : ''
                }`}
                title="Export, Print & Data Tools"
              >
                <Download className="w-3.5 h-3.5 text-[#8C8376]" />
                <span>Export & Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#8C8376] transition-transform duration-200 ${isActionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isActionsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#EBE5D9] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#F1EDE5]">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsActionsOpen(false);
                        onPrintReport();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-bold text-[#2D2A26] hover:bg-[#F9F7F2] transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#5F7161] shrink-0" />
                      <div>
                        <div>Print / PDF Report</div>
                        <div className="text-[10px] font-normal text-[#8C8376]">Executive sales briefing</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsActionsOpen(false);
                        onExportFilteredCsv();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-bold text-[#2D2A26] hover:bg-[#F9F7F2] transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#AF8260] shrink-0" />
                      <div>
                        <div>Export Filtered CSV</div>
                        <div className="text-[10px] font-normal text-[#8C8376]">Download active view dataset</div>
                      </div>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsActionsOpen(false);
                        onResetSample();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-bold text-[#8C8376] hover:text-[#C84B31] hover:bg-[#FFF5F5] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <div>
                        <div>Reset to Sample Data</div>
                        <div className="text-[10px] font-normal text-[#8C8376]">Restore default dataset</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Import CSV Button */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#5F7161] hover:bg-[#4E5E50] rounded-xl transition-all shadow-sm shadow-[#5F7161]/20 border border-[#4A594C] cursor-pointer"
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
