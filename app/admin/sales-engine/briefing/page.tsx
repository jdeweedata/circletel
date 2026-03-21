'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PiPhoneBold,
  PiClockBold,
  PiWarningCircleBold,
  PiTrendUpBold,
  PiTargetBold,
  PiArrowLeftBold,
  PiCurrencyDollarBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import { PIPELINE_STAGE_LABELS } from '@/lib/sales-engine/types';
import type { PipelineStage } from '@/lib/sales-engine/types';

// =============================================================================
// Types (matching API response shape)
// =============================================================================

interface BriefingLead {
  id: string;
  company_name: string | null;
  address: string;
  phone: string | null;
  composite_score: number;
  recommended_product: string | null;
  estimated_mrr: number | null;
  zone_name: string | null;
}

interface StalledDeal {
  id: string;
  company_name: string | null;
  address: string;
  stage: PipelineStage;
  stage_label: string;
  days_stuck: number;
  day_target: number;
  quote_mrr: number | null;
}

interface FollowUp {
  id: string;
  company_name: string | null;
  address: string;
  stage: PipelineStage;
  stage_label: string;
  last_activity: string;
  quote_mrr: number | null;
}

interface ZoneAlert {
  zone_id: string;
  zone_name: string;
  action: string;
  avg_close_rate: number;
}

interface MSCSnapshot {
  period_label: string;
  actual_rns: number;
  required_rns: number;
  days_remaining: number;
  status: string;
}

