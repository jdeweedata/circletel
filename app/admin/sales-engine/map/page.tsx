'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PiMapPinBold, PiUsersBold, PiChartBarBold, PiMagnifyingGlassBold, PiCaretDownBold, PiCaretRightBold, PiArrowsDownUpBold, PiWifiHighBold, PiBuildingsBold, PiFunnelBold } from 'react-icons/pi';
import { ZoneHeatMap } from '@/components/admin/sales-engine/ZoneHeatMap';
import type { BaseStationLayer, DFABuildingLayer } from '@/components/admin/sales-engine/ZoneHeatMap';
import type { SalesZone, ProvinceMarketContext } from '@/lib/sales-engine/types';
import { StatCard } from '@/components/admin/shared/StatCard';

type SortKey = 'score' | 'name' | 'customers';

export default function SalesEngineMapPage() {
  const [zones, setZones] = useState<SalesZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<SalesZone | null>(null);
  const [loading, setLoading] = useState(true);

  // Infrastructure layer state
  const [baseStations, setBaseStations] = useState<BaseStationLayer[]>([]);
  const [dfaBuildings, setDfaBuildings] = useState<DFABuildingLayer[]>([]);
  const [showBaseStations, setShowBaseStations] = useState(false);
  const [showDFABuildings, setShowDFABuildings] = useState(false);
  const [layersLoading, setLayersLoading] = useState(false);
  const [marketContext, setMarketContext] = useState<ProvinceMarketContext | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [detailSection, setDetailSection] = useState<Record<string, boolean>>({
    metrics: true,
    coverage: true,
    market: false,
  });
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchZones() {
      try {
        const res = await fetch('/api/admin/sales-engine/zones?status=active');
        const json = await res.json();
        setZones(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error('Failed to fetch zones:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchZones();
  }, []);

  // Fetch market context when zone is selected
  useEffect(() => {
    if (!selectedZone?.province) {
      setMarketContext(null);
      return;
    }
    fetch(`/api/admin/sales-engine/market-context?province=${encodeURIComponent(selectedZone.province)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.provinces?.[0]) {
          setMarketContext(json.data.provinces[0]);
        } else {
          setMarketContext(null);
        }
      })
      .catch(() => setMarketContext(null));
  }, [selectedZone?.province]);

  // Fetch coverage layers when toggled on
  const fetchCoverageLayers = useCallback(async (layers: string[]) => {
    if (layers.length === 0) return;
    try {
      setLayersLoading(true);
      const params = new URLSearchParams({
        layers: layers.join(','),
        dfa_limit: '2000',
      });
      const res = await fetch(`/api/admin/sales-engine/map/coverage-layers?${params}`);
      const json = await res.json();

      if (json.data?.base_stations) {
        setBaseStations(json.data.base_stations);
      }
      if (json.data?.dfa_buildings) {
        setDfaBuildings(json.data.dfa_buildings);
      }
    } catch (error) {
      console.error('Failed to fetch coverage layers:', error);
    } finally {
      setLayersLoading(false);
    }
  }, []);

  function handleToggleBaseStations() {
    const newState = !showBaseStations;
    setShowBaseStations(newState);
    if (newState && baseStations.length === 0) {
      fetchCoverageLayers(['base_stations']);
    }
  }

  function handleToggleDFABuildings() {
    const newState = !showDFABuildings;
    setShowDFABuildings(newState);
    if (newState && dfaBuildings.length === 0) {
      fetchCoverageLayers(['dfa_buildings']);
    }
  }

  function toggleDetailSection(key: string) {
    setDetailSection((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Computed values
  const stats = useMemo(() => {
    if (zones.length === 0) return { avgScore: 0, totalCustomers: 0, highPriority: 0 };
    const avgScore = zones.reduce((sum, z) => sum + Number(z.zone_score), 0) / zones.length;
    const totalCustomers = zones.reduce((sum, z) => sum + (z.active_customers || 0), 0);
    const highPriority = zones.filter((z) => Number(z.zone_score) >= 70).length;
    return { avgScore, totalCustomers, highPriority };
  }, [zones]);

  const zoneTypes = useMemo(() => {
    const types = new Set(zones.map((z) => z.zone_type));
    return Array.from(types).sort();
  }, [zones]);

  const filteredZones = useMemo(() => {
    let result = zones;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (z) =>
          z.name.toLowerCase().includes(q) ||
          z.suburb?.toLowerCase().includes(q) ||
          z.province?.toLowerCase().includes(q)
      );
    }

    // Zone type filter
    if (zoneTypeFilter !== 'all') {
      result = result.filter((z) => z.zone_type === zoneTypeFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'score') return Number(b.zone_score) - Number(a.zone_score);
      if (sortBy === 'customers') return (b.active_customers || 0) - (a.active_customers || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [zones, searchQuery, sortBy, zoneTypeFilter]);

  function getScoreBadgeClasses(score: number): string {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }

  function getScoreTextClass(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  }

  function getConfidenceBadgeClasses(confidence: string): string {
    if (confidence === 'high') return 'bg-green-100 text-green-700';
    if (confidence === 'medium') return 'bg-amber-100 text-amber-700';
    if (confidence === 'low') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  }

  function formatZoneType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Territory Heat Map</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Geographic visualization of sales zones, coverage infrastructure, and penetration
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Zones"
          value={zones.length}
          icon={<PiMapPinBold className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={`${stats.highPriority} high priority`}
        />
        <StatCard
          label="Avg Zone Score"
          value={stats.avgScore.toFixed(0)}
          icon={<PiChartBarBold className="h-5 w-5" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          subtitle="Out of 100"
        />
        <StatCard
          label="Active Customers"
          value={stats.totalCustomers}
          icon={<PiUsersBold className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={`Across ${zones.length} zones`}
        />
        <StatCard
          label="Infrastructure"
          value={
            showBaseStations || showDFABuildings
              ? `${baseStations.length + dfaBuildings.length}`
              : '—'
          }
          icon={<PiWifiHighBold className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle="Toggle layers below"
        />
      </div>

      {/* Toolbar — Layer toggles + loading */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase mr-1">Layers</span>
        <button
          onClick={handleToggleBaseStations}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            showBaseStations
              ? 'bg-orange-50 text-orange-700 border-orange-300'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          Base Stations
          {baseStations.length > 0 && (
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded-full">
              {baseStations.length}
            </span>
          )}
        </button>
        <button
          onClick={handleToggleDFABuildings}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            showDFABuildings
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          DFA Buildings
          {dfaBuildings.length > 0 && (
            <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 rounded-full">
              {dfaBuildings.length}
            </span>
          )}
        </button>
        {layersLoading && (
          <div className="flex items-center text-xs text-gray-400 ml-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1" />
            Loading layers...
          </div>
        )}
      </div>

      {/* Main Content — Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[600px] bg-gray-50 rounded-lg border border-gray-200 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
              <p className="text-sm text-gray-400">Loading zones...</p>
            </div>
          ) : (
            <ZoneHeatMap
              zones={zones}
              onZoneSelect={setSelectedZone}
              selectedZoneId={selectedZone?.id}
              height="600px"
              baseStations={baseStations}
              dfaBuildings={dfaBuildings}
              showBaseStations={showBaseStations}
              showDFABuildings={showDFABuildings}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Selected Zone Detail */}
          {selectedZone ? (
            <div className="bg-white border border-circleTel-orange/30 rounded-lg shadow-sm overflow-hidden">
              {/* Zone header */}
              <div className="px-4 py-3 bg-gradient-to-r from-circleTel-orange/5 to-transparent border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{selectedZone.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatZoneType(selectedZone.zone_type)} — {selectedZone.suburb || selectedZone.province}
                    </p>
                  </div>
                  <span
                    className={`text-lg font-bold tabular-nums ${getScoreTextClass(Number(selectedZone.zone_score))}`}
                  >
                    {Number(selectedZone.zone_score).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                <div className="px-3 py-2 text-center">
                  <p className="text-xs text-gray-400">Customers</p>
                  <p className="text-sm font-bold text-gray-900">{selectedZone.active_customers}</p>
                </div>
                <div className="px-3 py-2 text-center">
                  <p className="text-xs text-gray-400">Penetration</p>
                  <p className="text-sm font-bold text-gray-900">
                    {Number(selectedZone.penetration_rate).toFixed(1)}%
                  </p>
                </div>
                <div className="px-3 py-2 text-center">
                  <p className="text-xs text-gray-400">Serviceable</p>
                  <p className="text-sm font-bold text-gray-900">{selectedZone.serviceable_addresses}</p>
                </div>
              </div>

              {/* Collapsible: Zone Metrics */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => toggleDetailSection('metrics')}
                  className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase">Zone Metrics</span>
                  {detailSection.metrics ? (
                    <PiCaretDownBold className="h-3 w-3 text-gray-400" />
                  ) : (
                    <PiCaretRightBold className="h-3 w-3 text-gray-400" />
                  )}
                </button>
                {detailSection.metrics && (
                  <div className="px-4 pb-3 space-y-2">
                    <DetailRow label="SME Density" value={`${selectedZone.sme_density_score}/100`} />
                    <DetailRow label="Competitor Weakness" value={`${selectedZone.competitor_weakness_score}/100`} />
                    {selectedZone.demographic_fit_score > 0 && (
                      <DetailRow label="Demographic Fit" value={`${selectedZone.demographic_fit_score}/100`} />
                    )}
                    {selectedZone.propensity_score > 0 && (
                      <DetailRow label="Propensity Score" value={`${selectedZone.propensity_score.toFixed(0)}/100`} />
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible: Coverage Intelligence */}
              {selectedZone.coverage_confidence && (
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => toggleDetailSection('coverage')}
                    className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase">Coverage</span>
                    {detailSection.coverage ? (
                      <PiCaretDownBold className="h-3 w-3 text-gray-400" />
                    ) : (
                      <PiCaretRightBold className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                  {detailSection.coverage && (
                    <div className="px-4 pb-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Confidence</span>
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded text-xs ${getConfidenceBadgeClasses(selectedZone.coverage_confidence)}`}
                        >
                          {selectedZone.coverage_confidence}
                        </span>
                      </div>
                      <DetailRow
                        label="Base Stations"
                        value={`${selectedZone.base_station_count} (${selectedZone.base_station_connections} conn.)`}
                      />
                      <DetailRow label="DFA Connected" value={String(selectedZone.dfa_connected_count)} />
                      <DetailRow label="DFA Near-Net" value={String(selectedZone.dfa_near_net_count)} />
                      <DetailRow
                        label="Enriched Score"
                        value={Number(selectedZone.enriched_zone_score).toFixed(0)}
                        bold
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible: Market Context */}
              {marketContext && (
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => toggleDetailSection('market')}
                    className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Market ({selectedZone.province})
                    </span>
                    {detailSection.market ? (
                      <PiCaretDownBold className="h-3 w-3 text-gray-400" />
                    ) : (
                      <PiCaretRightBold className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                  {detailSection.market && (
                    <div className="px-4 pb-3 space-y-2">
                      {marketContext.home_internet_pct !== null && (
                        <DetailRow
                          label="Home Internet"
                          value={`${marketContext.home_internet_pct.toFixed(1)}%`}
                          valueClass={
                            marketContext.home_internet_pct < 15
                              ? 'text-green-600'
                              : marketContext.home_internet_pct > 35
                                ? 'text-amber-600'
                                : undefined
                          }
                        />
                      )}
                      {marketContext.five_g_coverage_pct !== null && (
                        <DetailRow label="5G Coverage" value={`${marketContext.five_g_coverage_pct.toFixed(0)}%`} />
                      )}
                      {marketContext.employment_change !== null && (
                        <DetailRow
                          label="Employment"
                          value={`${marketContext.employment_change > 0 ? '+' : ''}${marketContext.employment_change.toLocaleString()} jobs`}
                          valueClass={
                            marketContext.employment_trend === 'growing'
                              ? 'text-green-600'
                              : marketContext.employment_trend === 'shrinking'
                                ? 'text-red-600'
                                : undefined
                          }
                        />
                      )}
                      {marketContext.avg_hh_expenditure !== null && (
                        <DetailRow
                          label="HH Expenditure"
                          value={`R${Math.round(marketContext.avg_hh_expenditure).toLocaleString()}/yr`}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedZone.notes && (
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 italic">{selectedZone.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <PiMapPinBold className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">Select a zone</p>
              <p className="text-xs text-gray-400 mt-1">Click a zone on the map or from the list below</p>
            </div>
          )}

          {/* Zone List */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Search + filter bar */}
            <div className="p-2 border-b border-gray-200 space-y-2">
              <div className="relative">
                <PiMagnifyingGlassBold className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search zones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-circleTel-orange/50 focus:border-circleTel-orange/50 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {/* Zone type filter */}
                <div className="relative flex-1">
                  <PiFunnelBold className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <select
                    value={zoneTypeFilter}
                    onChange={(e) => setZoneTypeFilter(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-circleTel-orange/50 appearance-none"
                  >
                    <option value="all">All types</option>
                    {zoneTypes.map((t) => (
                      <option key={t} value={t}>
                        {formatZoneType(t)}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Sort toggle */}
                <button
                  onClick={() => {
                    const order: SortKey[] = ['score', 'customers', 'name'];
                    const next = order[(order.indexOf(sortBy) + 1) % order.length];
                    setSortBy(next);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 whitespace-nowrap"
                  title={`Sorted by ${sortBy}`}
                >
                  <PiArrowsDownUpBold className="h-3 w-3" />
                  {sortBy === 'score' ? 'Score' : sortBy === 'customers' ? 'Customers' : 'Name'}
                </button>
              </div>
            </div>

            {/* Zone count */}
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase">
                {filteredZones.length} of {zones.length} zones
              </p>
            </div>

            {/* Zone list */}
            <div className="max-h-[350px] overflow-y-auto">
              {filteredZones.map((zone) => {
                const score = Number(zone.zone_score);
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-circleTel-orange/5 border-l-2 border-l-circleTel-orange' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-circleTel-orange' : 'text-gray-900'}`}>
                          {zone.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {zone.active_customers} customers
                          </span>
                          {zone.coverage_confidence && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span
                                className={`text-[10px] font-medium ${
                                  zone.coverage_confidence === 'high'
                                    ? 'text-green-600'
                                    : zone.coverage_confidence === 'medium'
                                      ? 'text-amber-600'
                                      : 'text-gray-400'
                                }`}
                              >
                                {zone.coverage_confidence}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${getScoreBadgeClasses(score)}`}
                      >
                        {score.toFixed(0)}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredZones.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-400">
                    {searchQuery || zoneTypeFilter !== 'all' ? 'No matching zones' : 'No active zones'}
                  </p>
                  {(searchQuery || zoneTypeFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setZoneTypeFilter('all');
                      }}
                      className="text-xs text-circleTel-orange hover:underline mt-1"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function DetailRow({
  label,
  value,
  bold,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${valueClass || 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
