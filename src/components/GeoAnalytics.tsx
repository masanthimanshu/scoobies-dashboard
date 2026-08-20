import React, { useState } from 'react';
import { Compass, ChevronDown, ChevronUp } from 'lucide-react';
import { GeoMetric } from '../types';

interface GeoAnalyticsProps {
  zones: GeoMetric[];
  states: GeoMetric[];
  cities: GeoMetric[];
}

export const GeoAnalytics: React.FC<GeoAnalyticsProps> = ({
  zones,
  states,
  cities,
}) => {
  const [geoTab, setGeoTab] = useState<'zones' | 'states' | 'cities'>('zones');
  const [showAllStates, setShowAllStates] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);

  // Full list for the active tab
  const fullList = geoTab === 'zones' ? zones : geoTab === 'states' ? states : cities;
  
  // Displayed slice: Zones shows all, States/Cities shows top 12 by default
  const isExpanded = geoTab === 'states' ? showAllStates : showAllCities;
  const activeList =
    geoTab === 'zones'
      ? zones
      : isExpanded
      ? fullList
      : fullList.slice(0, 12);

  const hasMoreThan12 = geoTab !== 'zones' && fullList.length > 12;

  const toggleViewAll = () => {
    if (geoTab === 'states') {
      setShowAllStates(!showAllStates);
    } else if (geoTab === 'cities') {
      setShowAllCities(!showAllCities);
    }
  };

  return (
    <div className="bg-white border border-[#EBE5D9] rounded-[28px] p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-[#EBE5D9]">
        <div>
          <h3 className="text-base font-extrabold text-[#2D2A26] flex items-center gap-2 tracking-tight">
            <Compass className="w-4 h-4 text-[#5F7161]" />
            Regional & Geographic Distribution
          </h3>
          <p className="text-xs text-[#8C8376] font-medium mt-0.5">
            Geographical sales density across zones, top states, and delivery cities
          </p>
        </div>

        <div className="flex bg-[#F1EDE5] p-1 rounded-xl text-xs border border-[#EBE5D9]">
          <button
            onClick={() => setGeoTab('zones')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              geoTab === 'zones' ? 'bg-white text-[#2D2A26] shadow-2xs font-extrabold' : 'text-[#8C8376] hover:text-[#2D2A26]'
            }`}
          >
            Zones
          </button>
          <button
            onClick={() => setGeoTab('states')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              geoTab === 'states' ? 'bg-white text-[#2D2A26] shadow-2xs font-extrabold' : 'text-[#8C8376] hover:text-[#2D2A26]'
            }`}
          >
            Top States
          </button>
          <button
            onClick={() => setGeoTab('cities')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              geoTab === 'cities' ? 'bg-white text-[#2D2A26] shadow-2xs font-extrabold' : 'text-[#8C8376] hover:text-[#2D2A26]'
            }`}
          >
            Top Cities
          </button>
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
                <span className="text-xs font-bold text-[#2D2A26] truncate max-w-[120px]" title={item.name}>
                  {item.name || 'Unassigned'}
                </span>
              </div>
              <span className="text-xs font-bold text-[#5F7161]">
                {item.sharePct.toFixed(1)}%
              </span>
            </div>

            <div className="text-lg font-black text-[#2D2A26] mt-2">
              ₹{item.sales.toLocaleString()}
            </div>

            <div className="w-full h-1.5 bg-[#EBE5D9] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#5F7161] rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, item.sharePct))}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-[#8C8376] font-medium mt-2.5">
              <span>{item.orders.toLocaleString()} orders</span>
              <span>{item.units.toLocaleString()} units</span>
            </div>
          </div>
        ))}
      </div>

      {hasMoreThan12 && (
        <div className="mt-5 pt-3.5 border-t border-[#F1EDE5] flex justify-center">
          <button
            onClick={toggleViewAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#433E37] bg-[#F9F7F2] hover:bg-[#F1EDE5] border border-[#EBE5D9] rounded-xl transition-colors cursor-pointer"
          >
            <span>
              {isExpanded
                ? `Show Top 12 ${geoTab === 'states' ? 'States' : 'Cities'}`
                : `View All ${geoTab === 'states' ? 'States' : 'Cities'} (${fullList.length})`}
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