interface MarketAlertItem {
  province: string;
  signal: string;
  detail: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

interface DailyBriefing {
  priority_calls: BriefingLead[];
  stalled_deals: StalledDeal[];
  follow_ups: FollowUp[];
  zone_alerts: ZoneAlert[];
  msc_snapshot: MSCSnapshot | null;
  market_context: {
    alerts: MarketAlertItem[];
    province_summary: string;
  } | null;
  summary: {
    calls_needed: number;
    pipeline_mrr: number;
    deals_to_close: number;
  };
}

// =============================================================================
// Helpers
// =============================================================================

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function getScoreBadgeClasses(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-700';
  if (score >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function getActionBadge(action: string): { label: string; classes: string } {
  switch (action) {
    case 'increase_effort':
      return { label: 'Increase Effort', classes: 'bg-green-100 text-green-700' };
    case 'change_message':
      return { label: 'Change Message', classes: 'bg-amber-100 text-amber-700' };
    case 'park_zone':
      return { label: 'Park Zone', classes: 'bg-red-100 text-red-700' };
    default:
      return { label: action.replace(/_/g, ' '), classes: 'bg-gray-100 text-gray-600' };
  }
}

// =============================================================================
// Component
// =============================================================================

export default function DailyBriefingPage() {
  const [data, setData] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sales-engine/briefing');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch briefing:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  async function addToPipeline(coverageLeadId: string) {
    try {
      setAddingToPipeline(coverageLeadId);
      const res = await fetch('/api/admin/sales-engine/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverage_lead_id: coverageLeadId }),
      });
      if (res.ok) {
        fetchBriefing();
      }
    } catch (err) {
      console.error('Failed to add to pipeline:', err);
    } finally {
      setAddingToPipeline(null);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
      </div>
    );
  }

  const msc = data?.msc_snapshot;
  const mscProgress = msc
    ? Math.min((msc.actual_rns / msc.required_rns) * 100, 100)
    : 0;
  const mscStatusColor =
    msc?.status === 'met'
      ? 'bg-green-500'
      : msc?.status === 'at_risk'
        ? 'bg-amber-500'
        : msc?.status === 'missed'
          ? 'bg-red-500'
          : 'bg-blue-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/admin/sales-engine"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <PiArrowLeftBold className="h-4 w-4" />
              Sales Engine
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Briefing</h1>
          <p className="text-gray-500 mt-1">What should I do today?</p>
        </div>
      </div>

      {/* MSC Progress Bar */}
      {msc && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                MTN MSC Tracker — {msc.period_label}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {msc.days_remaining} days remaining in period
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${mscStatusColor}`}
            >
              {msc.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${mscStatusColor}`}
                  style={{ width: `${mscProgress}%` }}
                />
              </div>
            </div>
            <div className="text-right min-w-[120px]">
              <span className="text-2xl font-bold text-gray-900">{msc.actual_rns}</span>
              <span className="text-gray-400 text-sm"> / {msc.required_rns} RNs</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Calls Needed"
          value={data?.summary.calls_needed ?? 0}
          icon={<PiPhoneBold className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle="Priority leads not yet in pipeline"
        />
        <StatCard
          label="Pipeline MRR"
          value={`R${(data?.summary.pipeline_mrr ?? 0).toLocaleString()}`}
          icon={<PiTrendUpBold className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle="Total open deal value"
        />
        <StatCard
          label="Deals to Close"
          value={data?.summary.deals_to_close ?? 0}
          icon={<PiTargetBold className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle="At quote or contract stage"
        />
      </div>

      {/* Section 1: Priority Calls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <PiPhoneBold className="h-4 w-4" />
          Priority Calls
        </h2>
        {(data?.priority_calls ?? []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Company / Address</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Zone</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Est. MRR</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {data!.priority_calls.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {lead.company_name || 'Unknown Company'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">
                        {lead.address}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {lead.zone_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getScoreBadgeClasses(lead.composite_score)}`}
                      >
                        {lead.composite_score.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {lead.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {lead.recommended_product || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {lead.estimated_mrr != null ? `R${lead.estimated_mrr.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => addToPipeline(lead.id)}
                        disabled={addingToPipeline === lead.id}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-circleTel-orange text-white hover:bg-circleTel-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {addingToPipeline === lead.id ? 'Adding...' : 'Add to Pipeline'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <PiPhoneBold className="h-8 w-8 mb-2" />
            <p className="text-sm">No priority calls — all scored leads are in the pipeline</p>
          </div>
        )}
      </div>

      {/* Section 2: Stalled Deals */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <PiWarningCircleBold className="h-4 w-4" />
          Stalled Deals
        </h2>
        {(data?.stalled_deals ?? []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Company / Address</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Stage</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Days Stuck</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Day Target</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">MRR</th>
                </tr>
              </thead>
              <tbody>
                {data!.stalled_deals.map((deal) => (
                  <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {deal.company_name || 'Unknown Company'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">
                        {deal.address}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {deal.stage_label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-semibold ${deal.days_stuck > deal.day_target * 2 ? 'text-red-600' : 'text-amber-600'}`}
                      >
                        {deal.days_stuck}d
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500">
                      {deal.day_target}d
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {deal.quote_mrr != null ? `R${deal.quote_mrr.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <PiWarningCircleBold className="h-8 w-8 mb-2" />
            <p className="text-sm">No stalled deals — all deals are on track</p>
          </div>
        )}
      </div>

      {/* Section 3: Follow Ups */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <PiClockBold className="h-4 w-4" />
          Follow Ups
        </h2>
        {(data?.follow_ups ?? []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Company / Address</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Stage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Last Activity</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">MRR</th>
                </tr>
              </thead>
              <tbody>
                {data!.follow_ups.map((fu) => (
                  <tr key={fu.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {fu.company_name || 'Unknown Company'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">
                        {fu.address}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {fu.stage_label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {getRelativeTime(fu.last_activity)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {fu.quote_mrr != null ? `R${fu.quote_mrr.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <PiClockBold className="h-8 w-8 mb-2" />
            <p className="text-sm">No follow ups needed right now</p>
          </div>
        )}
      </div>

      {/* Section 4: Zone Alerts */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <PiCurrencyDollarBold className="h-4 w-4" />
          Zone Alerts
        </h2>
        {(data?.zone_alerts ?? []).length > 0 ? (
          <div className="space-y-3">
            {data!.zone_alerts.map((alert) => {
              const badge = getActionBadge(alert.action);
              return (
                <div
                  key={alert.zone_id}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{alert.zone_name}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {alert.avg_close_rate.toFixed(1)}% close rate
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <PiCurrencyDollarBold className="h-8 w-8 mb-2" />
            <p className="text-sm">No zone alerts — all zones are performing well</p>
          </div>
        )}
      </div>

      {/* Section 5: Market Alerts */}
      {data?.market_context && data.market_context.alerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <PiCurrencyDollarBold className="h-4 w-4" />
            Market Intelligence
          </h2>
          <p className="text-xs text-gray-400 mb-4">{data.market_context.province_summary}</p>
          <div className="space-y-3">
            {data.market_context.alerts.map((alert, idx) => (
              <div
                key={`${alert.province}-${idx}`}
                className={`py-3 px-4 rounded-lg border ${
                  alert.impact === 'positive' ? 'bg-green-50 border-green-200' :
                  alert.impact === 'negative' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{alert.province}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    alert.impact === 'positive' ? 'bg-green-100 text-green-700' :
                    alert.impact === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {alert.signal}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{alert.detail}</p>
                <p className="text-xs text-gray-500 mt-1 italic">{alert.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
