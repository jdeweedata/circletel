'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PiWarningCircleBold,
  PiTrendDownBold,
  PiShieldCheckBold,
  PiArrowLeftBold,
  PiTargetBold,
} from 'react-icons/pi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatCard } from '@/components/admin/shared/StatCard';

interface LossData {
  loss_by_competitor: { competitor: string; count: number }[];
  loss_by_reason: { reason: string; count: number }[];
  loss_by_stage: { stage: string; label: string; count: number }[];
  loss_by_zone: {
    zone_id: string;
    zone_name: string;
    lost: number;
    won: number;
    win_rate: number;
  }[];
  objection_patterns: { category: string; count: number }[];
  win_loss_ratio: { won: number; lost: number; ratio: number; win_rate: number };
  total_lost_deals: number;
  total_lost_mrr: number;
}

const PIE_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

export default function LossAnalysisPage() {
  const [data, setData] = useState<LossData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/sales-engine/pipeline/loss-analysis');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch loss analysis:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
      </div>
    );
  }

  if (!data || data.total_lost_deals === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sales-engine/pipeline"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <PiArrowLeftBold className="h-4 w-4" />
            Back to Pipeline
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <PiShieldCheckBold className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No lost deals recorded yet</h2>
          <p className="text-sm text-gray-500 max-w-md">
            When pipeline deals are marked as lost, competitive analysis data will appear here.
          </p>
        </div>
      </div>
    );
  }

  const topCompetitor = data.loss_by_competitor[0]?.competitor || 'None';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/admin/sales-engine/pipeline"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <PiArrowLeftBold className="h-4 w-4" />
              Back to Pipeline
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Competitive Loss Analysis</h1>
          <p className="text-gray-500 mt-1">Why are we losing deals? To whom?</p>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Lost"
          value={data.total_lost_deals}
          icon={<PiWarningCircleBold className="h-5 w-5" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          label="Lost MRR"
          value={`R${data.total_lost_mrr.toLocaleString()}`}
          icon={<PiTrendDownBold className="h-5 w-5" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          label="Win Rate"
          value={`${data.win_loss_ratio.win_rate}%`}
          icon={<PiShieldCheckBold className="h-5 w-5" />}
          iconBgColor={data.win_loss_ratio.win_rate >= 50 ? 'bg-green-100' : 'bg-amber-100'}
          iconColor={data.win_loss_ratio.win_rate >= 50 ? 'text-green-600' : 'text-amber-600'}
          subtitle={`${data.win_loss_ratio.won}W / ${data.win_loss_ratio.lost}L`}
        />
        <StatCard
          label="Top Competitor"
          value={topCompetitor}
          icon={<PiTargetBold className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle={
            data.loss_by_competitor[0]
              ? `${data.loss_by_competitor[0].count} deals lost`
              : undefined
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loss Reasons - Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Loss Reasons
          </h3>
          {data.loss_by_reason.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.loss_by_reason}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="reason"
                  paddingAngle={2}
                >
                  {data.loss_by_reason.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No reason data</p>
          )}
        </div>

        {/* Loss by Stage - Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Loss by Stage
          </h3>
          {data.loss_by_stage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.loss_by_stage}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" fill="#F5831F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No stage data</p>
          )}
        </div>
      </div>

      {/* Competitor Leaderboard */}
      {data.loss_by_competitor.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Competitor Leaderboard
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Competitor
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Deals Lost
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    % of Losses
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.loss_by_competitor.map((comp, index) => {
                  const percentage =
                    data.total_lost_deals > 0
                      ? Math.round((comp.count / data.total_lost_deals) * 100)
                      : 0;
                  return (
                    <tr
                      key={comp.competitor}
                      className={`border-b border-gray-50 ${
                        index === 0
                          ? 'bg-red-50/50 font-medium'
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {comp.competitor}
                        {index === 0 && (
                          <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Top threat
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {comp.count}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Zone Win/Loss */}
      {data.loss_by_zone.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Zone Win/Loss Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Zone
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Won
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Lost
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Win Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.loss_by_zone.map((zone) => (
                  <tr
                    key={zone.zone_id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {zone.zone_name}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">
                      {zone.won}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600 font-medium">
                      {zone.lost}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          zone.win_rate >= 60
                            ? 'bg-green-100 text-green-700'
                            : zone.win_rate >= 40
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {zone.win_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Objection Patterns */}
      {data.objection_patterns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Objection Patterns
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.objection_patterns.map((obj) => (
              <div key={obj.category} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{obj.count}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {obj.category.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
