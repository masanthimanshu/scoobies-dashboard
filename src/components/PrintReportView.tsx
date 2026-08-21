import React, { useRef, useState } from 'react';
import { X, Printer, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DashboardMetrics, ChannelMetric, CategoryMetric, ProductMetric, GeoMetric } from '../types';

interface PrintReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: DashboardMetrics;
  channels: ChannelMetric[];
  categories: CategoryMetric[];
  topProducts: ProductMetric[];
  cities?: GeoMetric[];
  fileName: string;
  totalRecordsCount: number;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  isOpen,
  onClose,
  metrics,
  channels,
  categories,
  topProducts,
  cities = [],
  fileName,
  totalRecordsCount,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Scoobies_Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      try {
        window.print();
      } catch (printErr) {
        console.error('Print error:', printErr);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleDownloadPdf();
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-[#2D2A26]/70 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start print:p-0 print:bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) onClose();
      }}
    >
      <div className="bg-white rounded-[28px] sm:rounded-[32px] max-w-4xl w-full p-5 sm:p-8 shadow-2xl border border-[#EBE5D9] relative my-4 sm:my-8 print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Header - scrolls naturally with report */}
        <div className="pb-5 border-b border-[#EBE5D9] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-[#2D2A26]">Executive Sales Report</span>
            <span className="text-xs text-[#8C8376] hidden sm:inline">• Ready for PDF Export</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5F7161] hover:bg-[#4E5E50] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save as PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              disabled={isExporting}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-[#F1EDE5] hover:bg-[#E5DFD3] text-[#2D2A26] text-xs font-bold rounded-xl transition-all border border-[#EBE5D9] cursor-pointer"
              title="Open browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#8C8376] hover:text-[#2D2A26] hover:bg-[#F1EDE5] rounded-xl transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Ref */}
        <div ref={reportRef} className="p-4 sm:p-6 bg-white text-[#2D2A26] font-sans">
          {/* Document Title Header */}
          <div className="flex items-start justify-between pb-6 border-b border-[#EBE5D9]">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#2D2A26]">
                Scoobies Sales — Executive Performance Report
              </h1>
              <p className="text-xs text-[#8C8376] mt-1 font-medium">
                Comprehensive multi-channel sales and margin briefing
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-[#5F7161]">Report Date: {currentDate}</div>
              <div className="text-[#8C8376] mt-0.5 font-medium">Source: {fileName}</div>
              <div className="text-[#8C8376] font-medium">{totalRecordsCount} transactions</div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-4 gap-4 my-6">
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE5D9]">
              <span className="text-[10px] font-black uppercase text-[#8C8376] tracking-wider">
                Net Revenue
              </span>
              <div className="text-xl font-black text-[#5F7161] mt-1">
                ₹{Math.round(metrics?.totalNetSales || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-[#8C8376]">Gross: ₹{Math.round(metrics?.totalGrossSales || 0).toLocaleString()}</span>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE5D9]">
              <span className="text-[10px] font-black uppercase text-[#8C8376] tracking-wider">
                Units Sold
              </span>
              <div className="text-xl font-black text-[#AF8260] mt-1">
                {(metrics?.totalUnitsSold || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-[#8C8376]">{(metrics?.totalOrders || 0).toLocaleString()} total orders</span>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE5D9]">
              <span className="text-[10px] font-black uppercase text-[#8C8376] tracking-wider">
                Scoobies Margin
              </span>
              <div className="text-xl font-black text-[#5F7161] mt-1">
                ₹{Math.round(metrics?.totalScoobiesMargin || 0).toLocaleString()}
              </div>
              <span className="text-[10px] font-bold text-[#5F7161]">{(metrics?.marginPercentage || 0).toFixed(1)}% margin rate</span>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE5D9]">
              <span className="text-[10px] font-black uppercase text-[#8C8376] tracking-wider">
                Returns Rate
              </span>
              <div className="text-xl font-black text-[#AF8260] mt-1">
                {(metrics?.returnRateQtyPct || 0).toFixed(1)}%
              </div>
              <span className="text-[10px] text-[#8C8376]">₹{Math.round(metrics?.totalReturnedSales || 0).toLocaleString()} refunded</span>
            </div>
          </div>

          {/* Channels & Top Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-xs font-black uppercase text-[#8C8376] tracking-wider mb-2 pb-1 border-b border-[#EBE5D9]">
                Marketplace Performance (Top 10)
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#8C8376] text-left">
                    <th className="pb-1">Channel</th>
                    <th className="pb-1 text-right">Net Sales</th>
                    <th className="pb-1 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EDE5]">
                  {channels.slice(0, 10).map((c) => (
                    <tr key={c.channel}>
                      <td className="py-1.5 font-bold text-[#2D2A26]">{c.channel}</td>
                      <td className="py-1.5 text-right font-black text-[#5F7161]">₹{c.netSales.toLocaleString()}</td>
                      <td className="py-1.5 text-right text-[#AF8260] font-bold">{c.sharePct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-[#8C8376] tracking-wider mb-2 pb-1 border-b border-[#EBE5D9]">
                Top 10 Categories
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#8C8376] text-left">
                    <th className="pb-1">Category</th>
                    <th className="pb-1 text-right">Units</th>
                    <th className="pb-1 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EDE5]">
                  {categories.slice(0, 10).map((cat) => (
                    <tr key={cat.category}>
                      <td className="py-1.5 font-bold text-[#2D2A26]">{cat.category}</td>
                      <td className="py-1.5 text-right text-[#433E37]">{cat.units.toLocaleString()}</td>
                      <td className="py-1.5 text-right font-black text-[#5F7161]">₹{cat.sales.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="mb-6">
            <h4 className="text-xs font-black uppercase text-[#8C8376] tracking-wider mb-2 pb-1 border-b border-[#EBE5D9]">
              Top Revenue Products
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8C8376] text-left">
                  <th className="pb-1">#</th>
                  <th className="pb-1">Product Name</th>
                  <th className="pb-1">Category</th>
                  <th className="pb-1 text-right">Units</th>
                  <th className="pb-1 text-right">Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EDE5]">
                {topProducts.slice(0, 10).map((p, idx) => (
                  <tr key={p.productName}>
                    <td className="py-1.5 text-[#8C8376] font-bold">{idx + 1}</td>
                    <td className="py-1.5 font-bold text-[#2D2A26]">{p.productName}</td>
                    <td className="py-1.5 text-[#8C8376]">{p.category}</td>
                    <td className="py-1.5 text-right font-semibold">{p.units}</td>
                    <td className="py-1.5 text-right font-black text-[#5F7161]">₹{p.netSales.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top 10 Delivery Cities */}
          {cities && cities.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase text-[#8C8376] tracking-wider mb-2 pb-1 border-b border-[#EBE5D9]">
                Top 10 Delivery Cities
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#8C8376] text-left">
                    <th className="pb-1">#</th>
                    <th className="pb-1">City / Destination</th>
                    <th className="pb-1 text-right">Orders</th>
                    <th className="pb-1 text-right">Units</th>
                    <th className="pb-1 text-right">Net Sales</th>
                    <th className="pb-1 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EDE5]">
                  {cities.slice(0, 10).map((c, idx) => (
                    <tr key={`${c.name}-${idx}`}>
                      <td className="py-1.5 text-[#8C8376] font-bold">{idx + 1}</td>
                      <td className="py-1.5 font-bold text-[#2D2A26]">{c.name || 'Unassigned'}</td>
                      <td className="py-1.5 text-right text-[#433E37]">{c.orders.toLocaleString()}</td>
                      <td className="py-1.5 text-right font-semibold">{c.units.toLocaleString()}</td>
                      <td className="py-1.5 text-right font-black text-[#5F7161]">₹{c.sales.toLocaleString()}</td>
                      <td className="py-1.5 text-right text-[#AF8260] font-bold">{c.sharePct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-4 border-t border-[#EBE5D9] flex items-center justify-between text-[11px] text-[#8C8376] font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5F7161]" />
              <span>Verified Sales Intelligence Report</span>
            </div>
            <span>Confidential & Internal Sales Team Use</span>
          </div>
        </div>
      </div>
    </div>
  );
};
