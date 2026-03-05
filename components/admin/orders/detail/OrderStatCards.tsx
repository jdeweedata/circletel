'use client';

import { PiPackageBold, PiCurrencyCircleDollarBold, PiCheckCircleBold, PiClockBold, PiMegaphoneBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';

interface Order {
  package_name: string;
  package_price: number;
  payment_status: string;
  lead_source: string;
  source_campaign?: string;
}

interface OrderStatCardsProps {
  order: Order;
}

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'text-amber-600', label: 'Pending' },
  paid: { color: 'text-emerald-600', label: 'Paid' },
  partial: { color: 'text-blue-600', label: 'Partial' },
  failed: { color: 'text-red-600', label: 'Failed' },
  refunded: { color: 'text-slate-600', label: 'Refunded' },
};

function getPaymentStatusConfig(status: string) {
  return PAYMENT_STATUS_CONFIG[status] || { color: 'text-slate-600', label: status };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLeadSource(source: string): string {
  const mapping: Record<string, string> = {
    organic: 'Organic',
    google_ads: 'Google Ads',
    facebook: 'Facebook',
    referral: 'Referral',
    direct: 'Direct',
    coverage_check: 'Coverage Check',
    partner: 'Partner',
  };
  return mapping[source] || source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function OrderStatCards({ order }: OrderStatCardsProps) {
  const paymentConfig = getPaymentStatusConfig(order.payment_status);

  const stats = [
    {
      label: 'PACKAGE',
      value: order.package_name,
      icon: PiPackageBold,
      iconBg: 'bg-blue-500',
    },
    {
      label: 'MONTHLY',
      value: formatCurrency(order.package_price),
      suffix: '/ month',
      icon: PiCurrencyCircleDollarBold,
      iconBg: 'bg-emerald-500',
    },
    {
      label: 'PAYMENT',
      value: paymentConfig.label,
      valueColor: paymentConfig.color,
      icon: order.payment_status === 'paid' ? PiCheckCircleBold : PiClockBold,
      iconBg: order.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500',
      showDot: true,
      dotColor: order.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500',
    },
    {
      label: 'SOURCE',
      value: formatLeadSource(order.lead_source),
      subtitle: order.source_campaign,
      icon: PiMegaphoneBold,
      iconBg: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {stat.label}
            </span>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              stat.iconBg
            )}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            {stat.showDot && (
              <span className={cn("w-2 h-2 rounded-full mr-1", stat.dotColor)} />
            )}
            <span className={cn(
              "text-lg font-bold truncate",
              stat.valueColor || 'text-slate-900'
            )}>
              {stat.value}
            </span>
            {stat.suffix && (
              <span className="text-xs text-slate-400 font-medium">{stat.suffix}</span>
            )}
          </div>
          {stat.subtitle && (
            <p className="text-xs text-slate-500 mt-1 truncate">{stat.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
