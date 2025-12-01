/**
 * Market Analysis Engine
 *
 * Analyzes market positioning, pricing opportunities, and
 * competitive landscape for CircleTel products.
 */

import type {
  CompetitorProduct,
  PriceComparisonResult,
  MarketPosition,
  PricingOpportunity,
  ProductType,
  Technology,
} from './types';

// =============================================================================
// MARKET POSITION ANALYSIS
// =============================================================================

/**
 * Analyze market position for a product based on competitor pricing.
 *
 * @param yourPrice - Your product's monthly price
 * @param competitorPrices - Array of competitor monthly prices
 * @returns Market position analysis
 */
export function analyzeMarketPosition(
  yourPrice: number,
  competitorPrices: number[]
): MarketPosition {
  // Filter out null/undefined/zero prices
  const validPrices = competitorPrices.filter((p) => p != null && p > 0);

  if (validPrices.length === 0) {
    return {
      position: 'competitive',
      your_price: yourPrice,
      market_avg: yourPrice,
      market_min: yourPrice,
      market_max: yourPrice,
      percentile: 50,
      competitor_count: 0,
    };
  }

  // Calculate stats
  const sorted = [...validPrices].sort((a, b) => a - b);
  const marketMin = sorted[0];
  const marketMax = sorted[sorted.length - 1];
  const marketAvg = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;

  // Calculate percentile (what % of competitors are priced below you)
  const belowYou = validPrices.filter((p) => p < yourPrice).length;
  const percentile = Math.round((belowYou / validPrices.length) * 100);

  // Determine position
  let position: MarketPosition['position'];
  const priceDiffPercent = ((yourPrice - marketAvg) / marketAvg) * 100;

  if (priceDiffPercent < -10) {
    position = 'below_market';
  } else if (priceDiffPercent > 10) {
    position = 'above_market';
  } else {
    position = 'competitive';
  }

  return {
    position,
    your_price: yourPrice,
    market_avg: Math.round(marketAvg),
    market_min: marketMin,
    market_max: marketMax,
    percentile,
    competitor_count: validPrices.length,
  };
}

/**
 * Analyze market position from comparison results.
 */
export function analyzeFromComparisons(
  yourPrice: number,
  comparisons: PriceComparisonResult[]
): MarketPosition {
  const prices = comparisons
    .map((c) => c.competitor_price)
    .filter((p): p is number => p !== null);

  return analyzeMarketPosition(yourPrice, prices);
}

// =============================================================================
// PRICING OPPORTUNITY ANALYSIS
// =============================================================================

export interface OpportunityAnalysis {
  opportunities: PricingOpportunity[];
  summary: {
    total_opportunities: number;
    potential_revenue_increase: number;
    products_below_market: number;
    products_above_market: number;
    products_competitive: number;
  };
}

export interface ProductForAnalysis {
  id: string;
  name: string;
  type: string;
  monthly_price: number;
  comparisons: PriceComparisonResult[];
}

/**
 * Identify pricing opportunities across multiple products.
 *
 * @param products - CircleTel products with their competitor matches
 * @returns Opportunity analysis with potential price adjustments
 */
export function identifyPricingOpportunities(
  products: ProductForAnalysis[]
): OpportunityAnalysis {
  const opportunities: PricingOpportunity[] = [];
  let productsBelow = 0;
  let productsAbove = 0;
  let productsCompetitive = 0;

  for (const product of products) {
    const competitorPrices = product.comparisons
      .map((c) => c.competitor_price)
      .filter((p): p is number => p !== null);

    if (competitorPrices.length === 0) continue;

    const position = analyzeMarketPosition(product.monthly_price, competitorPrices);

    // Track position counts
    if (position.position === 'below_market') productsBelow++;
    else if (position.position === 'above_market') productsAbove++;
    else productsCompetitive++;

    // Identify opportunities (when we're priced below market)
    if (position.position === 'below_market' && position.market_avg > product.monthly_price) {
      const priceGap = position.market_avg - product.monthly_price;
      const gapPercent = Math.round((priceGap / product.monthly_price) * 100);

      // Only flag significant opportunities (>5% gap)
      if (gapPercent >= 5) {
        opportunities.push({
          product_type: product.type as PricingOpportunity['product_type'],
          product_id: product.id,
          product_name: product.name,
          your_price: product.monthly_price,
          competitor_avg_price: position.market_avg,
          price_gap: priceGap,
          price_gap_percentage: gapPercent,
          competitors_higher: competitorPrices.filter((p) => p > product.monthly_price).length,
          total_competitors: competitorPrices.length,
        });
      }
    }
  }

  // Sort by price gap percentage (biggest opportunities first)
  opportunities.sort((a, b) => b.price_gap_percentage - a.price_gap_percentage);

  // Calculate potential revenue increase (simplified estimate)
  const potentialIncrease = opportunities.reduce(
    (sum, opp) => sum + opp.price_gap,
    0
  );

  return {
    opportunities,
    summary: {
      total_opportunities: opportunities.length,
      potential_revenue_increase: Math.round(potentialIncrease),
      products_below_market: productsBelow,
      products_above_market: productsAbove,
      products_competitive: productsCompetitive,
    },
  };
}

// =============================================================================
// PRICE TREND ANALYSIS
// =============================================================================

export interface PriceTrend {
  product_id: string;
  product_name: string;
  current_price: number;
  price_30_days_ago: number | null;
  price_change: number | null;
  price_change_percent: number | null;
  trend: 'up' | 'down' | 'stable' | 'unknown';
}

