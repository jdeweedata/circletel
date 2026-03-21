'use client';

import { PiChartBarBold, PiMapPinBold, PiTargetBold, PiTrendUpBold, PiUsersBold, PiWarningCircleBold, PiWifiBold } from 'react-icons/pi';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { StatCard } from '@/components/admin/shared/StatCard';
import type { SalesZone, ZoneMetric, MSCPeriod, PipelineStageSummary } from '@/lib/sales-engine/types';
import type { CoverageGapAnalysis } from '@/lib/sales-engine/types';
import { PIPELINE_STAGE_ORDER, PIPELINE_STAGE_LABELS } from '@/lib/sales-engine/types';

interface ScorecardData {
  zones: Array<SalesZone & { metrics: ZoneMetric | null }>;
  msc_periods: MSCPeriod[];
  summary: {
    total_zones: number;
    active_zones: number;
    total_leads_scored: number;
    avg_lead_score: number;
    pipeline_open: number;
    pipeline_won: number;
    pipeline_lost: number;
    total_pipeline_mrr: number;
    overall_penetration_rate: number;
    total_active_rns: number;
  };
  pipeline_summary: PipelineStageSummary[];
  coverage_analysis: CoverageGapAnalysis | null;
}

export default function SalesEngineDashboard() {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const [scorecardRes, pipelineRes, mscRes, zonesRes, coverageAnalysisRes] = await Promise.all([
        fetch('/api/admin/sales-engine/scorecard'),
        fetch('/api/admin/sales-engine/pipeline?limit=0'),
        fetch('/api/admin/sales-engine/msc'),
        fetch('/api/admin/sales-engine/zones'),
        fetch('/api/admin/sales-engine/coverage-analysis'),
      ]);

      const [scorecardJson, pipelineJson, mscJson, zonesJson, coverageAnalysisJson] = await Promise.all([
        scorecardRes.json(),
        pipelineRes.json(),
        mscRes.json(),
        zonesRes.json(),
        coverageAnalysisRes.json(),
      ]);

      // Build pipeline summary from stage counts
      const pipelineEntries = Array.isArray(pipelineJson.data) ? pipelineJson.data : [];
      const stageCounts: Record<string, { count: number; total_mrr: number }> = {};
      for (const stage of PIPELINE_STAGE_ORDER) {
        stageCounts[stage] = { count: 0, total_mrr: 0 };
      }
      for (const entry of pipelineEntries) {
        if (stageCounts[entry.stage]) {
          stageCounts[entry.stage].count++;
          stageCounts[entry.stage].total_mrr += Number(entry.quote_mrr) || 0;
        }
      }
      const pipelineSummary: PipelineStageSummary[] = PIPELINE_STAGE_ORDER.map((stage) => ({
        stage,
        label: PIPELINE_STAGE_LABELS[stage],
        count: stageCounts[stage].count,
        total_mrr: stageCounts[stage].total_mrr,
      }));

      const zones = Array.isArray(zonesJson.data) ? zonesJson.data : [];
      const scorecardZones = Array.isArray(scorecardJson.data) ? scorecardJson.data : [];
      const mscPeriods = Array.isArray(mscJson.data) ? mscJson.data : [];

      // Compute summary from available data
      const activeZones = zones.filter((z: SalesZone) => z.status === 'active');
      const totalPipelineMRR = pipelineEntries
        .filter((e: { outcome: string }) => e.outcome === 'open' || e.outcome === 'won')
        .reduce((sum: number, e: { quote_mrr: number | null }) => sum + (Number(e.quote_mrr) || 0), 0);

      setData({
        zones: zones.map((z: SalesZone) => ({
          ...z,
          metrics: scorecardZones.find((m: { zone_id: string }) => m.zone_id === z.id) || null,
        })),
        msc_periods: mscPeriods,
        summary: {
          total_zones: zones.length,
          active_zones: activeZones.length,
          total_leads_scored: 0,
          avg_lead_score: 0,
          pipeline_open: pipelineEntries.filter((e: { outcome: string }) => e.outcome === 'open').length,
          pipeline_won: pipelineEntries.filter((e: { outcome: string }) => e.outcome === 'won').length,
          pipeline_lost: pipelineEntries.filter((e: { outcome: string }) => e.outcome === 'lost').length,
          total_pipeline_mrr: totalPipelineMRR,
          overall_penetration_rate: activeZones.length > 0
            ? activeZones.reduce((sum: number, z: SalesZone) => sum + Number(z.penetration_rate), 0) / activeZones.length
            : 0,
          total_active_rns: activeZones.reduce((sum: number, z: SalesZone) => sum + (z.active_customers || 0), 0),
        },
        pipeline_summary: pipelineSummary,
        coverage_analysis: coverageAnalysisJson.data ?? null,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
      </div>
    );
  }

  const currentMSC = data?.msc_periods?.find((p) => {
    const now = new Date();
    return new Date(p.period_start) <= now && now <= new Date(p.period_end);
  }) || data?.msc_periods?.[0];

  const mscProgress = currentMSC
    ? Math.min((currentMSC.actual_rns / currentMSC.required_rns) * 100, 100)
    : 0;

  const mscStatusColor = currentMSC?.status === 'met'
    ? 'bg-green-500'
    : currentMSC?.status === 'at_risk'
      ? 'bg-amber-500'
      : currentMSC?.status === 'missed'
        ? 'bg-red-500'
        : 'bg-blue-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Engine</h1>
          <p className="text-gray-500 mt-1">Data-driven territory intelligence & pipeline management</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/sales-engine/map"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PiMapPinBold className="h-4 w-4" />
            Heat Map
          </Link>
          <Link
            href="/admin/sales-engine/zones"
            className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg text-sm font-medium hover:bg-circleTel-orange/90"
          >
            <PiTargetBold className="h-4 w-4" />
            Manage Zones
          </Link>
        </div>
      </div>

      {/* MSC Tracker */}
      {currentMSC && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                MTN MSC Tracker — {currentMSC.period_label}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                R{Number(currentMSC.msc_amount).toLocaleString()} minimum spend commitment
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${mscStatusColor}`}>
              {currentMSC.status.replace('_', ' ').toUpperCase()}
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
              <span className="text-2xl font-bold text-gray-900">{currentMSC.actual_rns}</span>
              <span className="text-gray-400 text-sm"> / {currentMSC.required_rns} RNs</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Active Zones"
          value={data?.summary.active_zones ?? 0}
          icon={<PiTargetBold className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={`${data?.summary.total_zones ?? 0} total zones`}
          href="/admin/sales-engine/zones"
        />
        <StatCard
          label="Pipeline MRR"
          value={`R${(data?.summary.total_pipeline_mrr ?? 0).toLocaleString()}`}
          icon={<PiTrendUpBold className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={`${data?.summary.pipeline_open ?? 0} open deals`}
          href="/admin/sales-engine/pipeline"
        />
        <StatCard
          label="Avg Penetration"
          value={`${(data?.summary.overall_penetration_rate ?? 0).toFixed(1)}%`}
          icon={<PiUsersBold className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle="Target: 40%+ in primary zones"
        />
        <StatCard
          label="Active RNs"
          value={data?.summary.total_active_rns ?? 0}
          icon={<PiChartBarBold className="h-5 w-5" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          subtitle={currentMSC ? `Target: ${currentMSC.required_rns} RNs` : undefined}
        />
      </div>

      {/* Coverage Intelligence */}
      {data?.coverage_analysis && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <PiWifiBold className="h-4 w-4" />
            Coverage Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="High Coverage Zones"
              value={data.coverage_analysis.coverage_summary.high}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              label="Coverage Gaps"
              value={data.coverage_analysis.coverage_summary.none + data.coverage_analysis.coverage_summary.low}
              iconBgColor="bg-red-100"
              iconColor="text-red-600"
            />
            <StatCard
              label="Investment Needed"
              value={data.coverage_analysis.investment_needed.length}
              subtitle="Zones with leads but poor coverage"
              iconBgColor="bg-amber-100"
              iconColor="text-amber-600"
            />
            <StatCard
              label="Untapped Opportunity"
              value={data.coverage_analysis.untapped_opportunity.length}
              subtitle="Good coverage, few leads"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
          </div>

          {/* Gap Analysis Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.coverage_analysis.investment_needed.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-red-600 mb-3">Coverage Investment Needed</h3>
                <div className="space-y-2">
                  {data.coverage_analysis.investment_needed.slice(0, 5).map((item) => (
                    <div key={item.zone.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{item.zone.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{item.lead_count} leads</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          item.coverage_confidence === 'none' ? 'bg-red-100 text-red-700' :
                          item.coverage_confidence === 'low' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {item.coverage_confidence ?? 'not enriched'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.coverage_analysis.untapped_opportunity.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-blue-600 mb-3">Untapped Opportunity</h3>
                <div className="space-y-2">
                  {data.coverage_analysis.untapped_opportunity.slice(0, 5).map((item) => (
                    <div key={item.zone.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{item.zone.name}</span>
                      <span className="text-gray-500">{item.base_station_count} BS / {item.dfa_count} DFA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Funnel + Zone Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Pipeline Funnel
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.pipeline_summary ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="label" type="category" width={130} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value, 'Deals']}
              />
              <Bar dataKey="count" fill="#F5831F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Performance Table */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Zone Scorecard
            </h3>
            <Link href="/admin/sales-engine/zones" className="text-sm text-circleTel-orange hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Zone</th>
                  <th className="pb-2 font-medium text-right">Score</th>
                  <th className="pb-2 font-medium text-right">Penetration</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.zones ?? []).slice(0, 8).map((zone) => (
                  <tr key={zone.id} className="border-b border-gray-50">
                    <td className="py-2.5">
                      <Link href={`/admin/sales-engine/zones`} className="text-gray-900 hover:text-circleTel-orange font-medium">
                        {zone.name}
                      </Link>
                      <p className="text-xs text-gray-400">{zone.zone_type.replace('_', ' ')}</p>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        Number(zone.zone_score) >= 70 ? 'bg-green-100 text-green-700' :
                        Number(zone.zone_score) >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {Number(zone.zone_score).toFixed(0)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-700">
                      {Number(zone.penetration_rate).toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-medium ${
                        zone.status === 'active' ? 'text-green-600' :
                        zone.status === 'parked' ? 'text-gray-400' :
                        'text-blue-600'
                      }`}>
                        {zone.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.zones || data.zones.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No zones created yet.{' '}
                      <Link href="/admin/sales-engine/zones" className="text-circleTel-orange hover:underline">
                        Create your first zone
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Zones', href: '/admin/sales-engine/zones', icon: PiTargetBold, desc: 'Manage sales territories', color: 'blue' },
          { name: 'Lead Scoring', href: '/admin/sales-engine/leads', icon: PiChartBarBold, desc: 'Score & prioritize leads', color: 'green' },
          { name: 'Pipeline', href: '/admin/sales-engine/pipeline', icon: PiTrendUpBold, desc: '7-day close cycle', color: 'purple' },
          { name: 'Heat Map', href: '/admin/sales-engine/map', icon: PiMapPinBold, desc: 'Geographic visualization', color: 'amber' },
        ].map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-circleTel-orange/30 transition-all"
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-${item.color}-100 text-${item.color}-600 mb-3`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="font-semibold text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
