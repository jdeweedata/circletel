/**
 * First-wave Promote suggestions: fit + in stock + can publish a List Price.
 * A person still confirms. Lifestyle and holdouts are never auto-suggested.
 */

export type PromoteSuggestionReason =
  | 'fit'
  | 'lifestyle'
  | 'already_promoted'
  | 'out_of_stock'
  | 'holdout'
  | 'not_fit'
  | 'no_cost'

export interface PromoteSuggestionInput {
  category: string | null
  name: string
  costExclVat: number
  stockTotal: number
  alreadyPromoted: boolean
}

export interface PromoteSuggestionResult {
  suggested: boolean
  reason: PromoteSuggestionReason
}

const LIFESTYLE_RE =
  /\b(candles?|balloons?|covers?|disney|tweety|fidget|puzzle|pots?|pans?|fryer|kettle|heater|humidifier|television|earphone|earplug|speaker|gaming|ink|toner|mop|broom|bathroom|chalk|ballpoint|pencil case|carry folder|notebook bag)\b/i

const HOLDOUT_RE = /\b(nas|otdr|network attached storage)\b/i

const FIT_RE =
  /\b(access points?|bridges?|ip camera|cctv|ethernet switch|poe|ups|hdmi|networking cables?|cat ?[56]|cable:\s*power|cable:\s*hdmi|network routers?|5g|cpe|onu|ont|modem|firewall|wifi)\b/i

const APPROVED_CPE_RE =
  /\b(h155-38[126]|h352-381|5g-sic-100|5g cpe pro 2|tozed|x100|mc801a|g5[bcts]|g5ts|mc888|mc889|nx220|nx510|fastmile|rutm54|brovi)\b/i

export function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1').trim()
}

export function isLifestyleCategory(category: string | null | undefined): boolean {
  return LIFESTYLE_RE.test(normalizeCategory(category))
}

export function isFirstWaveFit(category: string | null | undefined): boolean {
  const normalized = normalizeCategory(category)
  if (!normalized) return false
  if (HOLDOUT_RE.test(normalized)) return false
  return FIT_RE.test(normalized)
}

export function isApprovedCpeName(name: string | null | undefined): boolean {
  return APPROVED_CPE_RE.test(name || '')
}

export function evaluatePromoteSuggestion(
  input: PromoteSuggestionInput
): PromoteSuggestionResult {
  if (input.alreadyPromoted) {
    return { suggested: false, reason: 'already_promoted' }
  }
  if (!(input.stockTotal > 0)) {
    return { suggested: false, reason: 'out_of_stock' }
  }
  if (isLifestyleCategory(input.category)) {
    return { suggested: false, reason: 'lifestyle' }
  }
  if (HOLDOUT_RE.test(normalizeCategory(input.category)) && !isApprovedCpeName(input.name)) {
    return { suggested: false, reason: 'holdout' }
  }
  if (!(input.costExclVat > 0)) {
    return { suggested: false, reason: 'no_cost' }
  }
  if (isFirstWaveFit(input.category) || isApprovedCpeName(input.name)) {
    return { suggested: true, reason: 'fit' }
  }
  return { suggested: false, reason: 'not_fit' }
}
