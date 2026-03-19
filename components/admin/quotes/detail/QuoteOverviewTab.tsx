'use client';

import {
  PiBuildingsBold,
  PiUserBold,
  PiEnvelopeBold,
  PiPhoneBold,
  PiMapPinBold,
  PiFileTextBold,
} from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { SectionCard, InfoRow } from '@/components/admin/shared';
import type { QuoteDetails } from '@/lib/quotes/types';

interface QuoteOverviewTabProps {
  quote: QuoteDetails;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

export function QuoteOverviewTab({ quote }: QuoteOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-6">
      {/* Left Column - Company & Contact */}
      <div className="space-y-8">
        <SectionCard title="Company Details">
          <div className="space-y-5">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <PiBuildingsBold className="h-6 w-6" />
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-900 truncate">{quote.company_name}</p>
                <p className="text-sm text-slate-500 capitalize">{quote.customer_type} Customer</p>
              </div>
            </div>
            
            <div className="space-y-0">
              {quote.registration_number && (
                <InfoRow label="Registration No." value={quote.registration_number} />
              )}
              {quote.vat_number && (
                <InfoRow label="VAT No." value={quote.vat_number} />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Contact Information">
          <div className="space-y-5">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                {getInitials(quote.contact_name)}
              </div>
              <div>
                <p className="font-medium text-slate-900">{quote.contact_name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <PiEnvelopeBold className="h-4 w-4 text-blue-600" />
                </div>
                <a href={`mailto:${quote.contact_email}`} className="text-sm text-blue-600 hover:underline truncate">
                  {quote.contact_email}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <PiPhoneBold className="h-4 w-4 text-emerald-600" />
                </div>
                <a href={`tel:${quote.contact_phone}`} className="text-sm text-slate-700 hover:text-slate-900">
                  {quote.contact_phone}
                </a>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <PiMapPinBold className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm text-slate-700 leading-tight pt-1">
                  {quote.service_address}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Middle/Right Column - Services & Notes */}
      <div className="space-y-8 lg:col-span-2">
        <SectionCard title={`Services (${quote.items.length})`}>
          <div className="space-y-4">
            {quote.items.map((item) => (
              <div key={item.id} className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-slate-100 rounded-md">
                        <PiFileTextBold className="h-4 w-4 text-slate-500" />
                      </div>
                      <h4 className="font-bold text-slate-900">{item.service_name}</h4>
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-slate-100 text-slate-600 uppercase">
                        {item.item_type}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 mt-3">
                      <div><span className="text-slate-400">Speed:</span> {item.speed_down}Mbs ↓ / {item.speed_up}Mbs ↑</div>
                      {item.data_cap_gb && <div><span className="text-slate-400">Data Cap:</span> {item.data_cap_gb}GB</div>}
                      <div><span className="text-slate-400">Quantity:</span> {item.quantity}</div>
                    </div>
                    
                    {item.notes && (
                      <div className="mt-3 text-sm italic text-slate-500 bg-slate-50/50 p-2 rounded border border-slate-100">
                        {item.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <p className="text-lg font-extrabold text-slate-900">
                      {formatCurrency(item.monthly_price * item.quantity)}
                      <span className="text-xs font-normal text-slate-500 whitespace-nowrap">/mo</span>
                    </p>
                    {item.installation_price > 0 && (
                      <p className="text-xs text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                        + {formatCurrency(item.installation_price)} install
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {quote.customer_notes && (
          <SectionCard title="Customer Notes">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed">
                {quote.customer_notes}
              </p>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
