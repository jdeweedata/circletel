'use client';

import {
  PiUserBold,
  PiEnvelopeBold,
  PiPhoneBold,
  PiMapPinBold,
  PiPackageBold,
  PiTrendUpBold,
  PiShieldBold,
  PiNotePencilBold,
} from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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

function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200', className)}>
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-between items-center py-2 border-b border-slate-50 last:border-0', className)}>
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value || '—'}</span>
    </div>
  );
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

export function OrderOverviewTab({ order, onViewHistory }: OrderOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Customer Information */}
        <SectionCard icon={PiUserBold} title="Customer Information">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
              <p className="font-semibold text-slate-900">{order.first_name} {order.last_name}</p>
            </div>

            {order.account_number && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Number</p>
                <p className="font-mono font-bold text-primary">{order.account_number}</p>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <PiEnvelopeBold className="h-4 w-4 text-blue-600" />
              </div>
              <a href={`mailto:${order.email}`} className="text-sm text-blue-600 hover:underline truncate">
                {order.email}
              </a>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <PiPhoneBold className="h-4 w-4 text-emerald-600" />
              </div>
              <a href={`tel:${order.phone}`} className="text-sm text-slate-700 hover:text-slate-900">
                {order.phone}
              </a>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 mb-1">Contact</p>
                <p className="text-sm font-medium capitalize">{order.contact_preference}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Marketing</p>
                <p className="text-sm font-medium">{order.marketing_opt_in ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">WhatsApp</p>
                <p className="text-sm font-medium">{order.whatsapp_opt_in ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Installation Address */}
        <SectionCard icon={PiMapPinBold} title="Installation Address">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Street Address</p>
              <p className="text-slate-900">{order.installation_address}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {order.suburb && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Suburb</p>
                  <p className="text-sm font-medium">{order.suburb}</p>
                </div>
              )}
              {order.city && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">City</p>
                  <p className="text-sm font-medium">{order.city}</p>
                </div>
              )}
              {order.province && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Province</p>
                  <p className="text-sm font-medium">{order.province}</p>
                </div>
              )}
              {order.postal_code && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Postal Code</p>
                  <p className="text-sm font-medium">{order.postal_code}</p>
                </div>
              )}
            </div>

            {order.special_instructions && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Special Instructions</p>
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    {order.special_instructions}
                  </p>
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Middle Column */}
      <div className="space-y-6">
        {/* Package Details */}
        <SectionCard icon={PiPackageBold} title="Package Details">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Package</p>
                <p className="font-semibold text-slate-900">{order.package_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Speed</p>
                <p className="text-sm text-slate-700">{order.package_speed}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Monthly Price</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(order.package_price)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Installation Fee</p>
                <p className="text-sm font-medium">{formatCurrency(order.installation_fee)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Router Included</p>
                <p className="text-sm font-medium">{order.router_included ? 'Yes' : 'No'}</p>
              </div>
              {order.router_rental_fee && order.router_rental_fee > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Router Rental</p>
                  <p className="text-sm font-medium">{formatCurrency(order.router_rental_fee)}/mo</p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Lead Source */}
        <SectionCard icon={PiTrendUpBold} title="Lead Source">
          <div className="space-y-1">
            <InfoRow label="Source" value={formatLeadSource(order.lead_source)} />
            {order.source_campaign && <InfoRow label="Campaign" value={order.source_campaign} />}
            {order.referral_code && (
              <InfoRow
                label="Referral Code"
                value={<span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{order.referral_code}</span>}
              />
            )}
            {order.referred_by && <InfoRow label="Referred By" value={order.referred_by} />}
          </div>
        </SectionCard>

        {/* Residential Address (KYC) */}
        {order.residential_address && (
          <SectionCard
            icon={PiMapPinBold}
            title="Current Address"
            badge={
              order.kyc_address_verified && (
                <Badge className="bg-emerald-50 text-emerald-700 border-0 gap-1 text-xs">
                  <PiShieldBold className="h-3 w-3" />
                  KYC Verified
                </Badge>
              )
            }
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Street Address</p>
                <p className="text-slate-900">{order.residential_address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {order.residential_suburb && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Suburb</p>
                    <p className="text-sm font-medium">{order.residential_suburb}</p>
                  </div>
                )}
                {order.residential_city && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">City</p>
                    <p className="text-sm font-medium">{order.residential_city}</p>
                  </div>
                )}
                {order.residential_province && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Province</p>
                    <p className="text-sm font-medium">{order.residential_province}</p>
                  </div>
                )}
                {order.residential_postal_code && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Postal Code</p>
                    <p className="text-sm font-medium">{order.residential_postal_code}</p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Order Progress Timeline */}
        <OrderProgressTimeline order={order} onViewHistory={onViewHistory} />

        {/* Admin Notes */}
        {order.internal_notes && (
          <SectionCard icon={PiNotePencilBold} title="Admin Notes">
            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg p-3">
              {order.internal_notes}
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
