'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiMagnifyingGlassBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiMapPinBold,
  PiLightningBold,
  PiFactoryBold,
  PiFirstAidBold,
  PiHouseBold,
  PiGridFourBold,
  PiStorefrontBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import type { ZoneDiscoveryCandidate, ZoneDiscoveryStatus } from '@/lib/sales-engine/types';

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

const ZONE_TYPE_ICONS: Record<string, React.ReactNode> = {
  office_park: <PiFactoryBold className="w-4 h-4" />,
  clinic_cluster: <PiFirstAidBold className="w-4 h-4" />,
  residential_estate: <PiHouseBold className="w-4 h-4" />,
  commercial_strip: <PiStorefrontBold className="w-4 h-4" />,
  mixed: <PiGridFourBold className="w-4 h-4" />,
};

const ZONE_TYPE_LABELS: Record<string, string> = {
  office_park: 'Office Park',
  clinic_cluster: 'Clinic Cluster',
  residential_estate: 'Residential',
  commercial_strip: 'Commercial',
  mixed: 'Mixed Use',
};

function scoreColor(score: number): string {
  if (score >= 70) return 'text-green-700 bg-green-100';
  if (score >= 40) return 'text-amber-700 bg-amber-100';
  return 'text-red-700 bg-red-100';
}

function scoreBorderColor(score: number): string {
  if (score >= 70) return 'border-green-200';
  if (score >= 40) return 'border-amber-200';
  return 'border-red-200';
}

export default function ZoneDiscoveryPage() {
  const [candidates, setCandidates] = useState<ZoneDiscoveryCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ZoneDiscoveryStatus | ''>('pending');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected for bulk
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (provinceFilter) params.set('province', provinceFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');

      const res = await fetch(`/api/admin/sales-engine/zone-discovery?${params}`);
      const json = await res.json();

      if (json.success && json.data) {
        setCandidates(json.data.candidates);
        setTotal(json.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, provinceFilter, page]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  async function handleRunDiscovery() {
    try {
      setRunning(true);
      const body: Record<string, unknown> = {};
      if (provinceFilter) body.province = provinceFilter;

      const res = await fetch('/api/admin/sales-engine/zone-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        await fetchCandidates();
      }
    } catch (error) {
      console.error('Discovery run failed:', error);
    } finally {
      setRunning(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/sales-engine/zone-discovery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (json.success) {
        await fetchCandidates();
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkAction(action: 'approve' | 'reject') {
    if (selected.size === 0) return;
    try {
      setActionLoading('bulk');
      const res = await fetch('/api/admin/sales-engine/zone-discovery/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_ids: Array.from(selected),
          action,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setSelected(new Set());
        await fetchCandidates();
      }
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
    } finally {
      setActionLoading(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((c) => c.id)));
    }
  }

  // Stats
  const pendingCount = candidates.filter((c) => c.status === 'pending').length;
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((sum, c) => sum + c.composite_score, 0) / candidates.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/admin/sales-engine"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <PiArrowLeftBold className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Zone Discovery</h1>
            <p className="text-sm text-slate-500">
              Auto-discover high-potential zones from ward demographics &amp; coverage data
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleRunDiscovery}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            <PiMagnifyingGlassBold className="w-4 h-4" />
            {running ? 'Running Discovery...' : 'Run Discovery'}
          </button>

          {/* Filters */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ZoneDiscoveryStatus | ''); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={provinceFilter}
            onChange={(e) => { setProvinceFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Candidates"
            value={total}
            icon={<PiMapPinBold className="w-5 h-5 text-blue-500" />}
          />
          <StatCard
            label="Pending Review"
            value={pendingCount}
            icon={<PiMagnifyingGlassBold className="w-5 h-5 text-amber-500" />}
          />
          <StatCard
            label="Avg Score"
            value={avgScore}
            icon={<PiLightningBold className="w-5 h-5 text-green-500" />}
          />
          <StatCard
            label="Selected"
            value={selected.size}
            icon={<PiCheckCircleBold className="w-5 h-5 text-purple-500" />}
          />
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-blue-800">
              {selected.size} selected
            </span>
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={actionLoading === 'bulk'}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50"
            >
              <PiCheckCircleBold className="w-4 h-4" /> Approve All
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={actionLoading === 'bulk'}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:opacity-50"
            >
              <PiXCircleBold className="w-4 h-4" /> Reject All
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading candidates...</div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <PiMapPinBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              No candidates found. Click &quot;Run Discovery&quot; to scan for high-potential zones.
            </p>
          </div>
        ) : (
          /* Candidate Cards */
          <div className="space-y-4">
            {/* Select all */}
            {statusFilter === 'pending' && candidates.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={selected.size === candidates.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
                Select all ({candidates.length})
              </label>
            )}

            {candidates.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl border ${scoreBorderColor(c.composite_score)} p-5 space-y-3`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {c.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-slate-300 mt-1"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {c.suggested_zone_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${scoreColor(c.composite_score)}`}>
                          Score: {c.composite_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        {ZONE_TYPE_ICONS[c.suggested_zone_type]}
                        <span>{ZONE_TYPE_LABELS[c.suggested_zone_type] ?? c.suggested_zone_type}</span>
                        <span>·</span>
                        <span>{c.province}</span>
                        {c.municipality && (
                          <>
                            <span>·</span>
                            <span>{c.municipality}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status or Actions */}
                  {c.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(c.id, 'approve')}
                        disabled={actionLoading === c.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        <PiCheckCircleBold className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(c.id, 'reject')}
                        disabled={actionLoading === c.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-md text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <PiXCircleBold className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'approved' ? 'bg-green-100 text-green-700' :
                      c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {c.status}
                    </span>
                  )}
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500">Demographics</div>
                    <div className="font-semibold text-slate-900">{c.demographic_fit_score}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500">Coverage</div>
                    <div className="font-semibold text-slate-900">{c.coverage_score}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500">Product Fit</div>
                    <div className="font-semibold text-slate-900">{c.product_alignment_score}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-500">Market Opp</div>
                    <div className="font-semibold text-slate-900">{c.market_opportunity_score}</div>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span>Pop: {c.total_population?.toLocaleString()}</span>
                  <span>No Internet: {c.pct_no_internet}%</span>
                  <span>Base Stations: {c.base_station_count}</span>
                  <span>DFA Connected: {c.dfa_connected_count}</span>
                  <span>Business POIs: {c.business_poi_count}</span>
                  {c.milestone_month && (
                    <span className="text-blue-600 font-medium">
                      Month {c.milestone_month} Target
                    </span>
                  )}
                </div>

                {/* Eligible products */}
                <div className="flex flex-wrap gap-1.5">
                  {c.eligible_products.map((product) => (
                    <span
                      key={product}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.milestone_target_products?.includes(product)
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
