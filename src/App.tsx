import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { UploadCloud } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { FilterBar } from "./components/FilterBar";
import { KpiGrid } from "./components/KpiGrid";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { BasketSizeAov } from "./components/BasketSizeAov";
import { SalesTrendChart } from "./components/SalesTrendChart";
import { ChannelBreakdown } from "./components/ChannelBreakdown";
import { ProductCategoryAnalytics } from "./components/ProductCategoryAnalytics";
import { ReturnAnalysis } from "./components/ReturnAnalysis";
import { GeoAnalytics } from "./components/GeoAnalytics";
import { OrdersTable } from "./components/OrdersTable";
import { UploadModal } from "./components/UploadModal";
import { GoalModal } from "./components/GoalModal";
import { PrintReportView } from "./components/PrintReportView";
import { AiFloatingButton } from "./components/AiFloatingButton";
import { AiAdvisorDrawer } from "./components/AiAdvisorDrawer";

import {
  filterRecords,
  computeDashboardMetrics,
  computeTimeSeries,
  computeChannelMetrics,
  computeCategoryMetrics,
  computeProductMetrics,
  computeGeoMetrics,
  generateExecutiveInsights,
} from "./utils/analytics";
import { buildDistilledContext } from "./utils/aiContextDistiller";
import { isValidFilterOption } from "./utils/formatters";
import { SaleRecord, FilterState } from "./types";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  year: "ALL",
  years: [],
  month: "ALL",
  months: [],
  week: "ALL",
  weeks: [],
  startDate: "",
  endDate: "",
  channels: [],
  categories: [],
  zones: [],
  states: [],
  status: "ALL",
  campaign: "ALL",
};

const MONTH_ORDER = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function extractUniqueValues(
  records: SaleRecord[],
  key: keyof SaleRecord,
): string[] {
  const set = new Set<string>();
  for (let i = 0; i < records.length; i++) {
    const val = records[i][key];
    if (typeof val === "string" && isValidFilterOption(val)) {
      set.add(val.trim());
    }
  }
  return Array.from(set).sort();
}

