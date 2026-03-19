import type { BusinessQuoteItem } from './types';

/**
 * Structured benefits for quote rendering
 */
export interface QuoteBenefits {
  perItem: Array<{
    serviceName: string;
    serviceType: string;
    benefits: string[];
  }>;
  global: string[];
}

/**
 * SOHO benefits — for WorkConnect and consumer-grade products
 */
const SOHO_BENEFITS = [
  'South African-based customer support',
  'Professional installation and configuration',
  'Extended support hours (Mon-Sat 07:00-19:00)',
  'Month-to-month flexibility available',
  'VoIP quality of service included',
  'Free-to-use business router',
];

/**
 * Business/Enterprise benefits — for SkyFibre SME, BizFibreConnect, etc.
 */
const BUSINESS_BENEFITS = [
  'South African-based customer support',
  '24/7 Network Operations Centre (NOC) monitoring',
  'Professional installation and configuration',
  'Dedicated account manager',
  'Priority technical support',
  'Monthly usage reporting and analytics',
];

/**
 * Determine the appropriate global benefits based on quote items.
 * SOHO products get SOHO benefits. Business products get business benefits.
 * Mixed quotes default to business benefits (higher tier wins).
 */
function getGlobalBenefits(items: BusinessQuoteItem[]): string[] {
  const hasBusinessItems = items.some((item) => {
    const type = item.service_type?.toLowerCase() || '';
    const category = item.product_category?.toLowerCase() || '';
    const name = item.service_name?.toLowerCase() || '';
    return (
      (type.includes('skyfibre') && (name.includes('sme') || name.includes('enterprise'))) ||
      type === 'bizfibreconnect' ||
      category === 'fibre_business'
    );
  });

  // If any item is business-grade, use business benefits (higher tier wins)
  if (hasBusinessItems) {
    return BUSINESS_BENEFITS;
  }

  const hasSohoItems = items.some((item) => {
    const type = item.service_type?.toLowerCase() || '';
    const category = item.product_category?.toLowerCase() || '';
    return type === 'workconnect' || category === 'soho';
  });

  if (hasSohoItems) {
    return SOHO_BENEFITS;
  }

  // Default to business benefits for unknown product types
  return BUSINESS_BENEFITS;
}

/**
 * Build benefits list from quote items.
 * Uses benefits_snapshot when available, falls back to raw features.
 *
 * @param items - Quote line items with optional benefits_snapshot
 * @returns Structured benefits: per-item product benefits + global benefits
 */
export function buildQuoteBenefits(items: BusinessQuoteItem[]): QuoteBenefits {
  const perItem: QuoteBenefits['perItem'] = [];

  for (const item of items) {
    const snapshot = item.benefits_snapshot;
    let benefits: string[] = [];

    if (snapshot?.formatted_benefits && Array.isArray(snapshot.formatted_benefits)) {
      // Use formatted benefits from snapshot
      // Show benefit category first, then technical (max 6 total)
      const benefitItems = snapshot.formatted_benefits
        .filter((b) => b.category === 'benefit' && b.text.trim() !== '');
      const technicalItems = snapshot.formatted_benefits
        .filter((b) => b.category === 'technical' && b.text.trim() !== '');
      benefits = [...benefitItems, ...technicalItems]
        .slice(0, 6)
        .map((b) => b.text);
    } else if (snapshot?.features && Array.isArray(snapshot.features)) {
      // Fallback: use raw features (backfilled items without formatted_benefits)
      benefits = snapshot.features.slice(0, 6);
    }

    if (benefits.length > 0) {
      perItem.push({
        serviceName: item.service_name,
        serviceType: item.service_type,
        benefits,
      });
    } else {
      // Legacy fallback: generate basic benefits from service_type/service_name
      // (covers items where benefits_snapshot is null and backfill failed)
      const legacyBenefits = getLegacyBenefits(item.service_type, item.service_name);
      if (legacyBenefits.length > 0) {
        perItem.push({
          serviceName: item.service_name,
          serviceType: item.service_type,
          benefits: legacyBenefits,
        });
      }
    }
  }

  return {
    perItem,
    global: getGlobalBenefits(items),
  };
}

/**
 * Legacy fallback: generate basic benefits from service type when no snapshot exists.
 */
function getLegacyBenefits(serviceType: string, serviceName: string): string[] {
  const type = serviceType?.toLowerCase() || '';
  const name = serviceName?.toLowerCase() || '';

  if (type.includes('fibre') || name.includes('fibre') || type === 'bizfibreconnect') {
    return ['99.9% Service Level Agreement (SLA)', 'Unlimited data usage', 'Static IP address allocation'];
  }
  if (type === 'skyfibre' || name.includes('skyfibre') || name.includes('wireless')) {
    return ['99.5% Service Level Agreement (SLA)', 'Weather-resistant equipment', 'Professional installation'];
  }
  if (type === '5g' || name.includes('5g') || name.includes('lte')) {
    return ['Coverage-optimised connectivity', 'Self-install or professional installation', 'Flexible data options'];
  }
  if (type === 'workconnect' || name.includes('workconnect')) {
    return ['VoIP QoS included', 'Extended support Mon-Sat 07:00-19:00', 'Free-to-use business router'];
  }
  return [];
}
