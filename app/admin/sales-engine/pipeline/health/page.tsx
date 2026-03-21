'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PiTrendUpBold,
  PiClockBold,
  PiWarningCircleBold,
  PiTargetBold,
  PiArrowLeftBold,
  PiFunnelBold,
} from 'react-icons/pi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '@/components/admin/shared/StatCard';

interface StageVelocity {
  stage: string;
  label: string;
  avg_days: number;
  deal_count: number;
}

interface AgingDeal {
  id: string;
  company_name: string | null;
  address: string;
  stage: string;
  stage_label: string;
  days_in_stage: number;
  quote_mrr: number | null;
  contact_method: string | null;
}

interface FunnelStep {
  stage: string;
  label: string;
  entered: number;
  converted: number;
  conversion_rate: number;
}

interface PipelineHealthData {
  weighted_pipeline_mrr: number;
  total_open_mrr: number;
  msc_gap: number;
  avg_deal_cycle_days: number;
  bottleneck_stage: string;
  bottleneck_avg_days: number;
  stage_velocity: StageVelocity[];
  aging_deals: AgingDeal[];
  funnel: FunnelStep[];
  summary: {
    open_deals: number;
    won_this_period: number;
    weighted_mrr: number;
    projected_rns: number;
  };
}

export default function PipelineHealthPage() {
  const [data, setData] = useState<PipelineHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/sales-engine/pipeline/health');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load pipeline health');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/sales-engine/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <PiArrowLeftBold className="h-4 w-4" />
          Back to Pipeline
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const activeVelocity = data.stage_velocity.filter((s) => s.deal_count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/sales-engine/pipeline"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <PiArrowLeftBold className="h-4 w-4" />
            Back to Pipeline
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline Health & Forecast</h1>
          <p className="text-gray-500 mt-1">Will we hit MSC targets?</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Weighted Pipeline"
          value={`R${data.weighted_pipeline_mrr.toLocaleString()}`}
          icon={<PiTrendUpBold className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={`R${data.total_open_mrr.toLocaleString()} total open MRR`}
        />
        <StatCard
          label="MSC Gap"
          value={`${data.msc_gap} RNs`}
          icon={<PiTargetBold className="h-5 w-5" />}
          iconBgColor={data.msc_gap > 0 ? 'bg-red-100' : 'bg-green-100'}
          iconColor={data.msc_gap > 0 ? 'text-red-600' : 'text-green-600'}
          subtitle={data.msc_gap > 0 ? 'Below target' : 'On track'}
        />
        <StatCard
          label="Avg Deal Cycle"
          value={`${data.avg_deal_cycle_days} days`}
          icon={<PiClockBold className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={`${data.summary.won_this_period} won deals`}
        />
        <StatCard
          label="Bottleneck"
          value={data.bottleneck_stage}
          icon={<PiWarningCircleBold className="h-5 w-5" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          subtitle={`${data.bottleneck_avg_days} days avg`}
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PiFunnelBold className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Conversion Funnel
          </h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.funnel}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  return [value, name === 'entered' ? 'Deals Entered' : name];
                }}
                labelFormatter={(label: string) => {
                  const step = data.funnel.find((f) => f.label === label);
                  return step
                    ? `${label} (${step.conversion_rate}% conversion)`
                    : label;
                }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Bar
                dataKey="entered"
                fill="#F5831F"
                radius={[0, 4, 4, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Velocity */}
      {activeVelocity.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Stage Velocity
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Stage
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Avg Days
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Deals
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeVelocity.map((sv) => (
                  <tr
                    key={sv.stage}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {sv.label}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span
                        className={
                          sv.avg_days > 14
                            ? 'text-red-600 font-semibold'
                            : sv.avg_days > 7
                              ? 'text-amber-600 font-medium'
                              : 'text-gray-700'
                        }
                      >
                        {sv.avg_days}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {sv.deal_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aging Deals */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Aging Deals (&gt;14 days in stage)
        </h3>
        {data.aging_deals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">
              No aging deals - pipeline is healthy!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Company / Address
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Stage
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Days in Stage
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    MRR
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.aging_deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
                        {deal.company_name || deal.address}
                      </p>
                      {deal.company_name && (
                        <p className="text-xs text-gray-400 truncate max-w-[250px]">
                          {deal.address}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {deal.stage_label}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span
                        className={
                          deal.days_in_stage > 21
                            ? 'text-red-600 font-semibold'
                            : 'text-amber-600 font-medium'
                        }
                      >
                        {deal.days_in_stage}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {deal.quote_mrr
                        ? `R${Number(deal.quote_mrr).toLocaleString()}`
                        : '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {deal.contact_method || '\u2014'}
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
