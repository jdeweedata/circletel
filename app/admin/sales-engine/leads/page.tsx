'use client';

import { PiChartBarBold, PiFunnelBold, PiTargetBold } from 'react-icons/pi';
import React, { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/admin/shared/StatCard';
import type { LeadScore, SalesZone, OutreachTrack } from '@/lib/sales-engine/types';

const TRACK_LABELS: Record<OutreachTrack, string> = {
  office_park: 'Office Park (Track A)',
  sme_strip: 'SME Strip (Track B)',
  clinic: 'ClinicConnect (Track C)',
  referral: 'Referral (Track D)',
  residential: 'Residential',
};

const TRACK_COLORS: Record<OutreachTrack, string> = {
  office_park: 'bg-blue-100 text-blue-700',
  sme_strip: 'bg-green-100 text-green-700',
  clinic: 'bg-purple-100 text-purple-700',
  referral: 'bg-amber-100 text-amber-700',
  residential: 'bg-gray-100 text-gray-600',
};

export default function LeadScoringPage() {
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [zones, setZones] = useState<SalesZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (selectedZone !== 'all') params.set('zone_id', selectedZone);
      if (selectedTrack !== 'all') params.set('track', selectedTrack);
      if (minScore > 0) params.set('min_score', String(minScore));

      const [leadsRes, zonesRes] = await Promise.all([
        fetch(`/api/admin/sales-engine/leads?${params}`),
        fetch('/api/admin/sales-engine/zones'),
      ]);

      const [leadsJson, zonesJson] = await Promise.all([
        leadsRes.json(),
        zonesRes.json(),
      ]);

      setLeads(Array.isArray(leadsJson.data) ? leadsJson.data : []);
      setZones(Array.isArray(zonesJson.data) ? zonesJson.data : []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, selectedTrack, minScore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const avgScore = leads.length > 0
    ? leads.reduce((sum, l) => sum + Number(l.composite_score), 0) / leads.length
    : 0;

  const totalEstimatedMRR = leads.reduce((sum, l) => sum + (Number(l.estimated_mrr) || 0), 0);

  const trackCounts: Record<string, number> = {};
  for (const lead of leads) {
    const track = lead.recommended_track || 'unknown';
    trackCounts[track] = (trackCounts[track] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Scoring</h1>
        <p className="text-gray-500 mt-1">Address-level scoring with 4-dimension model (Product Fit, Revenue, Competition, Speed)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Scored"
          value={leads.length}
          icon={<PiChartBarBold className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Avg Score"
          value={avgScore.toFixed(1)}
          icon={<PiTargetBold className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label="Est. Pipeline MRR"
          value={`R${totalEstimatedMRR.toLocaleString()}`}
          icon={<PiFunnelBold className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label="High Priority"
          value={leads.filter((l) => Number(l.composite_score) >= 70).length}
          subtitle="Score 70+"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Track</label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All Tracks</option>
              {Object.entries(TRACK_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Min Score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-20"
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <PiChartBarBold className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No scored leads found. Score leads from the coverage pipeline.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lead</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product Fit</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Competition</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Speed</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Track</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Est. MRR</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {(lead as LeadScore & { coverage_leads?: { address?: string; company_name?: string } }).coverage_leads?.company_name ||
                         (lead as LeadScore & { coverage_leads?: { address?: string } }).coverage_leads?.address ||
                         'Unknown'}
                      </p>
                      {lead.competitor_identified && (
                        <p className="text-xs text-gray-400">vs {lead.competitor_identified}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        Number(lead.composite_score) >= 70 ? 'bg-green-100 text-green-700' :
                        Number(lead.composite_score) >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {Number(lead.composite_score).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBar value={lead.product_fit_score} weight={35} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBar value={lead.revenue_potential_score} weight={30} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBar value={lead.competitive_vuln_score} weight={20} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBar value={lead.conversion_speed_score} weight={15} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lead.recommended_product || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {lead.recommended_track && (
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          TRACK_COLORS[lead.recommended_track] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {TRACK_LABELS[lead.recommended_track] || lead.recommended_track}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {lead.estimated_mrr ? `R${Number(lead.estimated_mrr).toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ value, weight }: { value: number; weight: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-400'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6">{value}</span>
    </div>
  );
}
