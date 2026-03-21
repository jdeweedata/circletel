'use client';

import { PiCheckCircleBold, PiFunnelBold, PiHeartbeatBold, PiTrendDownBold, PiTrendUpBold, PiWarningCircleBold } from 'react-icons/pi';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/admin/shared/StatCard';
import type { PipelineEntry, PipelineStage, SalesZone } from '@/lib/sales-engine/types';
import { PIPELINE_STAGE_ORDER, PIPELINE_STAGE_LABELS } from '@/lib/sales-engine/types';

const STAGE_COLORS: Record<PipelineStage, string> = {
  coverage_confirmed: 'border-t-blue-400',
  contact_made: 'border-t-indigo-400',
  site_survey_booked: 'border-t-purple-400',
  quote_sent: 'border-t-amber-400',
  objection_stage: 'border-t-orange-400',
  contract_signed: 'border-t-green-400',
  installed_active: 'border-t-emerald-500',
};

const OUTCOME_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  parked: 'bg-gray-100 text-gray-600',
};

export default function PipelinePage() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [zones, setZones] = useState<SalesZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '200' });
      if (selectedZone !== 'all') params.set('zone_id', selectedZone);
      if (outcomeFilter !== 'all') params.set('outcome', outcomeFilter);

      const [pipelineRes, zonesRes] = await Promise.all([
        fetch(`/api/admin/sales-engine/pipeline?${params}`),
        fetch('/api/admin/sales-engine/zones'),
      ]);

      const [pipelineJson, zonesJson] = await Promise.all([
        pipelineRes.json(),
        zonesRes.json(),
      ]);

      setEntries(Array.isArray(pipelineJson.data) ? pipelineJson.data : []);
      setZones(Array.isArray(zonesJson.data) ? zonesJson.data : []);
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, outcomeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDeals = entries.filter((e) => e.outcome === 'open');
  const wonDeals = entries.filter((e) => e.outcome === 'won');
  const lostDeals = entries.filter((e) => e.outcome === 'lost');
  const totalOpenMRR = openDeals.reduce((sum, e) => sum + (Number(e.quote_mrr) || 0), 0);
  const totalWonMRR = wonDeals.reduce((sum, e) => sum + (Number(e.quote_mrr) || 0), 0);

  // Group by stage for kanban
  const stageGroups: Record<PipelineStage, PipelineEntry[]> = {} as Record<PipelineStage, PipelineEntry[]>;
  for (const stage of PIPELINE_STAGE_ORDER) {
    stageGroups[stage] = entries.filter((e) => e.stage === stage && e.outcome === 'open');
  }

  // Objection analysis
  const objectionCounts: Record<string, number> = {};
  for (const entry of lostDeals) {
    if (entry.objection_category) {
      objectionCounts[entry.objection_category] = (objectionCounts[entry.objection_category] || 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-500 mt-1">7-day close cycle — zone-aware pipeline management</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/sales-engine/pipeline/health"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <PiHeartbeatBold className="h-4 w-4" />
            Health
          </Link>
          <Link
            href="/admin/sales-engine/pipeline/loss-analysis"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <PiTrendDownBold className="h-4 w-4" />
            Loss Analysis
          </Link>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              viewMode === 'kanban' ? 'bg-circleTel-orange text-white border-circleTel-orange' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              viewMode === 'table' ? 'bg-circleTel-orange text-white border-circleTel-orange' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Open Deals"
          value={openDeals.length}
          icon={<PiFunnelBold className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={`R${totalOpenMRR.toLocaleString()} pipeline MRR`}
        />
        <StatCard
          label="Won"
          value={wonDeals.length}
          icon={<PiCheckCircleBold className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={`R${totalWonMRR.toLocaleString()} won MRR`}
        />
        <StatCard
          label="Lost"
          value={lostDeals.length}
          icon={<PiWarningCircleBold className="h-5 w-5" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          label="Win Rate"
          value={entries.length > 0 ? `${((wonDeals.length / Math.max(wonDeals.length + lostDeals.length, 1)) * 100).toFixed(0)}%` : '—'}
          icon={<PiTrendUpBold className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Filters */}
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
          <label className="block text-xs font-medium text-gray-500 mb-1">Outcome</label>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="parked">Parked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGE_ORDER.map((stage) => (
            <div key={stage} className={`flex-shrink-0 w-64 bg-gray-50 rounded-lg border-t-4 ${STAGE_COLORS[stage]}`}>
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase">
                    {PIPELINE_STAGE_LABELS[stage]}
                  </h3>
                  <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {stageGroups[stage].length}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                {stageGroups[stage].length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No deals</p>
                ) : (
                  stageGroups[stage].map((entry) => (
                    <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(entry as PipelineEntry & { coverage_leads?: { company_name?: string; address?: string } }).coverage_leads?.company_name ||
                         (entry as PipelineEntry & { coverage_leads?: { address?: string } }).coverage_leads?.address ||
                         'Lead'}
                      </p>
                      {entry.quote_mrr && (
                        <p className="text-xs font-semibold text-green-600 mt-1">
                          R{Number(entry.quote_mrr).toLocaleString()}/mo
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {entry.contact_method && (
                          <span className="text-xs text-gray-400">{entry.contact_method}</span>
                        )}
                        {entry.product_tier && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            {entry.product_tier}
                          </span>
                        )}
                      </div>
                      {entry.stage_entered_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {getDaysInStage(entry.stage_entered_at)}d in stage
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">MRR</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Outcome</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Days</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {(entry as PipelineEntry & { coverage_leads?: { company_name?: string; address?: string } }).coverage_leads?.company_name ||
                         (entry as PipelineEntry & { coverage_leads?: { address?: string } }).coverage_leads?.address ||
                         'Lead'}
                      </p>
                      {entry.loss_reason && (
                        <p className="text-xs text-red-400">{entry.loss_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {PIPELINE_STAGE_LABELS[entry.stage]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.contact_method || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {entry.quote_mrr ? `R${Number(entry.quote_mrr).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.product_tier || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        OUTCOME_COLORS[entry.outcome]
                      }`}>
                        {entry.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {getDaysInStage(entry.stage_entered_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Objection Analysis */}
      {Object.keys(objectionCounts).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Loss Analysis — Objection Patterns
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(objectionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 mt-1">{category.replace('_', ' ')}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getDaysInStage(stageEnteredAt: string): number {
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
}
