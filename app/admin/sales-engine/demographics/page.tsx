'use client';

import { PiArrowsClockwiseBold, PiCloudArrowUpBold, PiGlobeBold, PiMapPinBold, PiTargetBold, PiUsersBold } from 'react-icons/pi';
import React, { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/admin/shared/StatCard';
import { ZoneSuggestionPanel } from '@/components/admin/sales-engine/ZoneSuggestionPanel';

interface WardRow {
  id: string;
  ward_code: string;
  ward_name: string | null;
  municipality: string | null;
  province: string;
  total_population: number;
  total_households: number;
  pct_no_internet: number;
  pct_income_above_r12800: number;
  pct_employed: number;
  demographic_fit_score: number;
  business_poi_count: number;
}

interface ImportStats {
  total_wards: number;
  provinces_covered: number;
  avg_fit_score: number;
  high_opportunity_wards: number;
}

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

export default function DemographicsPage() {
  const [wards, setWards] = useState<WardRow[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 30;

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sales-engine/demographics/wards?mode=stats');
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchWards = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (provinceFilter) params.set('province', provinceFilter);

      const res = await fetch(`/api/admin/sales-engine/demographics/wards?${params}`);
      const json = await res.json();
      if (json.success) {
        setWards(Array.isArray(json.data) ? json.data : []);
        setTotal(json.total ?? 0);
      }
    } catch (error) {
      console.error('Failed to fetch wards:', error);
    } finally {
      setLoading(false);
    }
  }, [page, provinceFilter]);

  useEffect(() => {
    fetchStats();
    fetchWards();
  }, [fetchStats, fetchWards]);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/sales-engine/demographics/import', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setImportResult(`Imported ${json.data.imported} wards from ${json.data.rows_parsed} rows`);
        fetchStats();
        fetchWards();
      } else {
        setImportResult(`Error: ${json.error}`);
      }
    } catch (error) {
      setImportResult(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ward Demographics</h1>
          <p className="text-gray-500 mt-1">Stats SA Census 2022 ward-level demographic intelligence for zone targeting</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg text-sm font-medium hover:bg-circleTel-orange/90 cursor-pointer">
            <PiCloudArrowUpBold className="h-4 w-4" />
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          importResult.startsWith('Error') || importResult.startsWith('Import failed')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {importResult}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Wards Imported"
          value={stats?.total_wards ?? 0}
          icon={<PiMapPinBold className="h-5 w-5" />}
        />
        <StatCard
          label="Provinces Covered"
          value={`${stats?.provinces_covered ?? 0} / 9`}
          icon={<PiGlobeBold className="h-5 w-5" />}
        />
        <StatCard
          label="Avg Fit Score"
          value={stats?.avg_fit_score?.toFixed(1) ?? '0'}
          icon={<PiTargetBold className="h-5 w-5" />}
        />
        <StatCard
          label="High Opportunity"
          value={stats?.high_opportunity_wards ?? 0}
          icon={<PiUsersBold className="h-5 w-5" />}
        />
      </div>

      {/* Zone Suggestions Panel */}
      <ZoneSuggestionPanel />

      {/* Province Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Filter by Province:</label>
        <select
          value={provinceFilter}
          onChange={(e) => { setProvinceFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
        >
          <option value="">All Provinces</option>
          {SA_PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{total} wards</span>
      </div>

      {/* Ward Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
          </div>
        ) : wards.length === 0 ? (
          <div className="text-center py-12">
            <PiUsersBold className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No ward data imported yet. Upload a Stats SA Census CSV to get started.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ward</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Municipality</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Province</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Population</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Households</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">No Internet</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Income R12.8k+</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employed</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fit Score</th>
                </tr>
              </thead>
              <tbody>
                {wards.map((ward) => (
                  <tr key={ward.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{ward.ward_name ?? ward.ward_code}</p>
                      <p className="text-xs text-gray-400">{ward.ward_code}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ward.municipality ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ward.province}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {ward.total_population.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {ward.total_households.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${
                        ward.pct_no_internet >= 50 ? 'text-green-600' :
                        ward.pct_no_internet >= 25 ? 'text-amber-600' :
                        'text-gray-500'
                      }`}>
                        {Number(ward.pct_no_internet).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {Number(ward.pct_income_above_r12800).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {Number(ward.pct_employed).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        ward.demographic_fit_score >= 60 ? 'bg-green-100 text-green-700' :
                        ward.demographic_fit_score >= 35 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {Number(ward.demographic_fit_score).toFixed(0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
