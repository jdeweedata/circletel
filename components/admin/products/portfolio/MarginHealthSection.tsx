'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { PiTrendDownBold, PiWarningCircleBold } from 'react-icons/pi';
import { MarginHealthData, MARGIN_THRESHOLDS } from '@/lib/types/product-portfolio';
import { cn } from '@/lib/utils';

interface MarginHealthSectionProps {
  data: MarginHealthData[];
}

const STATUS_COLORS = {
  healthy: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: '#10B981' },
  ok: { bg: 'bg-amber-100', text: 'text-amber-700', bar: '#F59E0B' },
  alert: { bg: 'bg-red-100', text: 'text-red-700', bar: '#EF4444' },
};

export function MarginHealthSection({ data }: MarginHealthSectionProps) {
  const alertProducts = data.filter((d) => d.status === 'alert');
  const chartData = data.slice(0, 15); // Show top 15 for chart

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertProducts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <PiWarningCircleBold className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">
              {alertProducts.length} product{alertProducts.length !== 1 ? 's' : ''} below 25% margin
            </h4>
            <p className="text-sm text-red-600 mt-1">
              Products below the minimum 25% margin threshold require immediate pricing or cost review.
            </p>
          </div>
        </div>
      )}

      {/* Margin Distribution Chart */}
      <SectionCard title="Margin Distribution" icon={PiTrendDownBold}>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="productName"
                width={100}
                tick={{ fill: '#334155', fontSize: 11 }}
                tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <ReferenceLine
                x={MARGIN_THRESHOLDS.ok}
                stroke="#EF4444"
                strokeDasharray="5 5"
                label={{ value: '25% min', position: 'top', fill: '#EF4444', fontSize: 10 }}
              />
              <ReferenceLine
                x={MARGIN_THRESHOLDS.healthy}
                stroke="#10B981"
                strokeDasharray="5 5"
                label={{ value: '35% target', position: 'top', fill: '#10B981', fontSize: 10 }}
              />
              <Bar dataKey="marginPercent" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.productId} fill={STATUS_COLORS[entry.status].bar} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Margin Health Table */}
      <SectionCard title="Margin Health Table" icon={PiTrendDownBold}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Cost</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Margin %</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.productId}
                  className={cn(
                    'border-b border-slate-100 hover:bg-slate-50',
                    item.status === 'alert' && 'bg-red-50/50'
                  )}
                >
                  <td className="py-3 px-4 font-medium text-slate-900">{item.productName}</td>
                  <td className="py-3 px-4 text-slate-600 capitalize">{item.category}</td>
                  <td className="py-3 px-4 text-right text-slate-900">R{item.price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-600">R{item.cost.toLocaleString()}</td>
                  <td className={cn(
                    'py-3 px-4 text-right font-semibold',
                    STATUS_COLORS[item.status].text
                  )}>
                    {item.marginPercent.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                      STATUS_COLORS[item.status].bg,
                      STATUS_COLORS[item.status].text
                    )}>
                      {item.status === 'healthy' && 'Healthy'}
                      {item.status === 'ok' && 'OK'}
                      {item.status === 'alert' && 'Alert'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
