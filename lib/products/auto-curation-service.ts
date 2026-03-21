// Auto-curation service for MTN dealer products
// Filters 10,000+ Arlan deals down to ~200-500 recommended deals
// and classifies each deal's business use case from price plan keyword patterns

import { createClient } from '@/lib/supabase/server'
import type {
  MTNDealerBusinessUseCase,
  AutoCurationRules,
  AutoCurationResult,
} from '@/lib/types/mtn-dealer-products'
import { DEFAULT_CURATION_RULES } from '@/lib/types/mtn-dealer-products'

// Device brand keywords for classifying device_upgrade use case
const DEVICE_BRAND_PATTERNS = /\b(iphone|samsung|galaxy|huawei|honor|oppo|vivo|blackview)\b/i

// IoT / M2M keywords
const IOT_M2M_PATTERNS = /\b(iot|m2m|sim\s*only)\b/i

// Fleet management keywords
const FLEET_PATTERNS = /\bfleet\b/i

// Voice keywords (in bundle context)
const VOICE_PATTERNS = /\b(voice|voip|minute)\b/i

// Data connectivity keywords
const DATA_CONNECTIVITY_PATTERNS = /\b(5g|shesha|uncapped)\b/i

// Mobile workforce keywords
const MOBILE_WORKFORCE_PATTERNS = /\b(momo|pos|point\s*of\s*sale)\b/i

// Data+ pattern
const DATA_PLUS_PATTERN = /\bdata\+/i

// Made For Business pattern
const MADE_FOR_BUSINESS_PATTERN = /\bmade\s+for\s+business\b/i

/**
 * Classify a deal's business use case from price plan keywords, device name,
 * and tariff description. Uses pattern matching with priority ordering.
 */
export function classifyBusinessUseCase(
  pricePlan: string,
  deviceName: string | null,
  tariffDescription: string | null
): MTNDealerBusinessUseCase {
  const planLower = pricePlan || ''
  const deviceLower = deviceName || ''
  const tariffLower = tariffDescription || ''
  const combinedText = `${planLower} ${tariffLower}`

  // 1. Check deviceName first for device brands
  if (deviceLower && DEVICE_BRAND_PATTERNS.test(deviceLower)) {
    return 'device_upgrade'
  }

  // 2. IoT / M2M / SIM Only
  if (IOT_M2M_PATTERNS.test(planLower) || IOT_M2M_PATTERNS.test(tariffLower)) {
    return 'iot_m2m'
  }

  // 3. Fleet management
  if (FLEET_PATTERNS.test(combinedText)) {
    return 'fleet_management'
  }

  // 4. Mobile workforce (MoMo, PoS)
  if (MOBILE_WORKFORCE_PATTERNS.test(combinedText)) {
    return 'mobile_workforce'
  }

  // 5. Data+ in price plan → data connectivity
  if (DATA_PLUS_PATTERN.test(planLower)) {
    return 'data_connectivity'
  }

  // 6. Made For Business — voice if no device, device_upgrade if device present
  if (MADE_FOR_BUSINESS_PATTERN.test(planLower)) {
    if (deviceLower && deviceLower.trim().length > 0) {
      return 'device_upgrade'
    }
    return 'voice_comms'
  }

  // 7. 5G / Shesha / Uncapped → data connectivity
  if (DATA_CONNECTIVITY_PATTERNS.test(combinedText)) {
    return 'data_connectivity'
  }

  // 8. Voice / VoIP / Minute in bundle context
  if (VOICE_PATTERNS.test(combinedText)) {
    return 'voice_comms'
  }

  // 9. Default
  return 'data_connectivity'
}

/**
 * Auto-curate all active MTN dealer products against filter rules.
 * Matching deals get recommended status; non-matching get hidden (unless manually curated).
 * All deals get classified with a business_use_case.
 */
