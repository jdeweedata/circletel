'use client';

import {
  PiArrowsClockwiseBold,
  PiBuildingsBold,
  PiDownloadSimpleBold,
  PiFireBold,
  PiMapPinBold,
  PiRadioBold,
  PiTargetBold,
  PiWarningBold,
} from 'react-icons/pi';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type TabType = 'dfa' | 'demand' | 'tarana';

interface DFACampaignItem {
  id: string;
  buildingName: string;
  streetAddress: string;
  coverageType: string;
  ftth: string | null;
  broadband: string | null;
  precinct: string | null;
  promotion: string | null;
  latitude: number;
  longitude: number;
}

interface TaranaItem {
  id: string;
  serialNumber: string;
  hostname: string;
  siteName: string;
  market: string | null;
  latitude: number;
  longitude: number;
  activeConnections: number | null;
}

interface DemandHotspot {
  latitude: number;
  longitude: number;
  sampleAddresses: string[];
  totalSearches: number;
  withCoverage: number;
  withoutCoverage: number;
  noCoverageLeads: number;
  demandScore: number;
  gapScore: number;
  serviceInterest: Record<string, number>;
}

export default function CampaignBuilderPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dfa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DFA state
  const [dfaItems, setDfaItems] = useState<DFACampaignItem[]>([]);
  const [dfaSummary, setDfaSummary] = useState<{
    totalBuildings: number;
    connected: number;
    nearNet: number;
    filteredCount: number;
    precincts: { name: string; count: number }[];
  } | null>(null);
  const [dfaCoverageType, setDfaCoverageType] = useState('');
  const [dfaPrecinct, setDfaPrecinct] = useState('');
  const [dfaSearch, setDfaSearch] = useState('');
  const [dfaPage, setDfaPage] = useState(1);
  const [dfaTotalPages, setDfaTotalPages] = useState(0);

  // Tarana state
  const [taranaItems, setTaranaItems] = useState<TaranaItem[]>([]);
  const [taranaSummary, setTaranaSummary] = useState<{
    totalStations: number;
    markets: { name: string; count: number }[];
  } | null>(null);
  const [taranaSearch, setTaranaSearch] = useState('');
  const [taranaPage, setTaranaPage] = useState(1);
  const [taranaTotalPages, setTaranaTotalPages] = useState(0);

  // Demand state
  const [hotspots, setHotspots] = useState<DemandHotspot[]>([]);
  const [demandSummary, setDemandSummary] = useState<{
    totalCoverageSearches: number;
    totalNoCoverageLeads: number;
    coverageRate: number;
    hotspotsFound: number;
    infrastructure: { dfaBuildings: number; taranaBaseStations: number };
  } | null>(null);
  const [demandDays, setDemandDays] = useState(30);

  const fetchDFA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        source: 'dfa',
        page: dfaPage.toString(),
        pageSize: '50',
      });
      if (dfaCoverageType) params.set('coverage_type', dfaCoverageType);
      if (dfaPrecinct) params.set('precinct', dfaPrecinct);
      if (dfaSearch) params.set('search', dfaSearch);

      const response = await fetch(
        `/api/admin/marketing/campaign-lists?${params}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch DFA data');
      }

      setDfaItems(data.data.items);
      setDfaSummary(data.data.summary);
      setDfaTotalPages(data.data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading DFA data');
    } finally {
      setLoading(false);
    }
  }, [dfaPage, dfaCoverageType, dfaPrecinct, dfaSearch]);

  const fetchTarana = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        source: 'tarana',
        page: taranaPage.toString(),
        pageSize: '50',
      });
      if (taranaSearch) params.set('search', taranaSearch);

      const response = await fetch(
        `/api/admin/marketing/campaign-lists?${params}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch Tarana data');
      }

      setTaranaItems(data.data.items);
      setTaranaSummary(data.data.summary);
      setTaranaTotalPages(data.data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading Tarana data');
    } finally {
      setLoading(false);
    }
  }, [taranaPage, taranaSearch]);

  const fetchDemand = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        days: demandDays.toString(),
        minSearches: '3',
      });

      const response = await fetch(
        `/api/admin/marketing/coverage-demand?${params}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch demand data');
      }

      setHotspots(data.data.hotspots);
      setDemandSummary(data.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading demand data');
    } finally {
      setLoading(false);
    }
  }, [demandDays]);

  useEffect(() => {
    if (activeTab === 'dfa') fetchDFA();
    else if (activeTab === 'tarana') fetchTarana();
    else if (activeTab === 'demand') fetchDemand();
  }, [activeTab, fetchDFA, fetchTarana, fetchDemand]);

  const exportDFAToCSV = async () => {
    try {
      const params = new URLSearchParams({
        source: 'dfa',
        page: '1',
        pageSize: '5000',
      });
      if (dfaCoverageType) params.set('coverage_type', dfaCoverageType);
      if (dfaPrecinct) params.set('precinct', dfaPrecinct);
      if (dfaSearch) params.set('search', dfaSearch);

      const response = await fetch(
        `/api/admin/marketing/campaign-lists?${params}`
      );
      const data = await response.json();
      if (!data.success) throw new Error('Export failed');

      const csvRows = [
        ['Building Name', 'Address', 'Coverage Type', 'FTTH', 'Broadband', 'Precinct', 'Promotion', 'Latitude', 'Longitude'].join(','),
        ...data.data.items.map((b: DFACampaignItem) =>
          [
            `"${(b.buildingName || '').replace(/"/g, '""')}"`,
            `"${(b.streetAddress || '').replace(/"/g, '""')}"`,
            b.coverageType,
            b.ftth || '',
            b.broadband || '',
            b.precinct || '',
            b.promotion || '',
            b.latitude,
            b.longitude,
          ].join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dfa-campaign-${dfaCoverageType || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const exportTaranaToCSV = async () => {
    try {
      const params = new URLSearchParams({
        source: 'tarana',
        page: '1',
        pageSize: '5000',
      });
      if (taranaSearch) params.set('search', taranaSearch);

      const response = await fetch(
        `/api/admin/marketing/campaign-lists?${params}`
      );
      const data = await response.json();
      if (!data.success) throw new Error('Export failed');

      const csvRows = [
        ['Site Name', 'Hostname', 'Serial Number', 'Market', 'Active Connections', 'Latitude', 'Longitude'].join(','),
        ...data.data.items.map((s: TaranaItem) =>
          [
            `"${(s.siteName || '').replace(/"/g, '""')}"`,
            s.hostname || '',
            s.serialNumber || '',
            s.market || '',
            s.activeConnections ?? '',
            s.latitude,
            s.longitude,
          ].join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarana-stations-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const exportDemanToCSV = () => {
    if (hotspots.length === 0) return;

    const csvRows = [
      ['Latitude', 'Longitude', 'Total Searches', 'With Coverage', 'Without Coverage', 'No Coverage Leads', 'Demand Score', 'Gap Score', 'Sample Addresses'].join(','),
      ...hotspots.map((h) =>
        [
          h.latitude,
          h.longitude,
          h.totalSearches,
          h.withCoverage,
          h.withoutCoverage,
          h.noCoverageLeads,
          h.demandScore,
          h.gapScore,
          `"${h.sampleAddresses.join('; ').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demand-hotspots-${demandDays}d-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dfa', label: 'DFA Buildings', icon: <PiBuildingsBold className="h-4 w-4" /> },
    { id: 'demand', label: 'Demand Hotspots', icon: <PiFireBold className="h-4 w-4" /> },
    { id: 'tarana', label: 'Tarana Capacity', icon: <PiRadioBold className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PiTargetBold className="h-8 w-8 text-purple-600" />
            Campaign Builder
          </h1>
          <p className="text-gray-600 mt-1">
            Build targeted campaign lists from DFA buildings, Tarana coverage, and demand data
          </p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <PiWarningBold className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* DFA Tab */}
        {activeTab === 'dfa' && (
          <>
            {/* DFA Stats */}
            {dfaSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Buildings</p>
                        <p className="text-3xl font-bold">
                          {dfaSummary.totalBuildings.toLocaleString()}
                        </p>
                      </div>
                      <PiBuildingsBold className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Connected (Active Fibre)</p>
                    <p className="text-3xl font-bold text-green-600">
                      {dfaSummary.connected.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Near-Net (Within 200m)</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {dfaSummary.nearNet.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>DFA Building Campaign List</CardTitle>
                    <CardDescription>
                      Filter and export building addresses for targeted campaigns
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={fetchDFA} disabled={loading} variant="outline" size="sm">
                      <PiArrowsClockwiseBold className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button onClick={exportDFAToCSV} variant="outline" size="sm">
                      <PiDownloadSimpleBold className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search building or address..."
                    value={dfaSearch}
                    onChange={(e) => {
                      setDfaSearch(e.target.value);
                      setDfaPage(1);
                    }}
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={dfaCoverageType}
                    onChange={(e) => {
                      setDfaCoverageType(e.target.value);
                      setDfaPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Coverage Types</option>
                    <option value="connected">Connected</option>
                    <option value="near-net">Near-Net</option>
                  </select>
                  {dfaSummary && dfaSummary.precincts.length > 0 && (
                    <select
                      value={dfaPrecinct}
                      onChange={(e) => {
                        setDfaPrecinct(e.target.value);
                        setDfaPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Precincts</option>
                      {dfaSummary.precincts.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.count})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Building</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Address</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Type</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">FTTH</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Precinct</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Promo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && dfaItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500">
                            Loading buildings...
                          </td>
                        </tr>
                      ) : dfaItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500">
                            No buildings match your filters
                          </td>
                        </tr>
                      ) : (
                        dfaItems.map((b) => (
                          <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium">{b.buildingName || '-'}</td>
                            <td className="py-3 px-2 text-gray-600 max-w-[200px] truncate">
                              {b.streetAddress || '-'}
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  b.coverageType === 'connected'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {b.coverageType}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs">{b.ftth || '-'}</td>
                            <td className="py-3 px-2 text-xs">{b.precinct || '-'}</td>
                            <td className="py-3 px-2 text-xs">{b.promotion || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {dfaTotalPages > 1 && (
                  <div className="flex items-center justify-end mt-4 pt-4 border-t gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={dfaPage <= 1}
                      onClick={() => setDfaPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {dfaPage} of {dfaTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={dfaPage >= dfaTotalPages}
                      onClick={() => setDfaPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Demand Hotspots Tab */}
        {activeTab === 'demand' && (
          <>
            {demandSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Coverage Searches</p>
                    <p className="text-3xl font-bold">
                      {demandSummary.totalCoverageSearches.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">No Coverage Leads</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {demandSummary.totalNoCoverageLeads.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Coverage Rate</p>
                    <p className="text-3xl font-bold text-green-600">
                      {demandSummary.coverageRate}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Hotspots Found</p>
                    <p className="text-3xl font-bold text-red-600">
                      {demandSummary.hotspotsFound}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PiFireBold className="h-5 w-5 text-orange-500" />
                      Demand Hotspots
                    </CardTitle>
                    <CardDescription>
                      Areas with high search volume — prioritize for infrastructure expansion
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={demandDays}
                      onChange={(e) => setDemandDays(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="180">Last 6 months</option>
                      <option value="365">Last year</option>
                    </select>
                    <Button onClick={fetchDemand} disabled={loading} variant="outline" size="sm">
                      <PiArrowsClockwiseBold className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button onClick={exportDemanToCSV} variant="outline" size="sm">
                      <PiDownloadSimpleBold className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Location</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Sample Addresses</th>
                        <th className="py-3 px-2 text-right font-medium text-gray-500">Searches</th>
                        <th className="py-3 px-2 text-right font-medium text-gray-500">No Coverage</th>
                        <th className="py-3 px-2 text-right font-medium text-gray-500">Demand Score</th>
                        <th className="py-3 px-2 text-right font-medium text-gray-500">Gap Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && hotspots.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500">
                            Analyzing demand patterns...
                          </td>
                        </tr>
                      ) : hotspots.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500">
                            No demand hotspots found for this period
                          </td>
                        </tr>
                      ) : (
                        hotspots.map((h, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1">
                                <PiMapPinBold className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {h.latitude.toFixed(3)}, {h.longitude.toFixed(3)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 max-w-[250px]">
                              <div className="space-y-0.5">
                                {h.sampleAddresses.slice(0, 2).map((addr, j) => (
                                  <p key={j} className="text-xs text-gray-600 truncate">
                                    {addr}
                                  </p>
                                ))}
                                {h.sampleAddresses.length > 2 && (
                                  <p className="text-xs text-gray-400">
                                    +{h.sampleAddresses.length - 2} more
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right font-medium">
                              {h.totalSearches}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="text-orange-600 font-medium">
                                {h.noCoverageLeads}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  h.demandScore >= 10
                                    ? 'bg-red-100 text-red-800'
                                    : h.demandScore >= 5
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {h.demandScore}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="text-red-600 font-medium">
                                {h.gapScore}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tarana Tab */}
        {activeTab === 'tarana' && (
          <>
            {taranaSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Base Stations</p>
                        <p className="text-3xl font-bold">
                          {taranaSummary.totalStations.toLocaleString()}
                        </p>
                      </div>
                      <PiRadioBold className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">Markets Covered</p>
                    <p className="text-3xl font-bold">
                      {taranaSummary.markets.length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tarana Base Station Network</CardTitle>
                    <CardDescription>
                      SkyFibre coverage for geo-targeted wireless campaigns
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={fetchTarana} disabled={loading} variant="outline" size="sm">
                      <PiArrowsClockwiseBold className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button onClick={exportTaranaToCSV} variant="outline" size="sm">
                      <PiDownloadSimpleBold className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search site, hostname, or market..."
                    value={taranaSearch}
                    onChange={(e) => {
                      setTaranaSearch(e.target.value);
                      setTaranaPage(1);
                    }}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Site Name</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Hostname</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Market</th>
                        <th className="py-3 px-2 text-right font-medium text-gray-500">Active Connections</th>
                        <th className="py-3 px-2 text-left font-medium text-gray-500">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && taranaItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-500">
                            Loading stations...
                          </td>
                        </tr>
                      ) : taranaItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-500">
                            No stations found
                          </td>
                        </tr>
                      ) : (
                        taranaItems.map((s) => (
                          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium">{s.siteName || '-'}</td>
                            <td className="py-3 px-2 text-gray-600 text-xs">{s.hostname || '-'}</td>
                            <td className="py-3 px-2">{s.market || '-'}</td>
                            <td className="py-3 px-2 text-right">
                              {s.activeConnections != null ? (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    s.activeConnections > 50
                                      ? 'bg-red-100 text-red-800'
                                      : s.activeConnections > 20
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {s.activeConnections}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-2 text-xs text-gray-500">
                              {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {taranaTotalPages > 1 && (
                  <div className="flex items-center justify-end mt-4 pt-4 border-t gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={taranaPage <= 1}
                      onClick={() => setTaranaPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {taranaPage} of {taranaTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={taranaPage >= taranaTotalPages}
                      onClick={() => setTaranaPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Breakdown */}
            {taranaSummary && taranaSummary.markets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Market Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {taranaSummary.markets.map((m) => (
                      <div key={m.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span>{m.name}</span>
                        <span className="text-gray-500">({m.count})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
