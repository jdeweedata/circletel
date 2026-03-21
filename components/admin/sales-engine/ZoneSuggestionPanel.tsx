'use client';

import { PiLightningBold, PiMapPinBold, PiWifiHighBold } from 'react-icons/pi';
import React, { useState, useEffect, useCallback } from 'react';

interface ZoneSuggestion {
  ward_code: string;
  ward_name: string | null;
  municipality: string | null;
  province: string;
  centroid_lat: number;
  centroid_lng: number;
  demographic_fit_score: number;
  pct_no_internet: number;
  pct_income_above_r12800: number;
  total_population: number;
  total_households: number;
  business_poi_count: number;
  nearby_base_stations: number;
}

export function ZoneSuggestionPanel() {
  const [suggestions, setSuggestions] = useState<ZoneSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sales-engine/demographics/wards?mode=suggestions&limit=10');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSuggestions(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <PiLightningBold className="h-4 w-4 text-purple-500" />
            Zone Suggestions — High Demographic Fit
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Wards with strong demographic opportunity near coverage infrastructure
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {suggestions.map((s) => (
          <div key={s.ward_code} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {s.ward_name ?? s.ward_code}
                </p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  s.demographic_fit_score >= 60 ? 'bg-green-100 text-green-700' :
                  s.demographic_fit_score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  Fit: {Number(s.demographic_fit_score).toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {s.municipality ? `${s.municipality}, ` : ''}{s.province}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 ml-4">
              <span className="flex items-center gap-1" title="% without internet">
                <PiWifiHighBold className="h-3.5 w-3.5 text-red-400" />
                {Number(s.pct_no_internet).toFixed(0)}% no internet
              </span>
              <span className="flex items-center gap-1" title="Nearby base stations">
                <PiMapPinBold className="h-3.5 w-3.5 text-blue-400" />
                {s.nearby_base_stations} BS nearby
              </span>
              <span title="Population">
                {s.total_population.toLocaleString()} pop
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