export default function App() {
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [granularity, setGranularity] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");
  const [salesTarget, setSalesTarget] = useState<number>(2500000); // default ₹25 Lakh target

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isGoalOpen, setIsGoalOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);

  // Global Keyboard Shortcut (⌘J or Ctrl+J to toggle AI panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsAiDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClearData = () => {
    setRecords([]);
    setFileName("");
    setFilters(DEFAULT_FILTERS);
  };

  const handleNewDataLoaded = (
    newRecords: SaleRecord[],
    uploadedName: string,
  ) => {
    setRecords(newRecords);
    setFileName(uploadedName);
    setFilters(DEFAULT_FILTERS);
    setGranularity("daily");
  };

  // Available metadata for filters
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    for (let i = 0; i < records.length; i++) {
      const y = Number(records[i].year);
      if (!isNaN(y) && y > 0) {
        yearsSet.add(y);
      }
    }
    return Array.from(yearsSet).sort((a: number, b: number) => b - a);
  }, [records]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < records.length; i++) {
      const m = records[i].month;
      if (isValidFilterOption(m)) set.add(m);
    }
    return Array.from(set).sort((a, b) => {
      const idxA = MONTH_ORDER.findIndex(
        (m) =>
          m.toLowerCase() === a.toLowerCase() ||
          a.toLowerCase().startsWith(m.toLowerCase()),
      );
      const idxB = MONTH_ORDER.findIndex(
        (m) =>
          m.toLowerCase() === b.toLowerCase() ||
          b.toLowerCase().startsWith(m.toLowerCase()),
      );
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [records]);

  const availableWeeks = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < records.length; i++) {
      const w = records[i].week;
      if (isValidFilterOption(w)) set.add(w);
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [records]);

  const availableChannels = useMemo(
    () => extractUniqueValues(records, "channel"),
    [records],
  );

  const availableCategories = useMemo(
    () => extractUniqueValues(records, "category"),
    [records],
  );

  const availableZones = useMemo(
    () => extractUniqueValues(records, "zone"),
    [records],
  );

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters);
  }, [records, filters]);

  // Analytics
  const metrics = useMemo(() => {
    return computeDashboardMetrics(filteredRecords);
  }, [filteredRecords]);

  const timeSeriesData = useMemo(() => {
    return computeTimeSeries(filteredRecords, granularity);
  }, [filteredRecords, granularity]);

  const channelMetrics = useMemo(() => {
    return computeChannelMetrics(filteredRecords, metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const categoryMetrics = useMemo(() => {
    return computeCategoryMetrics(filteredRecords, metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const productMetrics = useMemo(() => {
    return computeProductMetrics(filteredRecords, metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const zoneMetrics = useMemo(() => {
    return computeGeoMetrics(filteredRecords, "zone", metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const stateMetrics = useMemo(() => {
    return computeGeoMetrics(filteredRecords, "state", metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const cityMetrics = useMemo(() => {
    return computeGeoMetrics(filteredRecords, "city", metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const executiveInsights = useMemo(() => {
    return generateExecutiveInsights(
      metrics,
      channelMetrics,
      productMetrics,
      zoneMetrics,
      filteredRecords,
    );
  }, [metrics, channelMetrics, productMetrics, zoneMetrics, filteredRecords]);

  // Distilled context for Groq GPT OSS 120B
  const distilledContext = useMemo(() => {
    return buildDistilledContext(
      filteredRecords,
      metrics,
      channelMetrics,
      categoryMetrics,
      productMetrics,
      zoneMetrics,
      stateMetrics,
      timeSeriesData,
      salesTarget,
      filters,
      fileName,
    );
  }, [
    filteredRecords,
    metrics,
    channelMetrics,
    categoryMetrics,
    productMetrics,
    zoneMetrics,
    stateMetrics,
    timeSeriesData,
    salesTarget,
    filters,
    fileName,
  ]);

  const handleOpenAiDeepDive = (prompt?: string) => {
    if (prompt) setAiInitialPrompt(prompt);
    setIsAiDrawerOpen(true);
  };

  // Export Filtered CSV
  const handleExportFilteredCsv = () => {
    if (filteredRecords.length === 0) return;
    const exportData = filteredRecords.map((r) => ({
      Date: r.dateStr,
      Year: r.year,
      Month: r.month,
      Week: r.week,
      "Order Number": r.orderNumber,
      "Customer Name": r.customerName,
      "Bar Code": r.barCode,
      "Product Name": r.productName,
      Color: r.color,
      Category: r.category,
      QTY: r.qty,
      MRP: r.mrp,
      "Sale Value": r.saleValue,
      "Scoobies Margin": r.scoobiesMargin,
      "EX-GST Margin": r.exGstMargin,
      Channel: r.channel,
      Status: r.status,
      Location: r.deliveryPlace,
      State: r.state,
      Zone: r.zone,
      Campaign: r.backToSchool,
    }));

    const csvStr = Papa.unparse(exportData);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `filtered_sales_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#433E37] font-sans antialiased selection:bg-[#5F7161] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        fileName={fileName}
        totalRows={records.length}
        filteredRows={filteredRecords.length}
        salesTarget={salesTarget}
        onOpenUpload={() => setIsUploadOpen(true)}
        onClearData={handleClearData}
        onOpenGoal={() => setIsGoalOpen(true)}
        onPrintReport={() => setIsPrintOpen(true)}
        onExportFilteredCsv={handleExportFilteredCsv}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Empty State Banner when no dataset is loaded */}
        {records.length === 0 && (
          <div className="bg-white border-2 border-dashed border-[#5F7161]/30 rounded-[32px] p-8 sm:p-12 mb-8 text-center shadow-xs">
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-[#E9EFEA] text-[#5F7161] flex items-center justify-center mb-4 shadow-inner border border-[#C5D5C7]">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#2D2A26] tracking-tight mb-2">
                No Sales Data Loaded
              </h2>
              <p className="text-sm text-[#8C8376] font-medium mb-6">
                Upload your sales CSV report to explore real-time revenue KPIs,
                channel breakdowns, product margins, return analytics, and AI
                strategic insights.
              </p>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-bold text-white bg-[#5F7161] hover:bg-[#4E5E50] rounded-2xl transition-all shadow-md shadow-[#5F7161]/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Import Sales CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          availableYears={availableYears}
          availableMonths={availableMonths}
          availableWeeks={availableWeeks}
          availableChannels={availableChannels}
          availableCategories={availableCategories}
          availableZones={availableZones}
        />

        {/* KPI Cards */}
        <KpiGrid
          metrics={metrics}
          salesTarget={salesTarget}
          onOpenGoalModal={() => setIsGoalOpen(true)}
        />

        {/* Executive Highlights & Actionable Insights */}
        <ExecutiveSummary
          insights={executiveInsights}
          totalRecordsCount={filteredRecords.length}
          onOpenAiDeepDive={handleOpenAiDeepDive}
        />

        {/* Basket Size & AOV across Channels */}
        <BasketSizeAov channels={channelMetrics} metrics={metrics} />

        {/* Main Sales Trend Chart */}
        <SalesTrendChart
          data={timeSeriesData}
          granularity={granularity}
          onGranularityChange={setGranularity}
        />

        {/* Marketplace Channel Breakdown */}
        <ChannelBreakdown channels={channelMetrics} />

        {/* Products & Category Intelligence */}
        <ProductCategoryAnalytics
          categories={categoryMetrics}
          products={productMetrics}
        />

        {/* Dedicated Return & Refund Analysis Section */}
        <ReturnAnalysis
          records={filteredRecords}
          products={productMetrics}
          channels={channelMetrics}
          metrics={metrics}
        />

        {/* Regional & Geographic Leaderboard */}
        <GeoAnalytics
          zones={zoneMetrics}
          states={stateMetrics}
          cities={cityMetrics}
        />

        {/* Data Explorer Table */}
        <OrdersTable
          records={filteredRecords}
          onExportCsv={handleExportFilteredCsv}
        />
      </main>

      {/* Upload CSV Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleNewDataLoaded}
      />

      {/* Target Goal Modal */}
      <GoalModal
        isOpen={isGoalOpen}
        onClose={() => setIsGoalOpen(false)}
        currentGoal={salesTarget}
        currentMargin={metrics.totalScoobiesMargin}
        onSaveGoal={setSalesTarget}
      />

      {/* Print / Export Report Modal */}
      <PrintReportView
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        metrics={metrics}
        channels={channelMetrics}
        categories={categoryMetrics}
        topProducts={productMetrics}
        cities={cityMetrics}
        fileName={fileName}
        totalRecordsCount={filteredRecords.length}
      />

      {/* Floating Action Button (Bottom-Right) */}
      <AiFloatingButton
        isOpen={isAiDrawerOpen}
        onClick={() => setIsAiDrawerOpen(true)}
        filteredCount={filteredRecords.length}
      />

      {/* Right Slide-over AI Advisor Drawer */}
      <AiAdvisorDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        distilledContext={distilledContext}
        rawRecords={filteredRecords}
        initialPrompt={aiInitialPrompt}
        onClearInitialPrompt={() => setAiInitialPrompt(null)}
      />
    </div>
  );
}