export interface PriceHistoryPoint {
  recorded_at: string;
  monthly_price: number | null;
}

/**
 * Analyze price trend for a product.
 */
export function analyzePriceTrend(
  productId: string,
  productName: string,
  history: PriceHistoryPoint[]
): PriceTrend {
  if (history.length === 0) {
    return {
      product_id: productId,
      product_name: productName,
      current_price: 0,
      price_30_days_ago: null,
      price_change: null,
      price_change_percent: null,
      trend: 'unknown',
    };
  }

  // Sort by date (most recent first)
  const sorted = [...history].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  const currentPrice = sorted[0].monthly_price ?? 0;

  // Find price from ~30 days ago
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const oldRecord = sorted.find(
    (h) => new Date(h.recorded_at).getTime() <= thirtyDaysAgo
  );

  const price30DaysAgo = oldRecord?.monthly_price ?? null;

  let priceChange: number | null = null;
  let priceChangePercent: number | null = null;
  let trend: PriceTrend['trend'] = 'unknown';

  if (price30DaysAgo !== null && currentPrice !== 0) {
    priceChange = currentPrice - price30DaysAgo;
    priceChangePercent = Math.round((priceChange / price30DaysAgo) * 100 * 10) / 10;

    if (priceChangePercent > 2) {
      trend = 'up';
    } else if (priceChangePercent < -2) {
      trend = 'down';
    } else {
      trend = 'stable';
    }
  }

  return {
    product_id: productId,
    product_name: productName,
    current_price: currentPrice,
    price_30_days_ago: price30DaysAgo,
    price_change: priceChange,
    price_change_percent: priceChangePercent,
    trend,
  };
}

// =============================================================================
// MARKET SEGMENT ANALYSIS
// =============================================================================

export interface MarketSegmentStats {
  segment: string;
  product_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  providers: string[];
}

/**
 * Analyze market by segments (product types, technology, etc.)
 */
export function analyzeMarketSegments(
  products: CompetitorProduct[],
  segmentBy: 'product_type' | 'technology' | 'provider'
): MarketSegmentStats[] {
  const segments = new Map<string, {
    prices: number[];
    providers: Set<string>;
  }>();

  for (const product of products) {
    let segmentKey: string;

    switch (segmentBy) {
      case 'product_type':
        segmentKey = product.product_type || 'unknown';
        break;
      case 'technology':
        segmentKey = product.technology || 'unknown';
        break;
      case 'provider':
        segmentKey = product.provider_id;
        break;
      default:
        segmentKey = 'unknown';
    }

    if (!segments.has(segmentKey)) {
      segments.set(segmentKey, { prices: [], providers: new Set() });
    }

    const segment = segments.get(segmentKey)!;

    if (product.monthly_price !== null) {
      segment.prices.push(product.monthly_price);
    }
    segment.providers.add(product.provider_id);
  }

  const stats: MarketSegmentStats[] = [];

  for (const [segment, data] of segments) {
    if (data.prices.length === 0) continue;

    const sorted = data.prices.sort((a, b) => a - b);

    stats.push({
      segment,
      product_count: data.prices.length,
      avg_price: Math.round(data.prices.reduce((s, p) => s + p, 0) / data.prices.length),
      min_price: sorted[0],
      max_price: sorted[sorted.length - 1],
      providers: Array.from(data.providers),
    });
  }

  // Sort by product count
  return stats.sort((a, b) => b.product_count - a.product_count);
}

// =============================================================================
// COMPETITIVE LANDSCAPE
// =============================================================================

export interface CompetitiveLandscape {
  total_products: number;
  total_providers: number;
  price_range: { min: number; max: number; avg: number };
  by_technology: MarketSegmentStats[];
  by_product_type: MarketSegmentStats[];
  price_leaders: Array<{
    provider_id: string;
    avg_price: number;
    product_count: number;
  }>;
}

/**
 * Generate comprehensive competitive landscape analysis.
 */
export function analyzeCompetitiveLandscape(
  products: CompetitorProduct[]
): CompetitiveLandscape {
  const validProducts = products.filter((p) => p.monthly_price !== null);
  const prices = validProducts.map((p) => p.monthly_price!);

  // Unique providers
  const providers = new Set(products.map((p) => p.provider_id));

  // Price stats
  const priceRange = prices.length > 0
    ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      }
    : { min: 0, max: 0, avg: 0 };

  // By technology
  const byTechnology = analyzeMarketSegments(validProducts, 'technology');

  // By product type
  const byProductType = analyzeMarketSegments(validProducts, 'product_type');

  // Price leaders (lowest avg price by provider)
  const providerPrices = new Map<string, number[]>();
  for (const product of validProducts) {
    if (!providerPrices.has(product.provider_id)) {
      providerPrices.set(product.provider_id, []);
    }
    providerPrices.get(product.provider_id)!.push(product.monthly_price!);
  }

  const priceLeaders = Array.from(providerPrices.entries())
    .map(([provider_id, prices]) => ({
      provider_id,
      avg_price: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      product_count: prices.length,
    }))
    .sort((a, b) => a.avg_price - b.avg_price);

  return {
    total_products: validProducts.length,
    total_providers: providers.size,
    price_range: priceRange,
    by_technology: byTechnology,
    by_product_type: byProductType,
    price_leaders: priceLeaders,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const AnalysisEngine = {
  analyzeMarketPosition,
  analyzeFromComparisons,
  identifyPricingOpportunities,
  analyzePriceTrend,
  analyzeMarketSegments,
  analyzeCompetitiveLandscape,
};

export default AnalysisEngine;
