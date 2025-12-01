/**
 * Product Matcher Service
 *
 * Matches CircleTel products to competitor products based on
 * data bundles, pricing, technology, and other attributes.
 */

import type {
  CompetitorProduct,
  MatchCandidate,
  ProductType,
  Technology,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Weights for different matching criteria */
const MATCH_WEIGHTS = {
  data: 0.35,      // Data bundle similarity
  price: 0.25,    // Price proximity
  tech: 0.20,     // Technology match
  term: 0.15,     // Contract term match
  device: 0.05,   // Device match (if applicable)
};

/** Thresholds for automatic matching */
const AUTO_MATCH_THRESHOLD = 0.75;  // 75% confidence for auto-match
const SUGGESTION_THRESHOLD = 0.40;  // 40% minimum for suggestions

// =============================================================================
// MATCHER SERVICE
// =============================================================================

export interface MatchCriteria {
  /** Target data amount in GB */
  dataGb?: number | null;
  /** Target monthly price */
  monthlyPrice?: number | null;
  /** Target technology */
  technology?: Technology;
  /** Target contract term in months */
  contractTerm?: number | null;
  /** Device name if applicable */
  deviceName?: string | null;
  /** Product type filter */
  productType?: ProductType | null;
}

/**
 * Find matching competitor products for given criteria.
 *
 * @param products - Pool of competitor products to search
 * @param criteria - Matching criteria
 * @param limit - Maximum number of matches to return
 * @returns Sorted list of match candidates with confidence scores
 */
export function findMatches(
  products: CompetitorProduct[],
  criteria: MatchCriteria,
  limit = 10
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];

  for (const product of products) {
    // Filter by product type if specified
    if (criteria.productType && product.product_type !== criteria.productType) {
      continue;
    }

    // Calculate match score
    const scoreBreakdown = calculateMatchScore(product, criteria);
    const totalScore = calculateTotalScore(scoreBreakdown);

    // Only include if above suggestion threshold
    if (totalScore >= SUGGESTION_THRESHOLD) {
      candidates.push({
        competitor_product: product,
        confidence: totalScore,
        score_breakdown: scoreBreakdown,
      });
    }
  }

  // Sort by confidence (highest first) and limit
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

/**
 * Suggest auto-matches for a CircleTel product.
 * Only returns matches above the auto-match threshold.
 */
export function suggestAutoMatches(
  products: CompetitorProduct[],
  criteria: MatchCriteria,
  limit = 5
): MatchCandidate[] {
  return findMatches(products, criteria, limit).filter(
    (match) => match.confidence >= AUTO_MATCH_THRESHOLD
  );
}

/**
 * Calculate match score breakdown for a single product.
 */
function calculateMatchScore(
  product: CompetitorProduct,
  criteria: MatchCriteria
): MatchCandidate['score_breakdown'] {
  return {
    data_score: calculateDataScore(product.data_gb, criteria.dataGb),
    price_score: calculatePriceScore(product.monthly_price, criteria.monthlyPrice),
    tech_score: calculateTechScore(product.technology, criteria.technology),
    term_score: calculateTermScore(product.contract_term, criteria.contractTerm),
  };
}

/**
 * Calculate weighted total score from breakdown.
 */
function calculateTotalScore(breakdown: MatchCandidate['score_breakdown']): number {
  return (
    breakdown.data_score * MATCH_WEIGHTS.data +
    breakdown.price_score * MATCH_WEIGHTS.price +
    breakdown.tech_score * MATCH_WEIGHTS.tech +
    breakdown.term_score * MATCH_WEIGHTS.term
  );
}

// =============================================================================
// INDIVIDUAL SCORE CALCULATIONS
// =============================================================================

/**
 * Calculate data bundle similarity score (0-1).
 * Perfect match = 1, ±20% = 0.8, ±50% = 0.5, etc.
 */
function calculateDataScore(
  productData: number | null,
  targetData: number | null | undefined
): number {
  // If either is null/undefined, partial score
  if (productData === null || targetData === null || targetData === undefined) {
    return 0.3; // Neutral score when data unknown
  }

  // Both are 0 (unlimited) or both match exactly
  if (productData === targetData) {
    return 1.0;
  }

  // Calculate percentage difference
  const diff = Math.abs(productData - targetData);
  const avgValue = (productData + targetData) / 2;

  if (avgValue === 0) {
    return 0.5;
  }

  const percentDiff = diff / avgValue;

  // Score inversely proportional to difference
  // 0% diff = 1.0, 20% diff = 0.8, 50% diff = 0.5, 100%+ diff = 0
  return Math.max(0, 1 - percentDiff);
}

/**
 * Calculate price proximity score (0-1).
 * We want to find products in similar price ranges.
 */
function calculatePriceScore(
  productPrice: number | null,
  targetPrice: number | null | undefined
): number {
  if (productPrice === null || targetPrice === null || targetPrice === undefined) {
    return 0.3;
  }

  if (productPrice === targetPrice) {
    return 1.0;
  }

  const diff = Math.abs(productPrice - targetPrice);
  const avgPrice = (productPrice + targetPrice) / 2;

  if (avgPrice === 0) {
    return 0.5;
  }

  const percentDiff = diff / avgPrice;

  // More lenient on price: 0% = 1.0, 30% = 0.7, 50% = 0.5
  return Math.max(0, 1 - percentDiff * 1.5);
}

/**
 * Calculate technology match score (0-1).
 */
function calculateTechScore(
  productTech: Technology,
  targetTech: Technology | undefined
): number {
  if (!targetTech || !productTech) {
    return 0.5; // Neutral when unknown
  }

  // Exact match
  if (productTech === targetTech) {
    return 1.0;
  }

  // Related technologies get partial credit
  const techGroups: Record<string, string[]> = {
    mobile: ['5G', 'LTE'],
    fixed: ['Fibre', 'ADSL', 'Wireless'],
  };

  for (const group of Object.values(techGroups)) {
    if (group.includes(productTech) && group.includes(targetTech)) {
      return 0.7; // Same category
    }
  }

  return 0.2; // Different category
}

/**
 * Calculate contract term match score (0-1).
 */
function calculateTermScore(
  productTerm: number | null,
  targetTerm: number | null | undefined
): number {
  if (productTerm === null || targetTerm === null || targetTerm === undefined) {
    return 0.5;
  }

  if (productTerm === targetTerm) {
    return 1.0;
  }

  // Common terms: 12, 24, 36 months
  const diff = Math.abs(productTerm - targetTerm);

  if (diff <= 3) return 0.9;  // Very close (e.g., 24 vs 24)
  if (diff <= 6) return 0.7;  // Close (e.g., 24 vs 30)
  if (diff <= 12) return 0.5; // Somewhat close (e.g., 24 vs 36)

  return 0.2; // Very different
}

// =============================================================================
// BATCH MATCHING
// =============================================================================

export interface BatchMatchRequest {
  circletelProductId: string;
  circletelProductType: string;
  criteria: MatchCriteria;
}

export interface BatchMatchResult {
  circletelProductId: string;
  circletelProductType: string;
  topMatch: MatchCandidate | null;
  alternativeMatches: MatchCandidate[];
  matchCount: number;
}

/**
 * Find matches for multiple CircleTel products at once.
 */
export function batchFindMatches(
  products: CompetitorProduct[],
  requests: BatchMatchRequest[],
  matchesPerProduct = 5
): BatchMatchResult[] {
  return requests.map((request) => {
    const matches = findMatches(products, request.criteria, matchesPerProduct);

    return {
      circletelProductId: request.circletelProductId,
      circletelProductType: request.circletelProductType,
      topMatch: matches.length > 0 ? matches[0] : null,
      alternativeMatches: matches.slice(1),
      matchCount: matches.length,
    };
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export const MatcherService = {
  findMatches,
  suggestAutoMatches,
  batchFindMatches,
  AUTO_MATCH_THRESHOLD,
  SUGGESTION_THRESHOLD,
  MATCH_WEIGHTS,
};

export default MatcherService;
