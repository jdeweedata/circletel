'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatCard } from '@/components/admin/shared/StatCard';
import {
  PiChartPieBold,
  PiPackageBold,
  PiTrendUpBold,
  PiPercentBold,
} from 'react-icons/pi';
import { PortfolioMetrics } from '@/lib/types/product-portfolio';
import { CategoryGroupName, CATEGORY_GROUP_COLORS } from '@/lib/admin/product-categories';

interface PortfolioOverviewSectionProps {
  metrics: PortfolioMetrics;
  productsByGroup: Record<CategoryGroupName, { count: number; mrr: number }>;
}

const CHART_COLORS: Record<CategoryGroupName, string> = {
  'Consumer Connectivity': '#3B82F6',    // blue-500
  'Managed Services': '#8B5CF6',          // purple-500
  'Enterprise & Niche': '#10B981',        // emerald-500
  'Hardware & Bundles': '#F59E0B',        // amber-500
};

export function PortfolioOverviewSection({
  metrics,
  productsByGroup,
}: PortfolioOverviewSectionProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    return Object.entries(productsByGroup)
      .filter(([, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        value: data.mrr,
        count: data.count,
      }));
  }, [productsByGroup]);

  const formatCurrency = (value: number) => `R${value.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={metrics.totalProducts}
          icon={<PiPackageBold className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle="Across all categories"
        />
        <StatCard
          label="Portfolio MRR"
          value={formatCurrency(metrics.totalMrr)}
          icon={<PiTrendUpBold className="h-5 w-5" />}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          subtitle="Monthly recurring revenue"
        />
        <StatCard
          label="Avg Margin"
          value={`${metrics.avgMargin.toFixed(1)}%`}
          icon={<PiPercentBold className="h-5 w-5" />}
          iconBgColor={
            metrics.avgMargin >= 35 ? 'bg-emerald-100' : metrics.avgMargin >= 25 ? 'bg-amber-100' : 'bg-red-100'
          }
          iconColor={
            metrics.avgMargin >= 35 ? 'text-emerald-600' : metrics.avgMargin >= 25 ? 'text-amber-600' : 'text-red-600'
          }
          subtitle="Across portfolio"
        />
        <StatCard
          label="Margin Health"
          value={`${metrics.marginDistribution.healthy} / ${metrics.totalProducts}`}
          icon={<PiChartPieBold className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle="Products above 35%"
        />
      </div>

      {/* Revenue Distribution Chart */}
      <SectionCard title="Revenue Distribution by Category" icon={PiChartPieBold}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[entry.name as CategoryGroupName] || '#94A3B8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Cards */}
          <div className="space-y-3">
            {Object.entries(productsByGroup).map(([groupName, data]) => {
              if (data.count === 0) return null;
              const colors = CATEGORY_GROUP_COLORS[groupName as CategoryGroupName];
              return (
                <div
                  key={groupName}
                  className={`p-4 rounded-lg border ${colors?.border || 'border-slate-200'} ${colors?.bg || 'bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-semibold ${colors?.text || 'text-slate-700'}`}>
                        {groupName}
                      </h4>
                      <p className="text-sm text-slate-500">{data.count} products</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(data.mrr)}
                      </p>
                      <p className="text-xs text-slate-500">MRR</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
