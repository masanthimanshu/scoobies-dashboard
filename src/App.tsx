import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { KpiGrid } from './components/KpiGrid';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { BasketSizeAov } from './components/BasketSizeAov';
import { SalesTrendChart } from './components/SalesTrendChart';
import { ChannelBreakdown } from './components/ChannelBreakdown';
import { ProductCategoryAnalytics } from './components/ProductCategoryAnalytics';
import { GeoAnalytics } from './components/GeoAnalytics';
import { OrdersTable } from './components/OrdersTable';
import { UploadModal } from './components/UploadModal';
import { GoalModal } from './components/GoalModal';
import { PrintReportView } from './components/PrintReportView';

import { INITIAL_CSV_DATA } from './data/sampleCsv';
import { parseSalesCsv } from './utils/csvParser';
import {
  filterRecords,
  computeDashboardMetrics,
  computeTimeSeries,
  computeChannelMetrics,
  computeCategoryMetrics,
  computeProductMetrics,
  computeGeoMetrics,
  generateExecutiveInsights,
} from './utils/analytics';
import { SaleRecord, FilterState } from './types';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  year: 'ALL',
  years: [],
  month: 'ALL',
  months: [],
  week: 'ALL',
  weeks: [],
  dateRangePreset: 'ALL',
  startDate: '',
  endDate: '',
  channels: [],
  categories: [],
  zones: [],
  states: [],
  status: 'ALL',
  campaign: 'ALL',
};

export default function App() {
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [fileName, setFileName] = useState<string>('15-Days-Sales-Report.csv');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [salesTarget, setSalesTarget] = useState<number>(2500000); // default ₹25 Lakh target

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isGoalOpen, setIsGoalOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);

  // Load default dataset on mount
  useEffect(() => {
    async function loadInitial() {
      const parsed = await parseSalesCsv(INITIAL_CSV_DATA);
      setRecords(parsed.records);
    }
    loadInitial();
  }, []);

  const handleResetToSample = async () => {
    const parsed = await parseSalesCsv(INITIAL_CSV_DATA);
    setRecords(parsed.records);
    setFileName('15-Days-Sales-Report.csv');
    setFilters(DEFAULT_FILTERS);
  };

  const handleNewDataLoaded = (newRecords: SaleRecord[], uploadedName: string) => {
    setRecords(newRecords);
    setFileName(uploadedName);
    setFilters(DEFAULT_FILTERS);
    setGranularity('daily');
  };

  // Available metadata for filters
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    records.forEach((r) => {
      const y = Number(r.year);
      if (!isNaN(y) && y > 0) {
        yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a: number, b: number) => b - a);
  }, [records]);

  const availableMonths = useMemo(() => {
    const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set).sort((a, b) => {
      const idxA = MONTH_ORDER.findIndex(
        (m) => m.toLowerCase() === a.toLowerCase() || a.toLowerCase().startsWith(m.toLowerCase())
      );
      const idxB = MONTH_ORDER.findIndex(
        (m) => m.toLowerCase() === b.toLowerCase() || b.toLowerCase().startsWith(m.toLowerCase())
      );
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [records]);

  const availableWeeks = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.week) set.add(r.week);
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [records]);

  const availableChannels = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.channel) set.add(r.channel);
    });
    return Array.from(set).sort();
  }, [records]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [records]);

  const availableZones = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.zone) set.add(r.zone);
    });
    return Array.from(set).sort();
  }, [records]);

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
    return computeGeoMetrics(filteredRecords, 'zone', metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const stateMetrics = useMemo(() => {
    return computeGeoMetrics(filteredRecords, 'state', metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const cityMetrics = useMemo(() => {
    return computeGeoMetrics(filteredRecords, 'city', metrics.totalNetSales);
  }, [filteredRecords, metrics.totalNetSales]);

  const executiveInsights = useMemo(() => {
    return generateExecutiveInsights(
      metrics,
      channelMetrics,
      categoryMetrics,
      productMetrics,
      zoneMetrics,
      filteredRecords
    );
  }, [metrics, channelMetrics, categoryMetrics, productMetrics, zoneMetrics, filteredRecords]);

  // Export Filtered CSV
  const handleExportFilteredCsv = () => {
    if (filteredRecords.length === 0) return;
    const exportData = filteredRecords.map((r) => ({
      Date: r.dateStr,
      Year: r.year,
      Month: r.month,
      Week: r.week,
      'Order Number': r.orderNumber,
      'Customer Name': r.customerName,
      'Bar Code': r.barCode,
      'Product Name': r.productName,
      Color: r.color,
      Category: r.category,
      QTY: r.qty,
      MRP: r.mrp,
      'Sale Value': r.saleValue,
      'Scoobies Margin': r.scoobiesMargin,
      'EX-GST Margin': r.exGstMargin,
      Channel: r.channel,
      Status: r.status,
      Location: r.deliveryPlace,
      State: r.state,
      Zone: r.zone,
      Campaign: r.backToSchool,
    }));

    const csvStr = Papa.unparse(exportData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered_sales_export_${new Date().toISOString().split('T')[0]}.csv`;
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
        netSales={metrics.totalNetSales}
        salesTarget={salesTarget}
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetSample={handleResetToSample}
        onOpenGoal={() => setIsGoalOpen(true)}
        onPrintReport={() => setIsPrintOpen(true)}
        onExportFilteredCsv={handleExportFilteredCsv}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        />

        {/* Basket Size & AOV across Channels */}
        <BasketSizeAov
          channels={channelMetrics}
          metrics={metrics}
        />

        {/* Main Sales Trend Chart */}
        <SalesTrendChart
          data={timeSeriesData}
          granularity={granularity}
          onGranularityChange={setGranularity}
        />

        {/* Marketplace Channel Breakdown */}
        <ChannelBreakdown
          channels={channelMetrics}
        />

        {/* Products & Category Intelligence */}
        <ProductCategoryAnalytics
          categories={categoryMetrics}
          products={productMetrics}
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
        currentSales={metrics.totalNetSales}
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
    </div>
  );
}
