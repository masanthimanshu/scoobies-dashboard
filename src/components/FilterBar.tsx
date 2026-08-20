import React, { useState } from 'react';
import { 
  X, 
  SlidersHorizontal,
  ShoppingBag,
  Store,
  MapPin,
  Sparkles,
  RotateCcw,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableYears: number[];
  availableMonths?: string[];
  availableWeeks?: string[];
  availableChannels: string[];
  availableCategories: string[];
  availableZones: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableYears,
  availableMonths = [],
  availableWeeks = [],
  availableChannels,
  availableCategories,
  availableZones,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Multi-select derived arrays
  const selectedYears = filters.years && filters.years.length > 0
    ? filters.years
    : (filters.year && filters.year !== 'ALL' ? [filters.year] : []);

  const selectedMonths = filters.months && filters.months.length > 0
    ? filters.months
    : (filters.month && filters.month !== 'ALL' ? [filters.month] : []);

  const selectedWeeks = filters.weeks && filters.weeks.length > 0
    ? filters.weeks
    : (filters.week && filters.week !== 'ALL' ? [filters.week] : []);

  const toggleYear = (yr: string) => {
    if (yr === 'ALL') {
      onFilterChange({ ...filters, years: [], year: 'ALL' });
      return;
    }
    const exists = selectedYears.includes(yr);
    const next = exists ? selectedYears.filter((y) => y !== yr) : [...selectedYears, yr];
    onFilterChange({
      ...filters,
      years: next,
      year: next.length === 1 ? next[0] : (next.length === 0 ? 'ALL' : 'CUSTOM'),
    });
  };

  const toggleMonth = (m: string) => {
    if (m === 'ALL') {
      onFilterChange({ ...filters, months: [], month: 'ALL' });
      return;
    }
    const exists = selectedMonths.some((x) => x.toLowerCase() === m.toLowerCase());
    const next = exists
      ? selectedMonths.filter((x) => x.toLowerCase() !== m.toLowerCase())
      : [...selectedMonths, m];
    onFilterChange({
      ...filters,
      months: next,
      month: next.length === 1 ? next[0] : (next.length === 0 ? 'ALL' : 'CUSTOM'),
    });
  };

  const toggleWeek = (w: string) => {
    if (w === 'ALL') {
      onFilterChange({ ...filters, weeks: [], week: 'ALL' });
      return;
    }
    const exists = selectedWeeks.some((x) => x.toLowerCase() === w.toLowerCase());
    const next = exists
      ? selectedWeeks.filter((x) => x.toLowerCase() !== w.toLowerCase())
      : [...selectedWeeks, w];
    onFilterChange({
      ...filters,
      weeks: next,
      week: next.length === 1 ? next[0] : (next.length === 0 ? 'ALL' : 'CUSTOM'),
    });
  };

  const handleStatusChange = (status: FilterState['status']) => {
    onFilterChange({ ...filters, status });
  };

  const handleCampaignChange = (campaign: FilterState['campaign']) => {
    onFilterChange({ ...filters, campaign });
  };

  const toggleChannel = (ch: string) => {
    const next = filters.channels.includes(ch)
      ? filters.channels.filter((c) => c !== ch)
      : [...filters.channels, ch];
    onFilterChange({ ...filters, channels: next });
  };

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: next });
  };

  const toggleZone = (z: string) => {
    const next = filters.zones.includes(z)
      ? filters.zones.filter((item) => item !== z)
      : [...filters.zones, z];
    onFilterChange({ ...filters, zones: next });
  };

  const resetAllFilters = () => {
    onFilterChange({
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
    });
  };

  const activeFilterCount =
    selectedYears.length +
    selectedMonths.length +
    selectedWeeks.length +
    (filters.startDate || filters.endDate ? 1 : 0) +
    filters.channels.length +
    filters.categories.length +
    filters.zones.length +
    filters.states.length +
    (filters.status !== 'ALL' ? 1 : 0) +
    (filters.campaign !== 'ALL' ? 1 : 0);

  // Filter out invalid/empty strings for clean UI
  const validZones = availableZones.filter((z) => z && z !== '#N/A' && z !== 'N/A');
  const validChannels = availableChannels.filter((c) => c && c !== '#N/A' && c !== 'N/A');
  const validCategories = availableCategories.filter((c) => c && c !== '#N/A' && c !== 'N/A');

  // Determine recent years and extra years for clean display without overflow
  const showCompactYears = availableYears.length <= 4;
  const recentYears = showCompactYears ? availableYears : availableYears.slice(0, 3);
  const isOlderYearSelected = !showCompactYears && selectedYears.some((yr) => !recentYears.includes(Number(yr)));

  // Determine month options
  const validMonths = availableMonths.filter((m) => m && m !== '#N/A' && m !== 'N/A');
  const showCompactMonths = validMonths.length <= 4;
  const recentMonths = showCompactMonths ? validMonths : validMonths.slice(0, 3);
  const isOlderMonthSelected = !showCompactMonths && selectedMonths.some((m) => !recentMonths.some((rm) => rm.toLowerCase() === m.toLowerCase()));

  // Determine week options
  const validWeeks = availableWeeks.filter((w) => w && w !== '#N/A' && w !== 'N/A');
  const showCompactWeeks = validWeeks.length <= 4;
  const recentWeeks = showCompactWeeks ? validWeeks : validWeeks.slice(0, 3);
  const isOlderWeekSelected = !showCompactWeeks && selectedWeeks.some((w) => !recentWeeks.some((rw) => rw.toLowerCase() === w.toLowerCase()));

  return (
    <div className="bg-white border border-[#EBE5D9] rounded-[24px] shadow-sm p-4 sm:p-5 mb-6">
      {/* Primary Row - Clean, Spacious, No Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Year filter, Month filter, Status filter & Week filter */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Year Filter Controls (Multi-Select) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider mr-1">Year:</span>
            
            <div className="flex items-center gap-1 bg-[#F1EDE5] p-1 rounded-xl border border-[#EBE5D9]">
              <button
                onClick={() => toggleYear('ALL')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedYears.length === 0
                    ? 'bg-[#2D2A26] text-white shadow-2xs font-extrabold'
                    : 'text-[#8C8376] hover:text-[#2D2A26]'
                }`}
              >
                All Years
              </button>

              {recentYears.map((yr) => {
                const isSelected = selectedYears.includes(String(yr));
                return (
                  <button
                    key={yr}
                    onClick={() => toggleYear(String(yr))}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-[#5F7161] text-white shadow-2xs font-extrabold'
                        : 'text-[#8C8376] hover:text-[#2D2A26]'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}

              {/* Dropdown for older years when dataset spans > 4 years */}
              {!showCompactYears && (
                <div className="relative inline-flex items-center">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) toggleYear(e.target.value);
                    }}
                    className={`pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer appearance-none focus:outline-none ${
                      isOlderYearSelected
                        ? 'bg-[#5F7161] text-white shadow-2xs'
                        : 'bg-transparent text-[#8C8376] hover:text-[#2D2A26]'
                    }`}
                  >
                    <option value="" disabled className="bg-white text-[#2D2A26]">
                      {isOlderYearSelected ? `${selectedYears.filter((yr) => !recentYears.includes(Number(yr))).join(', ')}` : 'More ▾'}
                    </option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={String(yr)} className="bg-white text-[#2D2A26]">
                        {selectedYears.includes(String(yr)) ? `✓ ${yr}` : String(yr)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`w-3 h-3 absolute right-2 pointer-events-none ${
                    isOlderYearSelected ? 'text-white' : 'text-[#8C8376]'
                  }`} />
                </div>
              )}
            </div>
          </div>

          {/* Month Filter Controls (Multi-Select) */}
          {validMonths.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider mr-1">Month:</span>
              
              <div className="flex items-center gap-1 bg-[#F1EDE5] p-1 rounded-xl border border-[#EBE5D9]">
                <button
                  onClick={() => toggleMonth('ALL')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedMonths.length === 0
                      ? 'bg-[#2D2A26] text-white shadow-2xs font-extrabold'
                      : 'text-[#8C8376] hover:text-[#2D2A26]'
                  }`}
                >
                  All Months
                </button>

                {recentMonths.map((m) => {
                  const isSelected = selectedMonths.some((x) => x.toLowerCase() === m.toLowerCase());
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMonth(m)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-[#5F7161] text-white shadow-2xs font-extrabold'
                          : 'text-[#8C8376] hover:text-[#2D2A26]'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}

                {/* Dropdown for extra months when dataset spans > 4 months */}
                {!showCompactMonths && (
                  <div className="relative inline-flex items-center">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) toggleMonth(e.target.value);
                      }}
                      className={`pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer appearance-none focus:outline-none ${
                        isOlderMonthSelected
                          ? 'bg-[#5F7161] text-white shadow-2xs'
                          : 'bg-transparent text-[#8C8376] hover:text-[#2D2A26]'
                      }`}
                    >
                      <option value="" disabled className="bg-white text-[#2D2A26]">
                        {isOlderMonthSelected ? `${selectedMonths.filter((m) => !recentMonths.some((rm) => rm.toLowerCase() === m.toLowerCase())).join(', ')}` : 'More ▾'}
                      </option>
                      {validMonths.map((m) => (
                        <option key={m} value={m} className="bg-white text-[#2D2A26]">
                          {selectedMonths.some((x) => x.toLowerCase() === m.toLowerCase()) ? `✓ ${m}` : m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`w-3 h-3 absolute right-2 pointer-events-none ${
                      isOlderMonthSelected ? 'text-white' : 'text-[#8C8376]'
                    }`} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Filter (Positioned BEFORE Week) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider mr-1">Status:</span>
            <div className="flex items-center gap-1 bg-[#F1EDE5] p-1 rounded-xl border border-[#EBE5D9]">
              <button
                onClick={() => handleStatusChange('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filters.status === 'ALL'
                    ? 'bg-white text-[#2D2A26] shadow-2xs font-extrabold'
                    : 'text-[#8C8376] hover:text-[#2D2A26]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusChange('Dispatched')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filters.status === 'Dispatched'
                    ? 'bg-[#5F7161] text-white shadow-2xs'
                    : 'text-[#8C8376] hover:text-[#2D2A26]'
                }`}
              >
                Dispatched
              </button>
              <button
                onClick={() => handleStatusChange('Return')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filters.status === 'Return'
                    ? 'bg-[#AF8260] text-white shadow-2xs'
                    : 'text-[#8C8376] hover:text-[#2D2A26]'
                }`}
              >
                Returns
              </button>
            </div>
          </div>

          {/* Week Filter Controls (Multi-Select, Positioned AFTER Status) */}
          {validWeeks.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider mr-1">Week:</span>
              
              <div className="flex items-center gap-1 bg-[#F1EDE5] p-1 rounded-xl border border-[#EBE5D9]">
                <button
                  onClick={() => toggleWeek('ALL')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedWeeks.length === 0
                      ? 'bg-[#2D2A26] text-white shadow-2xs font-extrabold'
                      : 'text-[#8C8376] hover:text-[#2D2A26]'
                  }`}
                >
                  All Weeks
                </button>

                {recentWeeks.map((w) => {
                  const isSelected = selectedWeeks.some((x) => x.toLowerCase() === w.toLowerCase());
                  return (
                    <button
                      key={w}
                      onClick={() => toggleWeek(w)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-[#5F7161] text-white shadow-2xs font-extrabold'
                          : 'text-[#8C8376] hover:text-[#2D2A26]'
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}

                {/* Dropdown for extra weeks when dataset spans > 4 weeks */}
                {!showCompactWeeks && (
                  <div className="relative inline-flex items-center">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) toggleWeek(e.target.value);
                      }}
                      className={`pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer appearance-none focus:outline-none ${
                        isOlderWeekSelected
                          ? 'bg-[#5F7161] text-white shadow-2xs'
                          : 'bg-transparent text-[#8C8376] hover:text-[#2D2A26]'
                      }`}
                    >
                      <option value="" disabled className="bg-white text-[#2D2A26]">
                        {isOlderWeekSelected ? `${selectedWeeks.filter((w) => !recentWeeks.some((rw) => rw.toLowerCase() === w.toLowerCase())).join(', ')}` : 'More ▾'}
                      </option>
                      {validWeeks.map((w) => (
                        <option key={w} value={w} className="bg-white text-[#2D2A26]">
                          {selectedWeeks.some((x) => x.toLowerCase() === w.toLowerCase()) ? `✓ ${w}` : w}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`w-3 h-3 absolute right-2 pointer-events-none ${
                      isOlderWeekSelected ? 'text-white' : 'text-[#8C8376]'
                    }`} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Advanced Filters Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-[#FAF0E6] border-[#E8D2C2] text-[#AF8260]'
                : 'bg-[#F9F7F2] border-[#EBE5D9] text-[#433E37] hover:bg-[#F1EDE5]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Channels & Zones</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#AF8260] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="p-2 text-xs text-[#AF8260] hover:bg-[#FAF0E6] rounded-xl transition-colors border border-[#E8D2C2]"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-[#EBE5D9] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs animate-in fade-in duration-200">
          {/* Sales Channels */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-[#2D2A26] uppercase tracking-wider text-[11px] mb-2.5">
              <Store className="w-3.5 h-3.5 text-[#5F7161]" />
              Marketplaces ({validChannels.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {validChannels.map((ch) => {
                const isSelected = filters.channels.includes(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#5F7161] text-white border-[#4A594C]'
                        : 'bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-[#2D2A26] uppercase tracking-wider text-[11px] mb-2.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#AF8260]" />
              Categories ({validCategories.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {validCategories.map((cat) => {
                const isSelected = filters.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#AF8260] text-white border-[#8D6546]'
                        : 'bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regional Zones & Campaign */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-[#2D2A26] uppercase tracking-wider text-[11px] mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-[#5F7161]" />
              Regional Zones
            </label>
            <div className="flex flex-wrap gap-1.5">
              {validZones.map((z) => {
                const isSelected = filters.zones.includes(z);
                return (
                  <button
                    key={z}
                    onClick={() => toggleZone(z)}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#5F7161] text-white border-[#4A594C]'
                        : 'bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]'
                    }`}
                  >
                    {z}
                  </button>
                );
              })}
            </div>

            {/* Campaign Selection */}
            <div className="mt-3.5">
              <label className="flex items-center gap-1.5 font-bold text-[#2D2A26] uppercase tracking-wider text-[11px] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#E7AB79]" />
                Campaign Category
              </label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleCampaignChange('ALL')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                    filters.campaign === 'ALL'
                      ? 'bg-[#2D2A26] text-white border-[#2D2A26]'
                      : 'bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleCampaignChange('B2S')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                    filters.campaign === 'B2S'
                      ? 'bg-[#AF8260] text-white border-[#8D6546]'
                      : 'bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]'
                  }`}
                >
                  Back To School (B2S)
                </button>
                <button
                  onClick={() => handleCampaignChange('NON_B2S')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                    filters.campaign === 'NON_B2S'
                      ? 'bg-[#5F7161] text-white border-[#4A594C]'
                      : 'bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]'
                  }`}
                >
                  Standard
                </button>
              </div>
            </div>
          </div>

          {/* Date Window */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-[#2D2A26] uppercase tracking-wider text-[11px] mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-[#5F7161]" />
              Custom Date Window
            </label>
            <div className="space-y-2.5">
              <div>
                <span className="text-[11px] font-semibold text-[#8C8376]">Start Date:</span>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-[#F9F7F2] border border-[#EBE5D9] rounded-lg font-medium text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#5F7161]"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#8C8376]">End Date:</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-[#F9F7F2] border border-[#EBE5D9] rounded-lg font-medium text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#5F7161]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-[#EBE5D9] text-xs">
          <span className="text-[#8C8376] text-[11px] font-bold uppercase tracking-wider mr-1">Active filters:</span>
          {selectedYears.map((yr) => (
            <span key={yr} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9EFEA] text-[#5F7161] font-semibold border border-[#C5D5C7]">
              Year: {yr}
              <button onClick={() => toggleYear(yr)} className="cursor-pointer">
                <X className="w-3 h-3 text-[#5F7161] hover:text-[#2D2A26]" />
              </button>
            </span>
          ))}
          {selectedMonths.map((m) => (
            <span key={m} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9EFEA] text-[#5F7161] font-semibold border border-[#C5D5C7]">
              Month: {m}
              <button onClick={() => toggleMonth(m)} className="cursor-pointer">
                <X className="w-3 h-3 text-[#5F7161] hover:text-[#2D2A26]" />
              </button>
            </span>
          ))}
          {filters.status !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1EDE5] text-[#2D2A26] font-semibold border border-[#E4DCD0]">
              Status: {filters.status}
              <button onClick={() => onFilterChange({ ...filters, status: 'ALL' })}>
                <X className="w-3 h-3 text-[#8C8376] hover:text-[#2D2A26]" />
              </button>
            </span>
          )}
          {selectedWeeks.map((w) => (
            <span key={w} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9EFEA] text-[#5F7161] font-semibold border border-[#C5D5C7]">
              Week: {w}
              <button onClick={() => toggleWeek(w)} className="cursor-pointer">
                <X className="w-3 h-3 text-[#5F7161] hover:text-[#2D2A26]" />
              </button>
            </span>
          ))}
          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1EDE5] text-[#2D2A26] font-semibold border border-[#E4DCD0]">
              Date: {filters.startDate || 'Start'} to {filters.endDate || 'End'}
              <button onClick={() => onFilterChange({ ...filters, startDate: '', endDate: '' })} className="cursor-pointer">
                <X className="w-3 h-3 text-[#8C8376] hover:text-[#2D2A26]" />
              </button>
            </span>
          )}
          {filters.channels.map((ch) => (
            <span key={ch} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9EFEA] text-[#5F7161] font-semibold border border-[#C5D5C7]">
              Channel: {ch}
              <button onClick={() => toggleChannel(ch)}>
                <X className="w-3 h-3 text-[#5F7161] hover:text-[#2D2A26]" />
              </button>
            </span>
          ))}
          {filters.categories.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#AF8260] font-semibold border border-[#E8D2C2]">
              Category: {cat}
              <button onClick={() => toggleCategory(cat)}>
                <X className="w-3 h-3 text-[#AF8260] hover:text-[#2D2A26]" />
              </button>
            </span>
          ))}
          {filters.zones.map((z) => (
            <span key={z} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9EFEA] text-[#5F7161] font-semibold border border-[#C5D5C7]">
              Zone: {z}
              <button onClick={() => toggleZone(z)}>
                <X className="w-3 h-3 text-[#5F7161] hover:text-[#2D2A26]" />
              </button>
            </span>
          ))}
          {filters.status !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1EDE5] text-[#2D2A26] font-semibold border border-[#E4DCD0]">
              Status: {filters.status}
              <button onClick={() => onFilterChange({ ...filters, status: 'ALL' })}>
                <X className="w-3 h-3 text-[#8C8376] hover:text-[#2D2A26]" />
              </button>
            </span>
          )}
          {filters.campaign !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#AF8260] font-semibold border border-[#E8D2C2]">
              Campaign: {filters.campaign === 'B2S' ? 'Back To School' : 'Standard'}
              <button onClick={() => onFilterChange({ ...filters, campaign: 'ALL' })}>
                <X className="w-3 h-3 text-[#AF8260] hover:text-[#2D2A26]" />
              </button>
            </span>
          )}
          <button
            onClick={resetAllFilters}
            className="text-[11px] text-[#AF8260] hover:underline font-bold ml-auto"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
