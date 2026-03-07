'use client';

import { SectionCard } from '@/components/admin/shared/SectionCard';
import { PiChartLineBold, PiCheckCircleBold, PiWarningBold } from 'react-icons/pi';
import { ProductUnitEconomics, UNIT_ECONOMICS_THRESHOLDS } from '@/lib/types/product-portfolio';
import { cn } from '@/lib/utils';

interface UnitEconomicsSectionProps {
  data: ProductUnitEconomics[];
}

function getRatioStatus(ratio: number): 'excellent' | 'good' | 'warning' | 'alert' {
  if (ratio >= UNIT_ECONOMICS_THRESHOLDS.ltvCacIdeal) return 'excellent';
  if (ratio >= UNIT_ECONOMICS_THRESHOLDS.ltvCacTarget) return 'good';
  if (ratio >= UNIT_ECONOMICS_THRESHOLDS.ltvCacMinimum) return 'warning';
  return 'alert';
}

function getPaybackStatus(months: number): 'excellent' | 'good' | 'warning' | 'alert' {
  if (months <= UNIT_ECONOMICS_THRESHOLDS.paybackTargetMonths) return 'excellent';
  if (months <= UNIT_ECONOMICS_THRESHOLDS.paybackMaxMonths) return 'good';
  if (months <= 18) return 'warning';
  return 'alert';
}

const STATUS_STYLES = {
  excellent: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: PiCheckCircleBold },
  good: { bg: 'bg-blue-100', text: 'text-blue-700', icon: PiCheckCircleBold },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700', icon: PiWarningBold },
  alert: { bg: 'bg-red-100', text: 'text-red-700', icon: PiWarningBold },
};

export function UnitEconomicsSection({ data }: UnitEconomicsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Gold Standard Reference */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">LTV/CAC Minimum</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">3x</p>
          <p className="text-xs text-emerald-600 mt-1">Target: 7-10x</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Payback Target</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">&lt;12 mo</p>
          <p className="text-xs text-blue-600 mt-1">Ideal: 3-6 months</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Monthly Churn</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">&lt;2%</p>
          <p className="text-xs text-purple-600 mt-1">Target: &lt;1.5%</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg border border-amber-200">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Margin Floor</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">25%</p>
          <p className="text-xs text-amber-600 mt-1">Target: 35%+</p>
        </div>
      </div>

      {/* Unit Economics Table */}
      <SectionCard title="Unit Economics by Product" icon={PiChartLineBold}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">CAC</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">LTV</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">LTV/CAC</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Payback</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Churn</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const ratioStatus = getRatioStatus(item.ltvCacRatio);
                const paybackStatus = getPaybackStatus(item.paybackMonths);

                return (
                  <tr
                    key={item.productId}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">{item.productName}</td>
                    <td className="py-3 px-4 text-slate-600 capitalize">{item.category.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-right text-slate-900">
                      {item.cac > 0 ? `R${item.cac.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900">
                      {item.ltv > 0 ? `R${item.ltv.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.ltvCacRatio > 0 ? (
                        <span className={cn(
                          'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                          STATUS_STYLES[ratioStatus].bg,
                          STATUS_STYLES[ratioStatus].text
                        )}>
                          {item.ltvCacRatio.toFixed(1)}x
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        STATUS_STYLES[paybackStatus].bg,
                        STATUS_STYLES[paybackStatus].text
                      )}>
                        {item.paybackMonths} mo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {item.monthlyChurn !== undefined ? `${item.monthlyChurn}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Excellent (LTV/CAC &ge;10x)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Good (7-10x)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Warning (3-7x)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Alert (&lt;3x)</span>
        </div>
      </div>
    </div>
  );
}