export async function autoCurateDeals(
  rules: AutoCurationRules = DEFAULT_CURATION_RULES
): Promise<AutoCurationResult> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Fetch all active deals
  const { data: allDeals, error: fetchError } = await supabase
    .from('mtn_dealer_products')
    .select('deal_id, price_plan, device_name, tariff_description, device_status, contract_term, mtn_price_incl_vat, promo_start_date, promo_end_date, available_on_helios, available_on_ilula, curation_status, auto_curated, business_use_case')
    .eq('status', 'active')

  if (fetchError) {
    console.error('[auto-curation] Failed to fetch deals:', fetchError.message)
    throw new Error(`Failed to fetch deals: ${fetchError.message}`)
  }

  if (!allDeals || allDeals.length === 0) {
    return {
      total_processed: 0,
      recommended: 0,
      hidden: 0,
      unchanged: 0,
      classified_by_use_case: {},
    }
  }

  const recommendedDealIds: string[] = []
  const hiddenDealIds: string[] = []
  const unchangedDealIds: string[] = []
  const classifiedByUseCase: Record<string, number> = {}

  // Build a map of deal_id → business_use_case for batch update
  const useCaseMap: Record<string, MTNDealerBusinessUseCase> = {}

  for (const deal of allDeals) {
    // Classify business use case for every deal
    const useCase = classifyBusinessUseCase(
      deal.price_plan,
      deal.device_name,
      deal.tariff_description
    )
    useCaseMap[deal.deal_id] = useCase
    classifiedByUseCase[useCase] = (classifiedByUseCase[useCase] || 0) + 1

    // Check if deal matches curation rules
    const matchesRules = isDealRecommended(deal, rules, today)

    if (matchesRules) {
      recommendedDealIds.push(deal.deal_id)
    } else {
      // Only auto-hide if currently uncurated — don't override manual curation
      const isManuallySet = !deal.auto_curated && deal.curation_status !== 'uncurated'
      if (isManuallySet) {
        unchangedDealIds.push(deal.deal_id)
      } else {
        hiddenDealIds.push(deal.deal_id)
      }
    }
  }

  // Batch update recommended deals (groups of 100)
  await batchUpdateCuration(supabase, recommendedDealIds, 'recommended', useCaseMap)

  // Batch update hidden deals (groups of 100)
  await batchUpdateCuration(supabase, hiddenDealIds, 'hidden', useCaseMap)

  // Update use case only for unchanged deals (don't touch curation_status)
  await batchUpdateUseCaseOnly(supabase, unchangedDealIds, useCaseMap)

  return {
    total_processed: allDeals.length,
    recommended: recommendedDealIds.length,
    hidden: hiddenDealIds.length,
    unchanged: unchangedDealIds.length,
    classified_by_use_case: classifiedByUseCase,
  }
}

/**
 * Check whether a deal matches the auto-curation rules for recommendation.
 */
function isDealRecommended(
  deal: {
    device_status: string | null
    contract_term: number
    mtn_price_incl_vat: number
    promo_start_date: string | null
    promo_end_date: string | null
    available_on_helios: boolean
    available_on_ilula: boolean
  },
  rules: AutoCurationRules,
  today: string
): boolean {
  // Device status: must be in allowed list, or null (SIM-only deals pass)
  if (deal.device_status !== null) {
    const allowedStatuses: string[] = rules.device_statuses
    if (!allowedStatuses.includes(deal.device_status)) {
      return false
    }
  }

  // Contract term must be in allowed list
  if (!rules.contract_terms.includes(deal.contract_term as 0 | 12 | 24 | 36)) {
    return false
  }

  // Price must be within range
  if (
    deal.mtn_price_incl_vat < rules.min_price_incl_vat ||
    deal.mtn_price_incl_vat > rules.max_price_incl_vat
  ) {
    return false
  }

  // Current promo check
  if (rules.require_current_promo) {
    if (!deal.promo_start_date || !deal.promo_end_date) {
      return false
    }
    if (deal.promo_start_date > today || deal.promo_end_date < today) {
      return false
    }
  }

  // Helios or Ilula availability
  if (rules.require_helios_or_ilula) {
    if (!deal.available_on_helios && !deal.available_on_ilula) {
      return false
    }
  }

  return true
}

/**
 * Batch update curation_status and business_use_case for a list of deal IDs.
 * Processes in groups of 100 to avoid query size limits.
 */
