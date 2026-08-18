import React, { useState } from 'react';
import { 
  Search, 
  X, 
  SlidersHorizontal,
  ShoppingBag,
  Store,
  MapPin,
  Sparkles,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableYears: number[];
  availableChannels: string[];
  availableCategories: string[];
  availableZones: string[];
  availableStates: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableYears,
  availableChannels,
  availableCategories,
  availableZones,
  availableStates,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleYearChange = (year: string) => {
    onFilterChange({ ...filters, year });
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
      month: 'ALL',
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
    (filters.search ? 1 : 0) +
    (filters.year !== 'ALL' ? 1 : 0) +
    (filters.month !== 'ALL' ? 1 : 0) +
    (filters.startDate || filters.endDate ? 1 : 0) +
    filters.channels.length +
    filters.categories.length +
    filters.zones.length +
    filters.states.length +
    (filters.status !== 'ALL' ? 1 : 0) +
    (filters.campaign !== 'ALL' ? 1 : 0);

  return (
    <div className="bg-white border border-[#EBE5D9] rounded-[24px] shadow-sm p-4 sm:p-5 mb-6">
      {/* Primary Row */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8376]" />
          <input
            type="text"
            placeholder="Search product, customer, order #, city, or category..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-8 py-2.5 text-sm bg-[#F9F7F2] border border-[#EBE5D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5F7161] focus:bg-white text-[#2D2A26] placeholder-[#8C8376] font-medium transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8376] hover:text-[#2D2A26] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Year Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider mr-1 shrink-0">Year:</span>
          <button
            onClick={() => handleYearChange('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 ${
              filters.year === 'ALL'
                ? 'bg-[#2D2A26] text-white shadow-2xs'
                : 'bg-[#F9F7F2] text-[#8C8376] border border-[#EBE5D9] hover:bg-[#F1EDE5]'
            }`}
          >
            All Years
          </button>
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => handleYearChange(String(yr))}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 ${
                filters.year === String(yr)
                  ? 'bg-[#5F7161] text-white shadow-2xs'
                  : 'bg-[#F9F7F2] text-[#8C8376] border border-[#EBE5D9] hover:bg-[#F1EDE5]'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#F1EDE5] p-1 rounded-xl border border-[#EBE5D9] shrink-0">
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

        {/* Advanced Filters Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
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
              className="p-2.5 text-xs text-[#AF8260] hover:bg-[#FAF0E6] rounded-xl transition-colors border border-[#E8D2C2]"
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
              Marketplaces ({availableChannels.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {availableChannels.map((ch) => {
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
              Categories ({availableCategories.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {availableCategories.map((cat) => {
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
              {availableZones.map((z) => {
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
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1EDE5] text-[#2D2A26] font-semibold border border-[#E4DCD0]">
              Query: "{filters.search}"
              <button onClick={() => onFilterChange({ ...filters, search: '' })}>
                <X className="w-3 h-3 text-[#8C8376] hover:text-[#2D2A26]" />
              </button>
            </span>
          )}
          {filters.year !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9EFEA] text-[#5F7161] font-semibold border border-[#C5D5C7]">
              Year: {filters.year}
              <button onClick={() => onFilterChange({ ...filters, year: 'ALL' })}>
                <X className="w-3 h-3 text-[#5F7161] hover:text-[#2D2A26]" />
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
