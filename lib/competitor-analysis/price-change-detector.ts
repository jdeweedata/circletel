/**
 * Price Change Detector
 *
 * Detects significant price changes in competitor products and
 * generates alerts for the admin dashboard and email notifications.
 */

import type {
  CompetitorProduct,
  CompetitorPriceHistory,
  DashboardAlert,
  CompetitorProvider,
} from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface PriceChange {
  product_id: string;
  product_name: string;
  provider_id: string;
  provider_name: string;
  provider_slug: string;
  old_price: number;
  new_price: number;
  change_amount: number;
  change_percentage: number;
  direction: 'increase' | 'decrease';
  detected_at: string;
  source_url: string | null;
}

export interface PriceChangeDetectionResult {
  total_products_checked: number;
  price_changes_detected: number;
  significant_changes: PriceChange[];
  alerts_generated: DashboardAlert[];
}

export interface DetectionConfig {
  /** Minimum percentage change to be considered significant (default: 5%) */
  significantChangeThreshold: number;
  /** Minimum absolute change in ZAR to be considered significant (default: R50) */
  minAbsoluteChange: number;
  /** Number of days to look back for comparison (default: 7) */
  lookbackDays: number;
}

const DEFAULT_CONFIG: DetectionConfig = {
  significantChangeThreshold: 5,
  minAbsoluteChange: 50,
  lookbackDays: 7,
};

// =============================================================================
// PRICE CHANGE DETECTOR
// =============================================================================

/**
 * Detect price changes between current products and historical prices.
 */
export function detectPriceChanges(
  currentProducts: CompetitorProduct[],
  priceHistory: CompetitorPriceHistory[],
  providers: CompetitorProvider[],
  config: Partial<DetectionConfig> = {}
): PriceChangeDetectionResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const changes: PriceChange[] = [];
  const alerts: DashboardAlert[] = [];

  // Create a map of provider info
  const providerMap = new Map(providers.map(p => [p.id, p]));

  // Group history by product
  const historyByProduct = new Map<string, CompetitorPriceHistory[]>();
  for (const record of priceHistory) {
    const existing = historyByProduct.get(record.competitor_product_id) || [];
    existing.push(record);
    historyByProduct.set(record.competitor_product_id, existing);
  }

  // Calculate cutoff date for lookback
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - mergedConfig.lookbackDays);

  for (const product of currentProducts) {
    if (!product.monthly_price) continue;

    const history = historyByProduct.get(product.id) || [];
    if (history.length === 0) continue;

    // Find the most recent historical price within lookback period
    const relevantHistory = history
      .filter(h => h.monthly_price !== null && new Date(h.recorded_at) >= cutoffDate)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    // Skip if only one record (the current one)
    if (relevantHistory.length < 2) continue;

    // Compare current price with previous price
    const currentPrice = product.monthly_price;
    const previousPrice = relevantHistory[1]?.monthly_price;

    if (!previousPrice || previousPrice === currentPrice) continue;

    const changeAmount = currentPrice - previousPrice;
    const changePercentage = (changeAmount / previousPrice) * 100;
    const absChangePercentage = Math.abs(changePercentage);
    const absChangeAmount = Math.abs(changeAmount);

    // Check if change is significant
    const isSignificant =
      absChangePercentage >= mergedConfig.significantChangeThreshold ||
      absChangeAmount >= mergedConfig.minAbsoluteChange;

    if (isSignificant) {
      const provider = providerMap.get(product.provider_id);
      const direction = changeAmount > 0 ? 'increase' : 'decrease';

      const priceChange: PriceChange = {
        product_id: product.id,
        product_name: product.product_name,
        provider_id: product.provider_id,
        provider_name: provider?.name || 'Unknown',
        provider_slug: provider?.slug || 'unknown',
        old_price: previousPrice,
        new_price: currentPrice,
        change_amount: changeAmount,
        change_percentage: changePercentage,
        direction,
        detected_at: new Date().toISOString(),
        source_url: product.source_url,
      };

      changes.push(priceChange);

      // Generate alert
      const alert = generateAlert(priceChange);
      alerts.push(alert);
    }
  }

  return {
    total_products_checked: currentProducts.length,
    price_changes_detected: changes.length,
    significant_changes: changes,
    alerts_generated: alerts,
  };
}

