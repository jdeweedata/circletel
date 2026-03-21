'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { StatCard } from '@/components/admin/shared/StatCard';
import { PiTargetBold, PiTrendUpBold, PiWarningCircleBold, PiUsersBold, PiArrowLeftBold } from 'react-icons/pi';
import type { ExecutionSnapshot, CompetitorIntelligenceSummary } from '@/lib/sales-engine/types';

export default function ExecutionPlanDashboard() {
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot | null>(null);
  const [competitorIntel, setCompetitorIntel] = useState<CompetitorIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [epRes, ciRes] = await Promise.all([
        fetch('/api/admin/sales-engine/execution-plan'),
        fetch('/api/admin/sales-engine/competitor-intelligence'),
      ]);

      const [epJson, ciJson] = await Promise.all([epRes.json(), ciRes.json()]);

      if (epJson.success && epJson.data) {
        setSnapshot(epJson.data);
      }
      if (ciJson.success && ciJson.data) {
        setCompetitorIntel(ciJson.data);
      }
    } catch (error) {
      console.error('Failed to fetch execution plan data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading execution plan...</div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">No execution plan data available. Apply the migration first.</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => `R${Number(value).toLocaleString()}`;
  const phaseColors = { bootstrap: '#3B82F6', scale: '#F59E0B', expand: '#10B981' };
  const statusColors: Record<string, string> = {
    met: 'bg-green-100 text-green-700',
    active: 'bg-blue-100 text-blue-700',
    at_risk: 'bg-red-100 text-red-700',
    upcoming: 'bg-slate-100 text-slate-500',
    missed: 'bg-red-200 text-red-800',
  };
  const alertSeverityColors: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/sales-engine" className="text-slate-400 hover:text-slate-600">
            <PiArrowLeftBold className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Bootstrap Execution Plan</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            snapshot.current_phase === 'bootstrap' ? 'bg-blue-100 text-blue-700' :
            snapshot.current_phase === 'scale' ? 'bg-amber-100 text-amber-700' :
            'bg-green-100 text-green-700'
          }`}>
            {snapshot.current_phase.toUpperCase()} Phase
          </span>
        </div>
        <p className="text-slate-500 text-sm">Tracking progress against the Bootstrap Execution Plan v1.0 — R1.1M MRR target by Month 12</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Phase Progress Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-medium text-slate-500 mb-3">Phase Progress</h3>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
            {(['bootstrap', 'scale', 'expand'] as const).map((phase) => {
              const phaseMilestones = snapshot.active_milestones.filter(m => m.phase === phase);
              const metCount = phaseMilestones.filter(m => m.status === 'met').length;
              const total = phaseMilestones.length;
              const pct = total > 0 ? (metCount / total) * (phase === 'bootstrap' ? 25 : phase === 'scale' ? 25 : 50) : 0;
              const isCurrent = snapshot.current_phase === phase;
              return (
                <div
                  key={phase}
                  className={`h-full transition-all duration-500 ${isCurrent ? 'animate-pulse' : ''}`}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: phaseColors[phase],
                    minWidth: metCount > 0 ? '2%' : '0',
                  }}
                  title={`${phase}: ${metCount}/${total} milestones met`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className="font-medium" style={{ color: phaseColors.bootstrap }}>Bootstrap (M1-3)</span>
            <span className="font-medium" style={{ color: phaseColors.scale }}>Scale (M4-6)</span>
            <span className="font-medium" style={{ color: phaseColors.expand }}>Expand (M7-12)</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Current MRR"
            value={formatCurrency(snapshot.total_mrr)}
            icon={<PiTrendUpBold className="w-5 h-5" />}
            subtitle={`${snapshot.mrr_attainment_pct}% of target`}
          />
          <StatCard
            label="Target MRR"
            value={formatCurrency(snapshot.target_mrr)}
            icon={<PiTargetBold className="w-5 h-5" />}
          />
          <StatCard
            label="MSC Coverage"
            value={`${snapshot.msc_coverage_ratio.toFixed(1)}x`}
            icon={<PiWarningCircleBold className="w-5 h-5" />}
            subtitle={snapshot.msc_coverage_ratio >= 1.5 ? 'Safe' : snapshot.msc_coverage_ratio >= 1.0 ? 'Warning' : 'Critical'}
          />
          <StatCard
            label="Total Customers"
            value={String(snapshot.total_customers)}
            icon={<PiUsersBold className="w-5 h-5" />}
          />
        </div>

        {/* MRR vs Target Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-medium text-slate-500 mb-3">MRR: Plan vs Actual</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} stroke="#94A3B8" fontSize={12} />
                <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}K`} stroke="#94A3B8" fontSize={12} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(m) => `Month ${m}`} />
                <Legend />
                <Area type="monotone" dataKey="target_mrr" name="Target" stroke="#94A3B8" fill="#F1F5F9" strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="actual_mrr" name="Actual" stroke="#F5831F" fill="#FEF3E2" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestone Grid */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Monthly Milestones</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {snapshot.active_milestones.map((m) => (
                <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  m.month_number === snapshot.current_month ? 'border-orange-300 bg-orange-50' : 'border-slate-100'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">M{m.month_number}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[m.status] ?? statusColors.upcoming}`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 truncate mt-0.5">{m.label}</p>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-medium text-slate-900">{formatCurrency(m.actual_mrr)}</div>
                    <div className="text-xs text-slate-400">/ {formatCurrency(m.target_mrr)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Hiring Triggers */}
          <div className="space-y-6">
            {/* Alerts */}
            {snapshot.alerts.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-medium text-slate-500 mb-3">Alerts ({snapshot.alerts.length})</h3>
                <div className="space-y-2">
                  {snapshot.alerts.map((alert, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${alertSeverityColors[alert.severity] ?? alertSeverityColors.info}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium uppercase">{alert.severity}</span>
                        <span className="text-xs">{alert.type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs mt-1 opacity-75">{alert.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hiring Triggers */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-500 mb-3">Hiring Triggers</h3>
              <div className="space-y-2">
                {snapshot.active_milestones
                  .filter(m => m.hiring_trigger)
                  .map((m) => {
                    const ready = snapshot.hiring_triggers_met.includes(m.hiring_trigger!);
                    return (
                      <div key={m.id} className={`p-3 rounded-lg border ${ready ? 'border-green-200 bg-green-50' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{m.hiring_trigger}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ready ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {ready ? 'READY' : `Need ${formatCurrency(m.target_mrr)} MRR`}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ready ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${Math.min((m.actual_mrr / m.target_mrr) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Competitor Intelligence */}
            {competitorIntel && competitorIntel.price_changes_7d.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-medium text-slate-500 mb-3">
                  Competitor Intelligence ({competitorIntel.price_changes_7d.length} changes this week)
                </h3>
                <div className="space-y-2">
                  {competitorIntel.price_changes_7d.slice(0, 5).map((change, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded border ${
                      change.direction === 'increase' ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'
                    }`}>
                      <div>
                        <span className="text-sm font-medium text-slate-700">{change.provider_name}</span>
                        <span className="text-xs text-slate-500 ml-2">{change.product_name}</span>
                      </div>
                      <span className={`text-sm font-medium ${change.direction === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                        {change.direction === 'increase' ? '+' : ''}{change.change_pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MSC Coverage Gauge */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-medium text-slate-500 mb-3">MTN Minimum Spend Commitment Coverage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{
                color: snapshot.msc_coverage_ratio >= 1.5 ? '#10B981' :
                       snapshot.msc_coverage_ratio >= 1.0 ? '#F59E0B' : '#EF4444'
              }}>
                {snapshot.msc_coverage_ratio.toFixed(1)}x
              </div>
              <div className="text-sm text-slate-500 mt-1">Coverage Ratio</div>
              <div className="text-xs text-slate-400">
                {snapshot.msc_coverage_ratio >= 1.5 ? 'Safe — revenue covers MSC by 1.5x+' :
                 snapshot.msc_coverage_ratio >= 1.0 ? 'Warning — tight margin above MSC' :
                 'Critical — revenue below MSC commitment'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(snapshot.total_mrr)}</div>
              <div className="text-sm text-slate-500 mt-1">Actual Monthly Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(snapshot.msc_current)}</div>
              <div className="text-sm text-slate-500 mt-1">MSC Commitment</div>
            </div>
          </div>
        </div>

        {/* Competitive Position */}
        {competitorIntel && competitorIntel.competitive_positions.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Market Position by Product</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200">
                    <th className="pb-2 text-slate-500 font-medium">Product</th>
                    <th className="pb-2 text-slate-500 font-medium">CircleTel Price</th>
                    <th className="pb-2 text-slate-500 font-medium">Avg Competitor</th>
                    <th className="pb-2 text-slate-500 font-medium">Position</th>
                    <th className="pb-2 text-slate-500 font-medium">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorIntel.competitive_positions.map((pos, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-700">{pos.product_name}</td>
                      <td className="py-2">{formatCurrency(pos.circletel_price)}</td>
                      <td className="py-2">{formatCurrency(pos.avg_competitor_price)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          pos.position === 'below' ? 'bg-green-100 text-green-700' :
                          pos.position === 'competitive' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pos.position}
                        </span>
                      </td>
                      <td className="py-2 text-slate-600">{pos.gap_pct > 0 ? '+' : ''}{pos.gap_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
