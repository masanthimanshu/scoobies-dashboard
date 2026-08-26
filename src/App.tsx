import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
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
import { AiFloatingButton } from "./components/AiFloatingButton";

// Code-split heavy modals and drawers
const UploadModal = lazy(() =>
  import("./components/UploadModal").then((m) => ({ default: m.UploadModal })),
);
const GoalModal = lazy(() =>
  import("./components/GoalModal").then((m) => ({ default: m.GoalModal })),
);
const PrintReportView = lazy(() =>
  import("./components/PrintReportView").then((m) => ({
    default: m.PrintReportView,
  })),
);
const AiAdvisorDrawer = lazy(() =>
  import("./components/AiAdvisorDrawer").then((m) => ({
    default: m.AiAdvisorDrawer,
  })),
);

import {
  filterRecords,
  computeAllAnalytics,
  generateExecutiveInsights,
} from "./utils/analytics";
import { buildDistilledContext } from "./utils/aiContextDistiller";
import { exportRecordsToCsv } from "./utils/csvParser";
import {
  isValidFilterOption,
  sortMonthList,
  sortWeekList,
} from "./utils/formatters";
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

  const handleClearData = useCallback(() => {
    setRecords([]);
    setFileName("");
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleNewDataLoaded = useCallback(
    (newRecords: SaleRecord[], uploadedName: string) => {
      setRecords(newRecords);
      setFileName(uploadedName);
      setFilters(DEFAULT_FILTERS);
      setGranularity("daily");
    },
    [],
  );

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleGranularityChange = useCallback(
    (g: "daily" | "weekly" | "monthly" | "yearly") => {
      setGranularity(g);
    },
    [],
  );

  const handleSaveGoal = useCallback((goal: number) => {
    setSalesTarget(goal);
  }, []);

  const handleOpenUpload = useCallback(() => setIsUploadOpen(true), []);
  const handleCloseUpload = useCallback(() => setIsUploadOpen(false), []);
  const handleOpenGoal = useCallback(() => setIsGoalOpen(true), []);
  const handleCloseGoal = useCallback(() => setIsGoalOpen(false), []);
  const handleOpenPrint = useCallback(() => setIsPrintOpen(true), []);
  const handleClosePrint = useCallback(() => setIsPrintOpen(false), []);
  const handleOpenAi = useCallback(() => setIsAiDrawerOpen(true), []);
  const handleCloseAi = useCallback(() => setIsAiDrawerOpen(false), []);
  const handleClearInitialPrompt = useCallback(
    () => setAiInitialPrompt(null),
    [],
  );

  // Extract all available filter metadata in a single O(N) pass
  const {
    availableYears,
    availableMonths,
    availableWeeks,
    availableChannels,
    availableCategories,
    availableZones,
  } = useMemo(() => {
    const yearsSet = new Set<number>();
    const monthsSet = new Set<string>();
    const weeksSet = new Set<string>();
    const channelsSet = new Set<string>();
    const categoriesSet = new Set<string>();
    const zonesSet = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.year && !isNaN(r.year)) yearsSet.add(r.year);
      if (isValidFilterOption(r.month)) monthsSet.add(r.month.trim());
      if (isValidFilterOption(r.week)) weeksSet.add(r.week.trim());
      if (isValidFilterOption(r.channel)) channelsSet.add(r.channel.trim());
      if (isValidFilterOption(r.category)) categoriesSet.add(r.category.trim());
      if (isValidFilterOption(r.zone)) zonesSet.add(r.zone.trim());
    }

    return {
      availableYears: Array.from(yearsSet).sort((a, b) => b - a),
      availableMonths: sortMonthList(Array.from(monthsSet)),
      availableWeeks: sortWeekList(Array.from(weeksSet)),
      availableChannels: Array.from(channelsSet).sort(),
      availableCategories: Array.from(categoriesSet).sort(),
      availableZones: Array.from(zonesSet).sort(),
    };
  }, [records]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters);
  }, [records, filters]);

  // Unified single-pass analytics computation
  const {
    metrics,
    timeSeriesData,
    channelMetrics,
    categoryMetrics,
    productMetrics,
    zoneMetrics,
    stateMetrics,
    cityMetrics,
  } = useMemo(() => {
    return computeAllAnalytics(filteredRecords, granularity);
  }, [filteredRecords, granularity]);

  const executiveInsights = useMemo(() => {
    return generateExecutiveInsights(
      metrics,
      channelMetrics,
      productMetrics,
      zoneMetrics,
      filteredRecords,
    );
  }, [metrics, channelMetrics, productMetrics, zoneMetrics, filteredRecords]);

  // Distilled context for Groq GPT OSS 120B (deferred only when AI drawer is open)
  const distilledContext = useMemo(() => {
    if (!isAiDrawerOpen) return null;
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
    isAiDrawerOpen,
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

  const handleOpenAiDeepDive = useCallback((prompt?: string) => {
    if (prompt) setAiInitialPrompt(prompt);
    setIsAiDrawerOpen(true);
  }, []);

  // Export Filtered CSV
  const handleExportFilteredCsv = useCallback(() => {
    exportRecordsToCsv(filteredRecords);
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#433E37] font-sans antialiased selection:bg-[#5F7161] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        fileName={fileName}
        totalRows={records.length}
        filteredRows={filteredRecords.length}
        salesTarget={salesTarget}
        onOpenUpload={handleOpenUpload}
        onClearData={handleClearData}
        onOpenGoal={handleOpenGoal}
        onPrintReport={handleOpenPrint}
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
                onClick={handleOpenUpload}
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
          onFilterChange={handleFilterChange}
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
          onOpenGoalModal={handleOpenGoal}
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
          onGranularityChange={handleGranularityChange}
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

      {/* Lazy-loaded Modals and Drawers */}
      {isUploadOpen && (
        <Suspense fallback={null}>
          <UploadModal
            isOpen={isUploadOpen}
            onClose={handleCloseUpload}
            onDataLoaded={handleNewDataLoaded}
          />
        </Suspense>
      )}

      {isGoalOpen && (
        <Suspense fallback={null}>
          <GoalModal
            isOpen={isGoalOpen}
            onClose={handleCloseGoal}
            currentGoal={salesTarget}
            currentMargin={metrics.totalScoobiesMargin}
            onSaveGoal={handleSaveGoal}
          />
        </Suspense>
      )}

      {isPrintOpen && (
        <Suspense fallback={null}>
          <PrintReportView
            isOpen={isPrintOpen}
            onClose={handleClosePrint}
            metrics={metrics}
            channels={channelMetrics}
            categories={categoryMetrics}
            topProducts={productMetrics}
            cities={cityMetrics}
            fileName={fileName}
            totalRecordsCount={filteredRecords.length}
          />
        </Suspense>
      )}

      {/* Floating Action Button (Bottom-Right) */}
      <AiFloatingButton
        isOpen={isAiDrawerOpen}
        onClick={handleOpenAi}
        filteredCount={filteredRecords.length}
      />

      {/* Right Slide-over AI Advisor Drawer */}
      {isAiDrawerOpen && distilledContext && (
        <Suspense fallback={null}>
          <AiAdvisorDrawer
            isOpen={isAiDrawerOpen}
            onClose={handleCloseAi}
            distilledContext={distilledContext}
            rawRecords={filteredRecords}
            initialPrompt={aiInitialPrompt}
            onClearInitialPrompt={handleClearInitialPrompt}
          />
        </Suspense>
      )}
    </div>
  );
}