async function batchUpdateCuration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealIds: string[],
  curationStatus: 'recommended' | 'hidden',
  useCaseMap: Record<string, MTNDealerBusinessUseCase>
): Promise<void> {
  if (dealIds.length === 0) return

  // Group deals by use case for efficient batch updates
  const groupedByUseCase: Record<string, string[]> = {}
  for (const dealId of dealIds) {
    const useCase = useCaseMap[dealId] || 'data_connectivity'
    if (!groupedByUseCase[useCase]) {
      groupedByUseCase[useCase] = []
    }
    groupedByUseCase[useCase].push(dealId)
  }

  for (const [useCase, ids] of Object.entries(groupedByUseCase)) {
    // Process in chunks of 100
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const { error } = await supabase
        .from('mtn_dealer_products')
        .update({
          curation_status: curationStatus,
          auto_curated: true,
          business_use_case: useCase,
          updated_at: new Date().toISOString(),
        })
        .in('deal_id', chunk)

      if (error) {
        console.error(
          `[auto-curation] Failed to update ${curationStatus} batch (${useCase}, offset ${i}):`,
          error.message
        )
      }
    }
  }
}

/**
 * Batch update only business_use_case for deals whose curation_status should not change.
 */
async function batchUpdateUseCaseOnly(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealIds: string[],
  useCaseMap: Record<string, MTNDealerBusinessUseCase>
): Promise<void> {
  if (dealIds.length === 0) return

  const groupedByUseCase: Record<string, string[]> = {}
  for (const dealId of dealIds) {
    const useCase = useCaseMap[dealId] || 'data_connectivity'
    if (!groupedByUseCase[useCase]) {
      groupedByUseCase[useCase] = []
    }
    groupedByUseCase[useCase].push(dealId)
  }

  for (const [useCase, ids] of Object.entries(groupedByUseCase)) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const { error } = await supabase
        .from('mtn_dealer_products')
        .update({
          business_use_case: useCase,
          updated_at: new Date().toISOString(),
        })
        .in('deal_id', chunk)

      if (error) {
        console.error(
          `[auto-curation] Failed to update use case batch (${useCase}, offset ${i}):`,
          error.message
        )
      }
    }
  }
}

/**
 * Classify business_use_case for all active deals without changing curation_status.
 * Returns a count of deals per use case.
 */
export async function classifyAllDeals(): Promise<Record<string, number>> {
  const supabase = await createClient()

  const { data: allDeals, error: fetchError } = await supabase
    .from('mtn_dealer_products')
    .select('deal_id, price_plan, device_name, tariff_description')
    .eq('status', 'active')

  if (fetchError) {
    console.error('[auto-curation] Failed to fetch deals for classification:', fetchError.message)
    throw new Error(`Failed to fetch deals: ${fetchError.message}`)
  }

  if (!allDeals || allDeals.length === 0) {
    return {}
  }

  const countByUseCase: Record<string, number> = {}
  const useCaseMap: Record<string, MTNDealerBusinessUseCase> = {}

  for (const deal of allDeals) {
    const useCase = classifyBusinessUseCase(
      deal.price_plan,
      deal.device_name,
      deal.tariff_description
    )
    useCaseMap[deal.deal_id] = useCase
    countByUseCase[useCase] = (countByUseCase[useCase] || 0) + 1
  }

  // Group deal IDs by use case for batch update
  const groupedByUseCase: Record<string, string[]> = {}
  for (const [dealId, useCase] of Object.entries(useCaseMap)) {
    if (!groupedByUseCase[useCase]) {
      groupedByUseCase[useCase] = []
    }
    groupedByUseCase[useCase].push(dealId)
  }

  // Batch update in groups of 100
  for (const [useCase, ids] of Object.entries(groupedByUseCase)) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const { error } = await supabase
        .from('mtn_dealer_products')
        .update({
          business_use_case: useCase,
          updated_at: new Date().toISOString(),
        })
        .in('deal_id', chunk)

      if (error) {
        console.error(
          `[auto-curation] Failed to classify batch (${useCase}, offset ${i}):`,
          error.message
        )
      }
    }
  }

  return countByUseCase
}
