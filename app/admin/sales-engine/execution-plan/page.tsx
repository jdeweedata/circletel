'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import {
  PiTargetBold,
  PiTrendUpBold,
  PiWarningCircleBold,
  PiUsersBold,
  PiArrowLeftBold,
  PiArrowClockwiseBold,
  PiWalletBold,
  PiRocketBold,
  PiChartBarBold,
  PiCurrencyDollarBold,
  PiLightningBold,
} from 'react-icons/pi';
import type { ExecutionSnapshot, CompetitorIntelligenceSummary } from '@/lib/sales-engine/types';
import type { CapitalSnapshot } from '@/lib/sales-engine/capital-tracker-service';
import type { CashFlowProjectionResult } from '@/lib/sales-engine/cash-flow-projection-service';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'arlan', label: 'Arlan Track' },
  { id: 'tarana', label: 'Tarana Track' },
  { id: 'capital', label: 'Capital & Cash Flow' },
] as const;

const ARLAN_USE_CASE_ORDER = [
  'IoT/M2M', 'Fleet Management', 'Venue WiFi',
  'Data Connectivity', 'Backup Connectivity', 'Mobile Workforce',
  'Voice Comms', 'Device Upgrade',
];

export default function ExecutionPlanDashboard() {
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot | null>(null);
  const [competitorIntel, setCompetitorIntel] = useState<CompetitorIntelligenceSummary | null>(null);
  const [capitalSnapshot, setCapitalSnapshot] = useState<CapitalSnapshot | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowProjectionResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [epRes, ciRes, ctRes, cfRes] = await Promise.allSettled([
        fetch('/api/admin/sales-engine/execution-plan'),
        fetch('/api/admin/sales-engine/competitor-intelligence'),
        fetch('/api/admin/sales-engine/capital-tracker'),
        fetch('/api/admin/sales-engine/cash-flow?months=12'),
      ]);

      if (epRes.status === 'fulfilled' && epRes.value.ok) {
        const json = await epRes.value.json();
        if (json.success && json.data) setSnapshot(json.data);
      }
      if (ciRes.status === 'fulfilled' && ciRes.value.ok) {
        const json = await ciRes.value.json();
        if (json.success && json.data) setCompetitorIntel(json.data);
      }
      if (ctRes.status === 'fulfilled' && ctRes.value.ok) {
        const json = await ctRes.value.json();
        if (json.success && json.snapshot) setCapitalSnapshot(json.snapshot);
      }
      if (cfRes.status === 'fulfilled' && cfRes.value.ok) {
        const json = await cfRes.value.json();
        if (json.success) setCashFlow({ projections: json.projections, summary: json.summary });
      }
    } catch (error) {
      console.error('Failed to fetch execution data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => `R${Number(value).toLocaleString()}`;
  const formatCurrencyK = (value: number) => `R${(value / 1000).toFixed(0)}K`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 space-y-6">
        <div className="bg-white border-b border-slate-200 px-6 py-4 -m-6 mb-0">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-8 w-28 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="h-64 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-slate-500">No execution plan data available.</p>
          <p className="text-sm text-slate-400">Apply the execution_milestones migration first.</p>
        </div>
      </div>
    );
  }

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

  const arlanMrr = snapshot.arlan_mrr ?? null;
  const mscColor = snapshot.msc_coverage_ratio >= 1.5 ? '#10B981' :
                   snapshot.msc_coverage_ratio >= 1.0 ? '#F59E0B' : '#EF4444';
  const mscLabel = snapshot.msc_coverage_ratio >= 1.5 ? 'Safe' :
                   snapshot.msc_coverage_ratio >= 1.0 ? 'Warning' : 'Critical';
  const mscIconBg = snapshot.msc_coverage_ratio >= 1.5 ? 'bg-emerald-100' :
                    snapshot.msc_coverage_ratio >= 1.0 ? 'bg-amber-100' : 'bg-red-100';
  const mscIconColor = snapshot.msc_coverage_ratio >= 1.5 ? 'text-emerald-600' :
                       snapshot.msc_coverage_ratio >= 1.0 ? 'text-amber-600' : 'text-red-600';

  // Sort Arlan use cases by priority order
  const sortedUseCases = arlanMrr
    ? Object.entries(arlanMrr.deals_by_use_case).sort((a, b) => {
        const aIdx = ARLAN_USE_CASE_ORDER.indexOf(a[0]);
        const bIdx = ARLAN_USE_CASE_ORDER.indexOf(b[0]);
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/sales-engine" className="text-slate-400 hover:text-slate-600">
              <PiArrowLeftBold className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Execution Dashboard</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              snapshot.current_phase === 'bootstrap' ? 'bg-blue-100 text-blue-700' :
              snapshot.current_phase === 'scale' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {snapshot.current_phase.toUpperCase()} Phase
            </span>
            <span className="text-sm text-slate-500">Month {snapshot.current_month} of 12</span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <PiArrowClockwiseBold className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <p className="text-slate-500 text-sm mt-1">Dual-track execution: Arlan cash machine + Tarana MSC coverage</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total MRR"
            value={formatCurrency(snapshot.total_mrr)}
            icon={<PiTrendUpBold className="w-5 h-5" />}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            subtitle={`${snapshot.mrr_attainment_pct}% of ${formatCurrency(snapshot.target_mrr)}`}
          />
          <StatCard
            label="MSC Coverage"
            value={`${snapshot.msc_coverage_ratio.toFixed(1)}x`}
            icon={<PiWarningCircleBold className="w-5 h-5" />}
            iconBgColor={mscIconBg}
            iconColor={mscIconColor}
            subtitle={mscLabel}
          />
          <StatCard
            label="Capital Remaining"
            value={capitalSnapshot ? formatCurrency(capitalSnapshot.current_balance) : '—'}
            icon={<PiWalletBold className="w-5 h-5" />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            subtitle={capitalSnapshot ? `${capitalSnapshot.months_of_runway.toFixed(1)} months runway` : 'Loading...'}
          />
          <StatCard
            label="Current Phase"
            value={snapshot.current_phase.charAt(0).toUpperCase() + snapshot.current_phase.slice(1)}
            icon={<PiRocketBold className="w-5 h-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            subtitle={`Month ${snapshot.current_month} of 12`}
          />
        </div>

        {/* Tabs */}
        <UnderlineTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ============================================================= */}
        {/* OVERVIEW TAB */}
        {/* ============================================================= */}
        <TabPanel id="overview" activeTab={activeTab} className="space-y-6">
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

          {/* MRR vs Target Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">MRR: Plan vs Actual</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshot.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} stroke="#94A3B8" fontSize={12} />
                  <YAxis tickFormatter={(v) => formatCurrencyK(v)} stroke="#94A3B8" fontSize={12} />
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
            </div>
          </div>

          {/* MSC Coverage Gauge */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">MTN Minimum Spend Commitment Coverage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: mscColor }}>
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
        </TabPanel>

        {/* ============================================================= */}
        {/* ARLAN TRACK TAB */}
        {/* ============================================================= */}
        <TabPanel id="arlan" activeTab={activeTab} className="space-y-6">
          {!arlanMrr ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-slate-500">No Arlan MRR data available yet.</p>
              <p className="text-sm text-slate-400 mt-1">Arlan deal data will appear once curated deals are synced.</p>
            </div>
          ) : (
            <>
              {/* Commission vs Markup Split */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Commission MRR"
                  value={formatCurrency(arlanMrr.commission_mrr)}
                  icon={<PiCurrencyDollarBold className="w-5 h-5" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                  subtitle="Paid by Arlan (month+1)"
                />
                <StatCard
                  label="Markup MRR"
                  value={formatCurrency(arlanMrr.markup_mrr)}
                  icon={<PiTrendUpBold className="w-5 h-5" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  subtitle="100% to CircleTel"
                />
                <StatCard
                  label="Total Arlan MRR"
                  value={formatCurrency(arlanMrr.total_arlan_mrr)}
                  icon={<PiChartBarBold className="w-5 h-5" />}
                  iconBgColor="bg-orange-100"
                  iconColor="text-orange-600"
                  subtitle={`${arlanMrr.curated_deals_count} curated deals`}
                />
              </div>

              {/* Revenue Per Deal Summary */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Average Revenue Per Deal</h3>
                <div className="flex items-center gap-3 text-lg">
                  <span className="text-blue-600 font-semibold">{formatCurrency(arlanMrr.avg_monthly_commission_per_deal)}</span>
                  <span className="text-slate-400">commission</span>
                  <span className="text-slate-300">+</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(arlanMrr.avg_monthly_markup_per_deal)}</span>
                  <span className="text-slate-400">markup</span>
                  <span className="text-slate-300">=</span>
                  <span className="text-orange-600 font-bold">{formatCurrency(arlanMrr.avg_total_revenue_per_deal)}</span>
                  <span className="text-slate-400">/deal/mo</span>
                </div>
              </div>

              {/* Deals by Use Case Table */}
              <SectionCard title="Deals by Use Case" icon={PiTargetBold} compact>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-200">
                        <th className="pb-2 text-slate-500 font-medium">Use Case</th>
                        <th className="pb-2 text-slate-500 font-medium text-right">Deals</th>
                        <th className="pb-2 text-slate-500 font-medium text-right">Avg Price</th>
                        <th className="pb-2 text-slate-500 font-medium text-right">Avg Markup</th>
                        <th className="pb-2 text-slate-500 font-medium text-right">Est. Monthly Rev</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUseCases.map(([useCase, data]) => (
                        <tr key={useCase} className="border-b border-slate-50">
                          <td className="py-2 font-medium text-slate-700">{useCase}</td>
                          <td className="py-2 text-right text-slate-600">{data.count}</td>
                          <td className="py-2 text-right text-slate-600">{formatCurrency(data.avg_price)}</td>
                          <td className="py-2 text-right text-slate-600">{data.avg_markup.toFixed(0)}%</td>
                          <td className="py-2 text-right font-medium text-slate-900">
                            {formatCurrency(data.count * arlanMrr.avg_total_revenue_per_deal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {/* Deals Ramp Chart */}
              {cashFlow && (
                <SectionCard title="Arlan Deals Ramp: Target vs Actual" icon={PiChartBarBold} compact>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashFlow.projections.map(p => ({
                        month: p.month_label,
                        target: p.arlan_deals_cumulative,
                        actual: capitalSnapshot ? (p.month === 1 ? capitalSnapshot.channel_mrr.arlan.deals : null) : null,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} angle={-45} textAnchor="end" height={50} />
                        <YAxis stroke="#94A3B8" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="target" name="Target Deals" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="actual" name="Actual Deals" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              )}

              {/* Quick Projections */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">10 Deals</div>
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(arlanMrr.projected_mrr_10_deals)}</div>
                  <div className="text-xs text-slate-400">/month</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">50 Deals</div>
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(arlanMrr.projected_mrr_50_deals)}</div>
                  <div className="text-xs text-slate-400">/month</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">100 Deals</div>
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(arlanMrr.avg_total_revenue_per_deal * 100)}</div>
                  <div className="text-xs text-slate-400">/month</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">700 Deals (M5 Target)</div>
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(arlanMrr.avg_total_revenue_per_deal * 700)}</div>
                  <div className="text-xs text-slate-400">/month</div>
                </div>
              </div>
            </>
          )}
        </TabPanel>

        {/* ============================================================= */}
        {/* TARANA TRACK TAB */}
        {/* ============================================================= */}
        <TabPanel id="tarana" activeTab={activeTab} className="space-y-6">
          {/* Install Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Tarana Customers"
              value={String(capitalSnapshot?.channel_mrr.tarana.deals ?? 0)}
              icon={<PiUsersBold className="w-5 h-5" />}
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
              subtitle={capitalSnapshot?.channel_mrr.tarana.mrr ? `${formatCurrency(capitalSnapshot.channel_mrr.tarana.mrr)} MRR` : 'No customers yet'}
            />
            <StatCard
              label="Target This Month"
              value={String(capitalSnapshot?.current_milestone?.target_tarana_customers ?? '—')}
              icon={<PiTargetBold className="w-5 h-5" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              subtitle={capitalSnapshot?.current_milestone ? `Month ${capitalSnapshot.current_milestone.month}` : ''}
            />
            <StatCard
              label="Install Capacity"
              value="1-2 / week"
              icon={<PiLightningBold className="w-5 h-5" />}
              iconBgColor="bg-amber-100"
              iconColor="text-amber-600"
              subtitle="Limited — hire installer at R200K MRR"
            />
          </div>

          {/* MSC Coverage Detail */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">MSC Coverage Detail</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(capitalSnapshot?.msc_current ?? snapshot.msc_current)}
                </div>
                <div className="text-sm text-slate-500 mt-1">MSC Commitment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(capitalSnapshot?.tarana_wholesale_spend ?? 0)}
                </div>
                <div className="text-sm text-slate-500 mt-1">Tarana Wholesale Spend</div>
              </div>
              <div className="text-center">
                {(() => {
                  const msc = capitalSnapshot?.msc_current ?? snapshot.msc_current;
                  const spend = capitalSnapshot?.tarana_wholesale_spend ?? 0;
                  const gap = spend - msc;
                  return (
                    <>
                      <div className={`text-2xl font-bold ${gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gap >= 0 ? '+' : ''}{formatCurrency(gap)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {gap >= 0 ? 'Surplus' : 'Shortfall'} / month
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Customer Growth Chart */}
          {cashFlow && (
            <SectionCard title="Tarana Customer Growth: Target Trajectory" icon={PiTrendUpBold} compact>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlow.projections.map(p => ({
                    month: p.month_label,
                    target: p.tarana_customers_cumulative,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} angle={-45} textAnchor="end" height={50} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip />
                    <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="5 5" label={{ value: "MSC Break-even (100)", fill: "#EF4444", fontSize: 11 }} />
                    <ReferenceLine y={310} stroke="#10B981" strokeDasharray="5 5" label={{ value: "M12 Target (310)", fill: "#10B981", fontSize: 11 }} />
                    <Area type="monotone" dataKey="target" name="Target Customers" stroke="#F5831F" fill="#FEF3E2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          )}

          {/* MSC Coverage Ratio Over Time */}
          {cashFlow && (
            <SectionCard title="MSC Coverage Ratio Over Time" icon={PiWarningCircleBold} compact>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlow.projections.map(p => ({
                    month: p.month_label,
                    ratio: p.msc_coverage_ratio,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} angle={-45} textAnchor="end" height={50} />
                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 'auto']} tickFormatter={(v) => `${v.toFixed(1)}x`} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}x`} />
                    <ReferenceLine y={1.0} stroke="#EF4444" strokeDasharray="5 5" label={{ value: "Break-even (1.0x)", fill: "#EF4444", fontSize: 11 }} />
                    <ReferenceLine y={1.5} stroke="#10B981" strokeDasharray="5 5" label={{ value: "Safe (1.5x)", fill: "#10B981", fontSize: 11 }} />
                    <Line type="monotone" dataKey="ratio" name="Coverage Ratio" stroke="#F5831F" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          )}
        </TabPanel>

        {/* ============================================================= */}
        {/* CAPITAL & CASH FLOW TAB */}
        {/* ============================================================= */}
        <TabPanel id="capital" activeTab={activeTab} className="space-y-6">
          {!capitalSnapshot && !cashFlow ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-slate-500">Capital and cash flow data unavailable.</p>
            </div>
          ) : (
            <>
              {/* Runway Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Capital Remaining"
                  value={capitalSnapshot ? formatCurrency(capitalSnapshot.current_balance) : '—'}
                  icon={<PiWalletBold className="w-5 h-5" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                />
                <StatCard
                  label="Avg Monthly Burn"
                  value={capitalSnapshot ? formatCurrency(capitalSnapshot.avg_monthly_burn) : '—'}
                  icon={<PiTrendUpBold className="w-5 h-5" />}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                />
                <StatCard
                  label="Runway"
                  value={capitalSnapshot ? `${capitalSnapshot.months_of_runway.toFixed(1)} months` : '—'}
                  icon={<PiRocketBold className="w-5 h-5" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                />
                <StatCard
                  label="Self-Funding Month"
                  value={cashFlow ? `Month ${cashFlow.summary.self_funding_month}` : '—'}
                  icon={<PiTargetBold className="w-5 h-5" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  subtitle={cashFlow ? `Break-even: M${cashFlow.summary.breakeven_month}` : ''}
                />
              </div>

              {/* Cash Flow Chart */}
              {cashFlow && (
                <SectionCard title="12-Month Cash Flow Projection" icon={PiCurrencyDollarBold} compact>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlow.projections.map(p => ({
                        month: p.month_label,
                        balance: p.cumulative_cash,
                        inflow: p.total_inflow,
                        outflow: -p.total_outflow,
                      }))}>
                        <defs>
                          <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} angle={-45} textAnchor="end" height={50} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => formatCurrencyK(v)} />
                        <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                        <Legend />
                        <ReferenceLine y={0} stroke="#EF4444" strokeWidth={2} />
                        {cashFlow.summary.self_funding_month > 0 && (
                          <ReferenceLine
                            x={cashFlow.projections[cashFlow.summary.self_funding_month - 1]?.month_label}
                            stroke="#10B981"
                            strokeDasharray="5 5"
                            label={{ value: "Self-funding", fill: "#10B981", fontSize: 11 }}
                          />
                        )}
                        <Area type="monotone" dataKey="balance" name="Cumulative Cash" stroke="#10B981" fill="url(#cashGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              )}

              {/* Spend by Category */}
              {capitalSnapshot && Object.keys(capitalSnapshot.spend_by_category).length > 0 && (
                <SectionCard title="Capital Spend by Category" icon={PiChartBarBold} compact>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(capitalSnapshot.spend_by_category)
                          .sort(([, a], [, b]) => b - a)
                          .map(([category, amount]) => ({
                            category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            amount,
                          }))}
                        layout="vertical"
                        margin={{ left: 120 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" tickFormatter={(v) => formatCurrencyK(v)} stroke="#94A3B8" fontSize={12} />
                        <YAxis type="category" dataKey="category" stroke="#94A3B8" fontSize={12} width={110} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="amount" fill="#F5831F" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              )}

              {/* Monthly Cash Flow Table */}
              {cashFlow && (
                <SectionCard title="Monthly Cash Flow Breakdown" icon={PiCurrencyDollarBold} compact>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-left border-b border-slate-200">
                          <th className="pb-2 text-slate-500 font-medium">Month</th>
                          <th className="pb-2 text-slate-500 font-medium text-right">Inflow</th>
                          <th className="pb-2 text-slate-500 font-medium text-right">Outflow</th>
                          <th className="pb-2 text-slate-500 font-medium text-right">Net</th>
                          <th className="pb-2 text-slate-500 font-medium text-right">Cumulative</th>
                          <th className="pb-2 text-slate-500 font-medium text-right">MSC Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashFlow.projections.map((p) => (
                          <tr key={p.month} className={`border-b border-slate-50 ${p.net_cash_flow < 0 ? 'bg-red-50/50' : ''}`}>
                            <td className="py-2 font-medium text-slate-700">{p.month_label}</td>
                            <td className="py-2 text-right text-green-600">{formatCurrency(p.total_inflow)}</td>
                            <td className="py-2 text-right text-red-600">{formatCurrency(p.total_outflow)}</td>
                            <td className={`py-2 text-right font-medium ${p.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {p.net_cash_flow >= 0 ? '+' : ''}{formatCurrency(p.net_cash_flow)}
                            </td>
                            <td className={`py-2 text-right font-medium ${p.cumulative_cash >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                              {formatCurrency(p.cumulative_cash)}
                            </td>
                            <td className="py-2 text-right">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                p.msc_coverage_ratio >= 1.5 ? 'bg-green-100 text-green-700' :
                                p.msc_coverage_ratio >= 1.0 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {p.msc_coverage_ratio.toFixed(1)}x
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              {/* 12-Month Summary */}
              {cashFlow && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-medium text-slate-500 mb-3">12-Month Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(cashFlow.summary.total_12mo_inflow)}</div>
                      <div className="text-sm text-slate-500">Total Inflow</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">{formatCurrency(cashFlow.summary.total_12mo_outflow)}</div>
                      <div className="text-sm text-slate-500">Total Outflow</div>
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${cashFlow.summary.net_12mo_cash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(cashFlow.summary.net_12mo_cash)}
                      </div>
                      <div className="text-sm text-slate-500">Net 12-Month</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900">{formatCurrency(cashFlow.summary.peak_capital_needed)}</div>
                      <div className="text-sm text-slate-500">Peak Capital Needed</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </TabPanel>
      </div>
    </div>
  );
}