/**
 * Generate a dashboard alert from a price change.
 */
function generateAlert(change: PriceChange): DashboardAlert {
  const isDecrease = change.direction === 'decrease';
  const absPercentage = Math.abs(change.change_percentage).toFixed(1);

  return {
    id: `price-${change.direction}-${change.product_id}-${Date.now()}`,
    type: isDecrease ? 'price_drop' : 'price_increase',
    severity: isDecrease ? 'warning' : 'info',
    title: `${change.provider_name} Price ${isDecrease ? 'Drop' : 'Increase'}`,
    message: `${change.product_name}: R${change.old_price} → R${change.new_price} (${isDecrease ? '-' : '+'}${absPercentage}%)`,
    provider_slug: change.provider_slug,
    product_id: change.product_id,
    created_at: change.detected_at,
  };
}

/**
 * Compare new scrape results with existing products to detect changes.
 * This is used during scrape operations.
 */
export function detectChangesFromScrape(
  newProducts: Omit<CompetitorProduct, 'id' | 'created_at' | 'updated_at'>[],
  existingProducts: CompetitorProduct[],
  provider: CompetitorProvider,
  config: Partial<DetectionConfig> = {}
): PriceChange[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const changes: PriceChange[] = [];

  // Create a map of existing products by external_id or product_name
  const existingMap = new Map<string, CompetitorProduct>();
  for (const product of existingProducts) {
    const key = product.external_id || product.product_name;
    existingMap.set(key, product);
  }

  for (const newProduct of newProducts) {
    if (!newProduct.monthly_price) continue;

    const key = newProduct.external_id || newProduct.product_name;
    const existingProduct = existingMap.get(key);

    if (!existingProduct || !existingProduct.monthly_price) continue;

    const changeAmount = newProduct.monthly_price - existingProduct.monthly_price;
    if (changeAmount === 0) continue;

    const changePercentage = (changeAmount / existingProduct.monthly_price) * 100;
    const absChangePercentage = Math.abs(changePercentage);
    const absChangeAmount = Math.abs(changeAmount);

    // Check if change is significant
    const isSignificant =
      absChangePercentage >= mergedConfig.significantChangeThreshold ||
      absChangeAmount >= mergedConfig.minAbsoluteChange;

    if (isSignificant) {
      changes.push({
        product_id: existingProduct.id,
        product_name: newProduct.product_name,
        provider_id: provider.id,
        provider_name: provider.name,
        provider_slug: provider.slug,
        old_price: existingProduct.monthly_price,
        new_price: newProduct.monthly_price,
        change_amount: changeAmount,
        change_percentage: changePercentage,
        direction: changeAmount > 0 ? 'increase' : 'decrease',
        detected_at: new Date().toISOString(),
        source_url: newProduct.source_url,
      });
    }
  }

  return changes;
}

/**
 * Get a summary of price changes for a time period.
 */
export function summarizePriceChanges(changes: PriceChange[]): {
  total: number;
  increases: number;
  decreases: number;
  avgChangePercent: number;
  byProvider: Map<string, { increases: number; decreases: number }>;
} {
  const byProvider = new Map<string, { increases: number; decreases: number }>();

  let totalChangePercent = 0;
  let increases = 0;
  let decreases = 0;

  for (const change of changes) {
    if (change.direction === 'increase') {
      increases++;
    } else {
      decreases++;
    }

    totalChangePercent += Math.abs(change.change_percentage);

    const providerStats = byProvider.get(change.provider_slug) || { increases: 0, decreases: 0 };
    if (change.direction === 'increase') {
      providerStats.increases++;
    } else {
      providerStats.decreases++;
    }
    byProvider.set(change.provider_slug, providerStats);
  }

  return {
    total: changes.length,
    increases,
    decreases,
    avgChangePercent: changes.length > 0 ? totalChangePercent / changes.length : 0,
    byProvider,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const PriceChangeDetector = {
  detectPriceChanges,
  detectChangesFromScrape,
  summarizePriceChanges,
  generateAlert,
};

export default PriceChangeDetector;
