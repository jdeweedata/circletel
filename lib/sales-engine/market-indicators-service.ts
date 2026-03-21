/**
 * Market Indicators Service
 * Reads provincial/national market indicators from the market_indicators table
 * and provides typed access for zone scoring, briefings, and UI.
 *
 * @module lib/sales-engine/market-indicators-service
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ProvinceMarketContext,
  NationalMarketContext,
} from './types';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

interface RawIndicator {
  id: string;
  subcategory: string;
  indicator: string;
  value: string | null;
  geography: string | null;
}

// Metro → Province mapping for metro-level indicators
const METRO_TO_PROVINCE: Record<string, string> = {
  'City of Cape Town': 'Western Cape',
  'Cape Town': 'Western Cape',
  'City of Tshwane': 'Gauteng',
  'City of Johannesburg': 'Gauteng',
  'Johannesburg': 'Gauteng',
  'Mangaung': 'Free State',
  'eThekwini': 'KwaZulu-Natal',
  'Durban': 'KwaZulu-Natal',
  'Pietermaritzburg': 'KwaZulu-Natal',
  'Nelson Mandela Bay': 'Eastern Cape',
  'Buffalo City': 'Eastern Cape',
};

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

// =============================================================================
// Value Parsing
// =============================================================================

/**
 * Parse indicator value text to number.
 * Handles: null, plain numbers, negative numbers, ranges ("140-230" → midpoint 185).
 */
export function parseIndicatorValue(value: string | null): number | null {
  if (value === null || value === undefined || value.trim() === '') return null;

  const trimmed = value.trim();

  // Handle ranges like "140-230", "140–230", "23–35"
  const rangeMatch = trimmed.match(/^(-?\d+[\d.,]*)\s*[–-]\s*(-?\d+[\d.,]*)$/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
    if (!isNaN(low) && !isNaN(high)) {
      return (low + high) / 2;
    }
  }

  // Handle plain numbers (including negative)
  const num = parseFloat(trimmed.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// =============================================================================
// Province Market Context
// =============================================================================

/**
 * Get market context for a single province.
 */
export async function getProvinceMarketContext(
  province: string
): Promise<ServiceResult<ProvinceMarketContext>> {
  try {
    const supabase = await createClient();

    // Fetch all indicators for this province + any metro-level data that maps to it
    const metrosForProvince = Object.entries(METRO_TO_PROVINCE)
      .filter(([, prov]) => prov === province)
      .map(([metro]) => metro);

    const geographies = [province, ...metrosForProvince];

    const { data: indicators, error } = await supabase
      .from('market_indicators')
      .select('id, subcategory, indicator, value, geography')
      .in('geography', geographies);

    if (error) {
      return { data: null, error: error.message };
    }

    const context = buildProvinceContext(province, indicators ?? []);
    return { data: context, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to get province context: ${message}` };
  }
}

/**
 * Get market context for all 9 provinces.
 */
export async function getAllProvinceMarketContexts(): Promise<
  ServiceResult<ProvinceMarketContext[]>
> {
  try {
    const supabase = await createClient();

    // Fetch all provincial + metro indicators in one query
    const allGeographies = [...SA_PROVINCES, ...Object.keys(METRO_TO_PROVINCE)];

    const { data: indicators, error } = await supabase
      .from('market_indicators')
      .select('id, subcategory, indicator, value, geography')
      .in('geography', allGeographies);

    if (error) {
      return { data: null, error: error.message };
    }

    const allIndicators = indicators ?? [];

    // Group by province (mapping metros to their province)
    const byProvince: Record<string, RawIndicator[]> = {};
    for (const prov of SA_PROVINCES) {
      byProvince[prov] = [];
    }

    for (const ind of allIndicators) {
      const geo = ind.geography ?? '';
      const province = SA_PROVINCES.includes(geo) ? geo : METRO_TO_PROVINCE[geo];
      if (province && byProvince[province]) {
        byProvince[province].push(ind);
      }
    }

    const contexts = SA_PROVINCES.map((prov) =>
      buildProvinceContext(prov, byProvince[prov] ?? [])
    );

    return { data: contexts, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to get all province contexts: ${message}` };
  }
}

/**
 * Build a typed ProvinceMarketContext from raw indicators.
 */
function buildProvinceContext(
  province: string,
  indicators: RawIndicator[]
): ProvinceMarketContext {
  const find = (subcategory: string, keyword?: string): number | null => {
    const matches = indicators.filter((i) => i.subcategory === subcategory);
    if (keyword) {
      const match = matches.find((i) =>
        i.indicator.toLowerCase().includes(keyword.toLowerCase())
      );
      return match ? parseIndicatorValue(match.value) : null;
    }
    return matches.length > 0 ? parseIndicatorValue(matches[0].value) : null;
  };

  const homeInternet = find('home_internet') ?? find('home_internet', 'home');
  const internetAccess = find('internet_provincial') ?? find('internet_provincial', 'internet');
  const fiveG = find('mobile_network', '5g coverage') ?? find('mobile_network', '5G');
  const employmentChange = find('employment_change');
  const hhExpenditure = find('household_expenditure', 'expenditure');
  const electricity = find('electricity_access');
  const water = find('water_access');
  const sassa = find('sassa_provincial');

  let employmentTrend: 'growing' | 'shrinking' | 'stable' | null = null;
  if (employmentChange !== null) {
    employmentTrend = employmentChange > 0 ? 'growing' : employmentChange < 0 ? 'shrinking' : 'stable';
  }

  return {
    province,
    home_internet_pct: homeInternet,
    internet_access_pct: internetAccess,
    five_g_coverage_pct: fiveG,
    employment_change: employmentChange,
    employment_trend: employmentTrend,
    avg_hh_expenditure: hhExpenditure,
    electricity_access_pct: electricity,
    water_access_pct: water,
    sassa_recipients_m: sassa,
    ftth_homes_passed: null, // National-level only in current dataset
  };
}

// =============================================================================
// National Market Context
// =============================================================================

/**
 * Get national-level market indicators.
 */
export async function getNationalMarketContext(): Promise<
  ServiceResult<NationalMarketContext>
> {
  try {
    const supabase = await createClient();

    const { data: indicators, error } = await supabase
      .from('market_indicators')
      .select('id, subcategory, indicator, value')
      .eq('geography', 'National');

    if (error) {
      return { data: null, error: error.message };
    }

    const all = indicators ?? [];

    const findBySubAndKeyword = (sub: string, keyword: string): number | null => {
      const match = all.find(
        (i) => i.subcategory === sub && i.indicator.toLowerCase().includes(keyword.toLowerCase())
      );
      return match ? parseIndicatorValue(match.value) : null;
    };

    const findById = (id: string): number | null => {
      const match = all.find((i) => i.id === id);
      return match ? parseIndicatorValue(match.value) : null;
    };

    return {
      data: {
        ftth_subscribers_m: findBySubAndKeyword('broadband', 'ftth subscribers'),
        broadband_coverage_pct: findBySubAndKeyword('broadband', 'geographic coverage'),
        smartphone_penetration_pct: findBySubAndKeyword('mobile_network', 'smartphone'),
        five_g_national_pct: findBySubAndKeyword('mobile_network', '5g population'),
        internet_users_m: findById('CONN-001'),
        offline_population_m: findById('CONN-002'),
        prepaid_cost_per_gb: findById('CONN-005'),
        contract_cost_per_gb: findById('CONN-012'),
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to get national context: ${message}` };
  }
}
