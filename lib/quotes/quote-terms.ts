import { createClient } from '@/lib/supabase/server';
import type { BusinessQuoteTerms } from './types';

/**
 * Terms section for quote rendering
 */
export interface QuoteTermsSection {
  title: string;
  text: string;
  serviceType: string;
  displayOrder: number;
}

/**
 * Fetch applicable terms for a quote based on its line items' service types.
 * Returns _default terms + product-specific terms, sorted by display_order.
 *
 * @param serviceTypes - Unique service types from quote items (e.g. ['SkyFibre', '5G'])
 * @param contractTerm - Contract term in months (12, 24, 36)
 * @returns Sorted array of terms sections
 */
export async function fetchQuoteTerms(
  serviceTypes: string[],
  contractTerm: number
): Promise<QuoteTermsSection[]> {
  const supabase = await createClient();

  // Fetch terms matching _default + any of the service types
  // contract_term NULL means "applies to all terms"
  const uniqueTypes = ['_default', ...new Set(serviceTypes)];

  const { data: terms, error } = await supabase
    .from('business_quote_terms')
    .select('*')
    .in('service_type', uniqueTypes)
    .eq('active', true)
    .or(`contract_term.is.null,contract_term.eq.${contractTerm}`)
    .order('display_order', { ascending: true });

  if (error || !terms) {
    console.error('[quote-terms] Failed to fetch terms:', error?.message);
    return [];
  }

  return (terms as BusinessQuoteTerms[]).map((t) => ({
    title: t.title,
    text: t.terms_text,
    serviceType: t.service_type,
    displayOrder: t.display_order,
  }));
}
