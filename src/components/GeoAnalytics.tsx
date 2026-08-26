import React, { useState } from "react";
import { Compass, ChevronDown, ChevronUp } from "lucide-react";
import { GeoMetric } from "../types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../utils/formatters";

interface GeoAnalyticsProps {
  zones: GeoMetric[];
  states: GeoMetric[];
  cities: GeoMetric[];
}

const TABS: { id: "zones" | "states" | "cities"; label: string }[] = [
  { id: "zones", label: "Zones" },
  { id: "states", label: "Top States" },
  { id: "cities", label: "Top Cities" },
];

export const GeoAnalytics: React.FC<GeoAnalyticsProps> = ({
  zones,
  states,
  cities,
}) => {
  const [geoTab, setGeoTab] = useState<"zones" | "states" | "cities">("zones");
  const [isExpanded, setIsExpanded] = useState(false);

  // Switch tab & reset expansion
  const handleTabChange = (tab: "zones" | "states" | "cities") => {
    setGeoTab(tab);
    setIsExpanded(false);
  };

  // Full list for the active tab
  const fullList =
    geoTab === "zones" ? zones : geoTab === "states" ? states : cities;

  // Displayed slice: Zones shows all, States/Cities shows top 12 by default
  const activeList =
    geoTab === "zones" ? zones : isExpanded ? fullList : fullList.slice(0, 12);

  const hasMoreThan12 = geoTab !== "zones" && fullList.length > 12;

  return (
    <div className="bg-white border border-[#EBE5D9] rounded-[28px] p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-[#EBE5D9]">
        <div>
          <h3 className="text-base font-extrabold text-[#2D2A26] flex items-center gap-2 tracking-tight">
            <Compass className="w-4 h-4 text-[#5F7161]" />
            Regional & Geographic Distribution
          </h3>
          <p className="text-xs text-[#8C8376] font-medium mt-0.5">
            Geographical sales density across zones, top states, and delivery
            cities
          </p>
        </div>

        <div className="flex bg-[#F1EDE5] p-1 rounded-xl text-xs border border-[#EBE5D9]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                geoTab === tab.id
                  ? "bg-white text-[#2D2A26] shadow-2xs font-extrabold"
                  : "text-[#8C8376] hover:text-[#2D2A26]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeList.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="bg-[#F9F7F2] border border-[#EBE5D9] rounded-2xl p-4 hover:border-[#5F7161] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white border border-[#DED9CF] text-[10px] font-black text-[#433E37] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span
                  className="text-xs font-bold text-[#2D2A26] truncate max-w-[120px]"
                  title={item.name}
                >
                  {item.name || "Unassigned"}
                </span>
              </div>
              <span className="text-xs font-bold text-[#5F7161]">
                {formatPercent(item.sharePct)}
              </span>
            </div>

            <div className="text-lg font-black text-[#2D2A26] mt-2">
              {formatCurrency(item.sales)}
            </div>

            <div className="w-full h-1.5 bg-[#EBE5D9] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#5F7161] rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, item.sharePct))}%`,
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#8C8376] font-medium mt-2.5">
              <span>{formatNumber(item.orders)} orders</span>
              <span>{formatNumber(item.units)} units</span>
            </div>
          </div>
        ))}
      </div>

      {hasMoreThan12 && (
        <div className="mt-5 pt-3.5 border-t border-[#F1EDE5] flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#433E37] bg-[#F9F7F2] hover:bg-[#F1EDE5] border border-[#EBE5D9] rounded-xl transition-colors cursor-pointer"
          >
            <span>
              {isExpanded
                ? `Show Top 12 ${geoTab === "states" ? "States" : "Cities"}`
                : `View All ${geoTab === "states" ? "States" : "Cities"} (${fullList.length})`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#8C8376]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#8C8376]" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
