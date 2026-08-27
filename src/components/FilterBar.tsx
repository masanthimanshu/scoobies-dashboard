import React, { useState, useMemo } from "react";
import {
  X,
  SlidersHorizontal,
  ShoppingBag,
  Store,
  MapPin,
  Sparkles,
  RotateCcw,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { FilterState } from "../types";
import { isValidFilterOption } from "../utils/formatters";

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

interface TimeFilterGroupProps {
  label: string;
  allLabel: string;
  items: (string | number)[];
  selectedItems: string[];
  onToggle: (val: string) => void;
}

const TimeFilterGroup: React.FC<TimeFilterGroupProps> = React.memo(
  ({ label, allLabel, items, selectedItems, onToggle }) => {
    const validItems = useMemo(
      () => items.filter(isValidFilterOption),
      [items],
    );

    if (validItems.length === 0) return null;

    const showCompact = validItems.length <= 4;
    const recentItems = showCompact ? validItems : validItems.slice(0, 3);
    const isOlderSelected =
      !showCompact &&
      selectedItems.some(
        (sel) =>
          !recentItems.some(
            (r) => String(r).toLowerCase() === sel.toLowerCase(),
          ),
      );

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider mr-1">
          {label}:
        </span>

        <div className="flex items-center gap-1 bg-[#F1EDE5] p-1 rounded-xl border border-[#EBE5D9]">
          <button
            type="button"
            onClick={() => onToggle("ALL")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedItems.length === 0
                ? "bg-[#2D2A26] text-white shadow-2xs font-extrabold"
                : "text-[#8C8376] hover:text-[#2D2A26]"
            }`}
          >
            {allLabel}
          </button>

          {recentItems.map((item) => {
            const str = String(item);
            const isSelected = selectedItems.some(
              (s) => s.toLowerCase() === str.toLowerCase(),
            );
            return (
              <button
                type="button"
                key={str}
                onClick={() => onToggle(str)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#5F7161] text-white shadow-2xs font-extrabold"
                    : "text-[#8C8376] hover:text-[#2D2A26]"
                }`}
              >
                {str}
              </button>
            );
          })}

          {!showCompact && (
            <div className="relative inline-flex items-center">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onToggle(e.target.value);
                }}
                className={`pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer appearance-none focus:outline-none ${
                  isOlderSelected
                    ? "bg-[#5F7161] text-white shadow-2xs"
                    : "bg-transparent text-[#8C8376] hover:text-[#2D2A26]"
                }`}
              >
                <option value="" disabled className="bg-white text-[#2D2A26]">
                  {isOlderSelected
                    ? `${selectedItems
                        .filter(
                          (sel) =>
                            !recentItems.some(
                              (r) =>
                                String(r).toLowerCase() === sel.toLowerCase(),
                            ),
                        )
                        .join(", ")}`
                    : "More ▾"}
                </option>
                {validItems.map((item) => {
                  const str = String(item);
                  const isSelected = selectedItems.some(
                    (s) => s.toLowerCase() === str.toLowerCase(),
                  );
                  return (
                    <option
                      key={str}
                      value={str}
                      className="bg-white text-[#2D2A26]"
                    >
                      {isSelected ? `✓ ${str}` : str}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className={`w-3 h-3 absolute right-2 pointer-events-none ${
                  isOlderSelected ? "text-white" : "text-[#8C8376]"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
);

interface FilterChipProps {
  label: string;
  value: string | number;
  onRemove: () => void;
  variant?: "green" | "brown" | "neutral";
}

const FilterChip: React.FC<FilterChipProps> = React.memo(
  ({ label, value, onRemove, variant = "green" }) => {
    const styles =
      variant === "brown"
        ? "bg-[#FAF0E6] text-[#AF8260] border-[#E8D2C2]"
        : variant === "neutral"
          ? "bg-[#F1EDE5] text-[#2D2A26] border-[#E4DCD0]"
          : "bg-[#E9EFEA] text-[#5F7161] border-[#C5D5C7]";
    const iconColor =
      variant === "brown"
        ? "text-[#AF8260]"
        : variant === "neutral"
          ? "text-[#8C8376]"
          : "text-[#5F7161]";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${styles}`}
      >
        {label}: {value}
        <button type="button" onClick={onRemove} className="cursor-pointer">
          <X className={`w-3 h-3 ${iconColor} hover:text-[#2D2A26]`} />
        </button>
      </span>
    );
  },
);

export const FilterBar: React.FC<FilterBarProps> = React.memo(
  ({
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
    const selectedYears = useMemo(() => {
      return filters.years && filters.years.length > 0
        ? filters.years
        : filters.year && filters.year !== "ALL"
          ? [filters.year]
          : [];
    }, [filters.years, filters.year]);

    const selectedMonths = useMemo(() => {
      return filters.months && filters.months.length > 0
        ? filters.months
        : filters.month && filters.month !== "ALL"
          ? [filters.month]
          : [];
    }, [filters.months, filters.month]);

    const selectedWeeks = useMemo(() => {
      return filters.weeks && filters.weeks.length > 0
        ? filters.weeks
        : filters.week && filters.week !== "ALL"
          ? [filters.week]
          : [];
    }, [filters.weeks, filters.week]);

    const toggleTimeFilter = React.useCallback(
      (
        arrKey: "years" | "months" | "weeks",
        strKey: "year" | "month" | "week",
        currentList: string[],
        val: string,
      ) => {
        if (val === "ALL") {
          onFilterChange({ ...filters, [arrKey]: [], [strKey]: "ALL" });
          return;
        }
        const exists = currentList.some(
          (x) => x.toLowerCase() === val.toLowerCase(),
        );
        const next = exists
          ? currentList.filter((x) => x.toLowerCase() !== val.toLowerCase())
          : [...currentList, val];
        onFilterChange({
          ...filters,
          [arrKey]: next,
          [strKey]:
            next.length === 1 ? next[0] : next.length === 0 ? "ALL" : "CUSTOM",
        });
      },
      [filters, onFilterChange],
    );

    const toggleArrayFilter = React.useCallback(
      (key: "channels" | "categories" | "zones", item: string) => {
        const list = filters[key];
        const next = list.includes(item)
          ? list.filter((i) => i !== item)
          : [...list, item];
        onFilterChange({ ...filters, [key]: next });
      },
      [filters, onFilterChange],
    );

    const resetAllFilters = React.useCallback(() => {
      onFilterChange({
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
      });
    }, [onFilterChange]);

    const activeFilterCount = useMemo(() => {
      return (
        selectedYears.length +
        selectedMonths.length +
        selectedWeeks.length +
        (filters.startDate || filters.endDate ? 1 : 0) +
        filters.channels.length +
        filters.categories.length +
        filters.zones.length +
        filters.states.length +
        (filters.status !== "ALL" ? 1 : 0) +
        (filters.campaign !== "ALL" ? 1 : 0)
      );
    }, [
      selectedYears.length,
      selectedMonths.length,
      selectedWeeks.length,
      filters.startDate,
      filters.endDate,
      filters.channels.length,
      filters.categories.length,
      filters.zones.length,
      filters.states.length,
      filters.status,
      filters.campaign,
    ]);

    // Memoize valid filter option lists
    const validZones = useMemo(
      () => availableZones.filter(isValidFilterOption),
      [availableZones],
    );
    const validChannels = useMemo(
      () => availableChannels.filter(isValidFilterOption),
      [availableChannels],
    );
    const validCategories = useMemo(
      () => availableCategories.filter(isValidFilterOption),
      [availableCategories],
    );

    return (
      <div className="bg-white border border-[#EBE5D9] rounded-[24px] shadow-sm p-4 sm:p-5 mb-6">
        {/* Primary Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Section: Year filter, Month filter, Status filter & Week filter */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Year Filter Controls */}
            <TimeFilterGroup
              label="Year"
              allLabel="All Years"
              items={availableYears}
              selectedItems={selectedYears}
              onToggle={(yr) =>
                toggleTimeFilter("years", "year", selectedYears, yr)
              }
            />

            {/* Month Filter Controls */}
            <TimeFilterGroup
              label="Month"
              allLabel="All Months"
              items={availableMonths}
              selectedItems={selectedMonths}
              onToggle={(m) =>
                toggleTimeFilter("months", "month", selectedMonths, m)
              }
            />

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-[#8C8376] uppercase tracking-wider mr-1">
                Status:
              </span>
              <div className="flex items-center gap-1 bg-[#F1EDE5] p-1 rounded-xl border border-[#EBE5D9]">
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, status: "ALL" })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filters.status === "ALL"
                      ? "bg-white text-[#2D2A26] shadow-2xs font-extrabold"
                      : "text-[#8C8376] hover:text-[#2D2A26]"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({ ...filters, status: "Dispatched" })
                  }
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filters.status === "Dispatched"
                      ? "bg-[#5F7161] text-white shadow-2xs"
                      : "text-[#8C8376] hover:text-[#2D2A26]"
                  }`}
                >
                  Dispatched
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({ ...filters, status: "Return" })
                  }
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filters.status === "Return"
                      ? "bg-[#AF8260] text-white shadow-2xs"
                      : "text-[#8C8376] hover:text-[#2D2A26]"
                  }`}
                >
                  Returns
                </button>
              </div>
            </div>

            {/* Week Filter Controls */}
            <TimeFilterGroup
              label="Week"
              allLabel="All Weeks"
              items={availableWeeks}
              selectedItems={selectedWeeks}
              onToggle={(w) =>
                toggleTimeFilter("weeks", "week", selectedWeeks, w)
              }
            />
          </div>

          {/* Right Section: Advanced Filters Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                showAdvanced || activeFilterCount > 0
                  ? "bg-[#FAF0E6] border-[#E8D2C2] text-[#AF8260]"
                  : "bg-[#F9F7F2] border-[#EBE5D9] text-[#433E37] hover:bg-[#F1EDE5]"
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
                type="button"
                onClick={resetAllFilters}
                className="p-2 text-xs text-[#AF8260] hover:bg-[#FAF0E6] rounded-xl transition-colors border border-[#E8D2C2] cursor-pointer"
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
                      type="button"
                      key={ch}
                      onClick={() => toggleArrayFilter("channels", ch)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#5F7161] text-white border-[#4A594C]"
                          : "bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]"
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
                      type="button"
                      key={cat}
                      onClick={() => toggleArrayFilter("categories", cat)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#AF8260] text-white border-[#8D6546]"
                          : "bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]"
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
                      type="button"
                      key={z}
                      onClick={() => toggleArrayFilter("zones", z)}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#5F7161] text-white border-[#4A594C]"
                          : "bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]"
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
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filters, campaign: "ALL" })
                    }
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                      filters.campaign === "ALL"
                        ? "bg-[#2D2A26] text-white border-[#2D2A26]"
                        : "bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filters, campaign: "B2S" })
                    }
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                      filters.campaign === "B2S"
                        ? "bg-[#AF8260] text-white border-[#8D6546]"
                        : "bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]"
                    }`}
                  >
                    Back To School (B2S)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onFilterChange({ ...filters, campaign: "NON_B2S" })
                    }
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                      filters.campaign === "NON_B2S"
                        ? "bg-[#5F7161] text-white border-[#4A594C]"
                        : "bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]"
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
                  <span className="text-[11px] font-semibold text-[#8C8376]">
                    Start Date:
                  </span>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      onFilterChange({ ...filters, startDate: e.target.value })
                    }
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-[#F9F7F2] border border-[#EBE5D9] rounded-lg font-medium text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#5F7161]"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#8C8376]">
                    End Date:
                  </span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      onFilterChange({ ...filters, endDate: e.target.value })
                    }
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
            <span className="text-[#8C8376] text-[11px] font-bold uppercase tracking-wider mr-1">
              Active filters:
            </span>
            {selectedYears.map((yr) => (
              <FilterChip
                key={yr}
                label="Year"
                value={yr}
                onRemove={() =>
                  toggleTimeFilter("years", "year", selectedYears, String(yr))
                }
              />
            ))}
            {selectedMonths.map((m) => (
              <FilterChip
                key={m}
                label="Month"
                value={m}
                onRemove={() =>
                  toggleTimeFilter("months", "month", selectedMonths, m)
                }
              />
            ))}
            {filters.status !== "ALL" && (
              <FilterChip
                label="Status"
                value={filters.status}
                variant="neutral"
                onRemove={() => onFilterChange({ ...filters, status: "ALL" })}
              />
            )}
            {selectedWeeks.map((w) => (
              <FilterChip
                key={w}
                label="Week"
                value={w}
                onRemove={() =>
                  toggleTimeFilter("weeks", "week", selectedWeeks, w)
                }
              />
            ))}
            {(filters.startDate || filters.endDate) && (
              <FilterChip
                label="Date"
                value={`${filters.startDate || "Start"} to ${filters.endDate || "End"}`}
                variant="neutral"
                onRemove={() =>
                  onFilterChange({ ...filters, startDate: "", endDate: "" })
                }
              />
            )}
            {filters.channels.map((ch) => (
              <FilterChip
                key={ch}
                label="Channel"
                value={ch}
                onRemove={() => toggleArrayFilter("channels", ch)}
              />
            ))}
            {filters.categories.map((cat) => (
              <FilterChip
                key={cat}
                label="Category"
                value={cat}
                variant="brown"
                onRemove={() => toggleArrayFilter("categories", cat)}
              />
            ))}
            {filters.zones.map((z) => (
              <FilterChip
                key={z}
                label="Zone"
                value={z}
                onRemove={() => toggleArrayFilter("zones", z)}
              />
            ))}
            {filters.campaign !== "ALL" && (
              <FilterChip
                label="Campaign"
                value={
                  filters.campaign === "B2S" ? "Back To School" : "Standard"
                }
                variant="brown"
                onRemove={() => onFilterChange({ ...filters, campaign: "ALL" })}
              />
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-[#AF8260] hover:underline font-bold ml-auto cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    );
  },
);
