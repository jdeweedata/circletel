'use client';

import { PiLightningBold } from 'react-icons/pi';

interface Order {
  package_name: string;
  package_speed: string;
  package_price: number;
  payment_status: string;
  lead_source: string;
  source_campaign?: string;
}

interface OrderStatCardsProps {
  order: Order;
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

function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    partial: 'Partial',
    failed: 'Failed',
  };
  return labels[status] || status;
}

function getPaymentSubtitle(status: string): string {
  const subtitles: Record<string, string> = {
    pending: 'Awaiting clearing',
    paid: 'Payment received',
    partial: 'Partial payment',
    failed: 'Payment failed',
  };
  return subtitles[status] || '';
}

function StatCard({
  label,
  value,
  subtitle,
  subtitleIcon,
  indicator,
}: {
  label: string;
  value: string;
  subtitle: string;
  subtitleIcon?: React.ReactNode;
  indicator?: 'pulse' | 'none';
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-lg font-bold text-slate-900">{value}</p>
        {indicator === 'pulse' && (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
      <div className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1">
        {subtitleIcon}
        {subtitle}
      </div>
    </div>
  );
}

export function OrderStatCards({ order }: OrderStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Package"
        value={order.package_name}
        subtitle={order.package_speed}
        subtitleIcon={<PiLightningBold className="w-3 h-3 text-primary" />}
      />
      <StatCard
        label="Monthly Price"
        value={formatCurrency(order.package_price)}
        subtitle="VAT Inclusive"
      />
      <StatCard
        label="Payment Status"
        value={getPaymentStatusLabel(order.payment_status)}
        subtitle={getPaymentSubtitle(order.payment_status)}
        indicator={order.payment_status === 'pending' ? 'pulse' : 'none'}
      />
      <StatCard
        label="Lead Source"
        value={formatLeadSource(order.lead_source)}
        subtitle={order.source_campaign || 'Direct'}
      />
    </div>
  );
}
