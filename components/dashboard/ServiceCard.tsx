'use client';

import { useState } from 'react';
import { ConnectionStatusWidget } from '@/components/dashboard/ConnectionStatusWidget';
import { ServiceManageDropdown } from '@/components/dashboard/ServiceManageDropdown';
import { PPPoECredentialsCard } from '@/components/dashboard/PPPoECredentialsCard';

interface ServiceCardService {
  id: string;
  package_name: string;
  service_type: string;
  status: string;
  monthly_price: number;
  installation_address: string;
  speed_down: number;
  speed_up: number;
}

interface ServiceCardBilling {
  next_billing_date: string;
}

interface ServiceCardProps {
  service: ServiceCardService;
  billing: ServiceCardBilling | null;
}

function StatusDot({ status }: { status: string }) {
  const normalised = status.toLowerCase();
  const isActive = normalised === 'active' || normalised === 'connected' || normalised.includes('billing');
  const color = isActive ? '#16a34a' : '#94a3b8';
  const label = isActive ? 'Connected & Billing' : status;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}

function formatAddress(address: string): string {
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 3) return parts.slice(-2).join(', ');
  return address;
}

export function ServiceCard({ service, billing }: ServiceCardProps) {
  const [showPPPoE, setShowPPPoE] = useState(false);

  const monthlyFormatted = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(service.monthly_price);

  const nextBillingFormatted = billing?.next_billing_date
    ? new Date(billing.next_billing_date).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div
      className="bg-white rounded-xl border p-4 space-y-4"
      style={{ borderColor: '#e2e8f0', borderRadius: '12px' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <StatusDot status={service.status} />
          <p className="text-sm font-bold text-slate-800 mt-1">{service.package_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatAddress(service.installation_address)}</p>
        </div>
        <ServiceManageDropdown
          serviceId={service.id}
          packageName={service.package_name}
          className="shrink-0"
        />
      </div>

      {/* Speed row */}
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-lg px-3 py-2 text-center"
          style={{ background: '#f0fdf4' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: '#16a34a' }}>↓ Download</p>
          <p className="text-lg font-bold text-slate-800">
            {service.speed_down}
            <span className="text-xs font-normal text-slate-500 ml-0.5">Mbps</span>
          </p>
        </div>
        <div
          className="flex-1 rounded-lg px-3 py-2 text-center"
          style={{ background: '#eff6ff' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: '#3b82f6' }}>↑ Upload</p>
          <p className="text-lg font-bold text-slate-800">
            {service.speed_up}
            <span className="text-xs font-normal text-slate-500 ml-0.5">Mbps</span>
          </p>
        </div>
      </div>

      {/* Network Health + Speed Test row */}
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-lg px-3 py-2"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <ConnectionStatusWidget />
        </div>
        <a
          href="/dashboard/speed-test"
          className="flex-1 rounded-lg px-3 py-2 text-center flex flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-80"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <span className="text-[10px] font-bold" style={{ color: '#f97316' }}>⚡ SPEED TEST</span>
          <span className="text-[10px] text-slate-500">Tap to run</span>
        </a>
      </div>

      {/* PPPoE toggle */}
      <button
        onClick={() => setShowPPPoE((v) => !v)}
        className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
      >
        {showPPPoE ? 'Hide PPPoE credentials' : 'Show PPPoE credentials'}
      </button>
      {showPPPoE && <PPPoECredentialsCard serviceId={service.id} />}

      {/* Monthly fee + next billing */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid #f1f5f9' }}
      >
        <div>
          <p className="text-xs text-slate-500">Monthly fee</p>
          <p className="text-sm font-bold text-slate-800">
            R{monthlyFormatted}{' '}
            <span className="text-[10px] font-normal text-slate-400">incl VAT</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Next billing</p>
          <p className="text-xs font-semibold text-slate-800">{nextBillingFormatted}</p>
        </div>
      </div>
    </div>
  );
}
