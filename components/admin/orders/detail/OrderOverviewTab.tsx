'use client';

import {
  PiEnvelopeBold,
  PiPhoneBold,
  PiBellBold,
  PiMapPinBold,
  PiCheckCircleBold,
  PiTargetBold,
  PiFireBold,
} from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { SectionCard, InfoRow } from '@/components/admin/shared';
import { OrderProgressTimeline } from './OrderProgressTimeline';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  installation_address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  special_instructions?: string;
  residential_address?: string;
  residential_suburb?: string;
  residential_city?: string;
  residential_province?: string;
  residential_postal_code?: string;
  kyc_address_verified?: boolean;
  account_number?: string;
  package_name: string;
  package_speed: string;
  package_price: number;
  installation_fee: number;
  router_included: boolean;
  router_rental_fee?: number;
  contract_term?: number;
  status: string;
  contact_preference: string;
  marketing_opt_in: boolean;
  whatsapp_opt_in: boolean;
  lead_source: string;
  source_campaign?: string;
  referral_code?: string;
  referred_by?: string;
  internal_notes?: string;
  created_at: string;
  payment_date?: string;
  installation_scheduled_date?: string;
  installation_completed_date?: string;
  activation_date?: string;
}

interface OrderOverviewTabProps {
  order: Order;
  onViewHistory?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatLeadSource(source: string): string {
  const mapping: Record<string, string> = {
    organic: 'Organic Search',
    google_ads: 'Google Ads',
    facebook: 'Facebook',
    referral: 'Referral',
    direct: 'Direct',
    coverage_check: 'Coverage Check',
    partner: 'Partner',
  };
  return mapping[source] || source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function OrderOverviewTab({ order, onViewHistory }: OrderOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-6">
      {/* Left Column - Customer & Address */}
      <div className="space-y-8">
        {/* Customer Information */}
        <SectionCard title="Customer Information">
          <div className="space-y-5">
            {/* Avatar + Name + Account */}
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {getInitials(order.first_name, order.last_name)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{order.first_name} {order.last_name}</p>
                {order.account_number && (
                  <p className="text-sm text-slate-500 font-mono">{order.account_number}</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <PiEnvelopeBold className="h-4 w-4 text-blue-600" />
                </div>
                <a href={`mailto:${order.email}`} className="text-sm text-blue-600 hover:underline truncate">
                  {order.email}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <PiPhoneBold className="h-4 w-4 text-emerald-600" />
                </div>
                <a href={`tel:${order.phone}`} className="text-sm text-slate-700 hover:text-slate-900">
                  {order.phone}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <PiBellBold className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm text-slate-700 capitalize">{order.contact_preference}</span>
              </div>
            </div>

            {/* Preferences as Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {order.marketing_opt_in && (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                  Marketing
                </Badge>
              )}
              {order.whatsapp_opt_in && (
                <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                  WhatsApp
                </Badge>
              )}
              {!order.marketing_opt_in && !order.whatsapp_opt_in && (
                <Badge variant="secondary" className="text-xs bg-slate-50 text-slate-400">
                  No marketing preferences
                </Badge>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Installation Address */}
        <SectionCard title="Installation Address">
          <div className="flex gap-4">
            <div className="size-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <PiMapPinBold className="h-7 w-7 text-slate-500" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-900">{order.installation_address}</p>
              {order.suburb && <p className="text-sm text-slate-600">{order.suburb}</p>}
              <p className="text-sm text-slate-600">
                {[order.city, order.province, order.postal_code].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          {order.special_instructions && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Special Instructions</p>
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                {order.special_instructions}
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Middle Column - Package & Marketing */}
      <div className="space-y-8">
        {/* Package Details */}
        <SectionCard title="Package Details">
          <div className="space-y-4">
            {/* Highlighted Package Box */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="font-bold text-slate-900">{order.package_name}</p>
                <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-5 gap-0.5">
                  <PiFireBold className="h-3 w-3" />
                  HOT
                </Badge>
              </div>

              {/* Speed + Price Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Speed</p>
                  <p className="text-lg font-bold text-primary">{order.package_speed}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Monthly Price</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(order.package_price)}</p>
                </div>
              </div>
            </div>

            {/* Info Rows */}
            <div className="space-y-0">
              <InfoRow
                label="Router Status"
                value={
                  order.router_included ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <PiCheckCircleBold className="h-4 w-4" />
                      Included
                    </span>
                  ) : order.router_rental_fee && order.router_rental_fee > 0 ? (
                    `Rental ${formatCurrency(order.router_rental_fee)}/mo`
                  ) : (
                    'Customer provides'
                  )
                }
              />
              <InfoRow
                label="Contract Term"
                value={order.contract_term ? `${order.contract_term} months` : 'Month-to-month'}
              />
              <InfoRow
                label="Installation Fee"
                value={order.installation_fee === 0 ? (
                  <span className="text-emerald-600 font-semibold">FREE</span>
                ) : (
                  formatCurrency(order.installation_fee)
                )}
              />
            </div>
          </div>
        </SectionCard>

        {/* Marketing & Attribution */}
        <SectionCard title="Marketing & Attribution">
          <div className="space-y-4">
            {/* Lead Source */}
            <div className="flex items-center gap-4">
              <div className="size-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <PiTargetBold className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Lead Type</p>
                <p className="font-semibold text-slate-900">{formatLeadSource(order.lead_source)}</p>
              </div>
            </div>

            {/* Attribution Details */}
            <div className="space-y-0">
              {order.source_campaign && (
                <InfoRow label="Campaign" value={order.source_campaign} />
              )}
              {order.referral_code && (
                <InfoRow
                  label="Referral Code"
                  value={<span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{order.referral_code}</span>}
                />
              )}
              {order.referred_by && (
                <InfoRow label="Referred By" value={order.referred_by} />
              )}
              {!order.source_campaign && !order.referral_code && !order.referred_by && (
                <p className="text-sm text-slate-400 py-2">No additional attribution data</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Right Column - Timeline */}
      <div className="h-full">
        <OrderProgressTimeline order={order} onViewHistory={onViewHistory} />
      </div>
    </div>
  );
}
