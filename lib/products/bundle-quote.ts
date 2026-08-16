/**
 * Create a business quote from a priced CircleConnect / OTG bundle BOM.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { QuoteItemType } from '@/lib/quotes/types';
import {
  allocateBundleLineItems,
  priceBundle,
  type BundlePriceInput,
  type BundlePriceResult,
} from '@/lib/products/bundle-pricing';

export interface BundleQuoteRequest {
  pricing: BundlePriceInput;
  heliosDealCode?: string;
  cpeSku?: string;
  cpeName?: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  service_address: string;
  customer_type?: 'smme' | 'enterprise' | 'soho';
}

export async function createBundleQuote(
  supabase: SupabaseClient,
  request: BundleQuoteRequest,
  createdBy?: string
): Promise<{ quoteId: string; quoteNumber: string; pricing: BundlePriceResult }> {
  const pricing = priceBundle(request.pricing);

  const { data: pkg } = await supabase
    .from('service_packages')
    .select('id, name, service_type, product_category, speed_down, speed_up, features')
    .eq('sku', request.pricing.template === 'otg' ? 'CC-5G-CON-035' : 'CC-5G-CON-035')
    .maybeSingle();

  const fallback = await supabase
    .from('service_packages')
    .select('id, name, service_type, product_category, speed_down, speed_up, features')
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  const packageId = pkg?.id ?? fallback.data?.id;
  if (!packageId) {
    throw new Error('No service package available to snapshot onto the quote');
  }

  const bomNote = [
    `Bundle: ${pricing.template.name}`,
    `Helios deal: ${request.heliosDealCode || 'pending'}`,
    `CPE: ${
      pricing.cpeCharged
        ? `${request.cpeName || request.cpeSku || 'Rectron CPE'} @ R${pricing.cpeCashOutExcl} excl (amortised R${pricing.cpeAmortisedMonthlyExcl}/mo)`
        : 'Included on Helios deal (not double-counted)'
    }`,
    request.pricing.m365Seats
      ? `M365 Business Standard x${request.pricing.m365Seats} CSP R${pricing.m365CspMonthlyExcl}`
      : 'No M365',
    `Margin ${pricing.marginPct}% | month-1 cash-out R${pricing.month1CashOutExcl} excl`,
    pricing.belowFloor ? `BELOW finance floor ${pricing.floorPct}%` : null,
    pricing.priceDriftNote,
  ]
    .filter(Boolean)
    .join('\n');

  const { data: quote, error: quoteError } = await supabase
    .from('business_quotes')
    .insert({
      customer_type: request.customer_type || 'smme',
      company_name: request.company_name,
      contact_name: request.contact_name,
      contact_email: request.contact_email,
      contact_phone: request.contact_phone,
      service_address: request.service_address,
      status: 'draft',
      contract_term: request.pricing.termMonths,
      customer_notes: bomNote,
      created_by: createdBy || null,
    })
    .select('id, quote_number')
    .single();

  if (quoteError || !quote) {
    throw new Error(quoteError?.message || 'Failed to create quote');
  }

  const allocation = allocateBundleLineItems(pricing, request.pricing.m365Seats);

  const items: Array<{
    quote_id: string;
    package_id: string;
    item_type: QuoteItemType;
    quantity: number;
    monthly_price: number;
    installation_price: number;
    custom_pricing: boolean;
    service_name: string;
    service_type: string;
    product_category: string;
    speed_down: number;
    speed_up: number;
    notes: string | null;
    display_order: number;
  }> = [
    {
      quote_id: quote.id,
      package_id: packageId,
      item_type: 'primary',
      quantity: 1,
      monthly_price: allocation.connectivityMonthlyExcl,
      installation_price: 0,
      custom_pricing: true,
      service_name: `${pricing.template.name} connectivity`,
      service_type: '5G',
      product_category: 'connectivity',
      speed_down: request.pricing.template === 'otg' ? 0 : 35,
      speed_up: 0,
      notes: request.heliosDealCode ? `Helios ${request.heliosDealCode}` : null,
      display_order: 0,
    },
  ];

  if (pricing.cpeCharged && allocation.cpeMonthlyExcl > 0) {
    items.push({
      quote_id: quote.id,
      package_id: packageId,
      item_type: 'secondary',
      quantity: 1,
      monthly_price: allocation.cpeMonthlyExcl,
      installation_price: 0,
      custom_pricing: true,
      service_name: request.cpeName || 'CPE (amortised)',
      service_type: 'hardware',
      product_category: 'hardware',
      speed_down: 0,
      speed_up: 0,
      notes: `Cash out R${pricing.cpeCashOutExcl} excl`,
      display_order: 1,
    });
  }

  if (allocation.m365Seats > 0 && allocation.m365MonthlyExcl > 0) {
    items.push({
      quote_id: quote.id,
      package_id: packageId,
      item_type: 'additional',
      quantity: allocation.m365Seats,
      monthly_price: allocation.m365MonthlyExclPerSeat,
      installation_price: 0,
      custom_pricing: true,
      service_name: 'Microsoft 365 Business Standard',
      service_type: 'software',
      product_category: 'software',
      speed_down: 0,
      speed_up: 0,
      notes: `CSP cost R${pricing.m365CspMonthlyExcl} excl`,
      display_order: 2,
    });
  }

  const { error: itemsError } = await supabase.from('business_quote_items').insert(items);
  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return { quoteId: quote.id, quoteNumber: quote.quote_number, pricing };
}
