/**
 * Product Portfolio Types
 * Types for portfolio dashboard, unit economics, and margin analysis
 */

export interface ProductUnitEconomics {
  productId: string;
  productName: string;
  category: string;
  cac: number;                  // Customer Acquisition Cost
  ltv: number;                  // Lifetime Value
  ltvCacRatio: number;          // LTV/CAC ratio (target: 3x+, ideal: 7-10x)
  paybackMonths: number;        // Months to recover CAC
  monthlyChurn?: number;        // Monthly churn rate (target: <2%, ideal: <1.5%)
  arpu?: number;                // Average Revenue Per User
}

export interface MarginHealthData {
  productId: string;
  productName: string;
  category: string;
  price: number;
  cost: number;
  marginPercent: number;
  status: 'healthy' | 'ok' | 'alert';  // >35%, 25-35%, <25%
}

export interface PortfolioCategory {
  name: string;
  products: string[];
  totalMrr: number;
  avgMargin: number;
  productCount: number;
  activeCount: number;
}

export interface PortfolioMetrics {
  totalProducts: number;
  totalMrr: number;
  avgMargin: number;
  categories: PortfolioCategory[];
  marginDistribution: {
    healthy: number;  // >35%
    ok: number;       // 25-35%
    alert: number;    // <25%
  };
}

export type ProductLifecycleStatus = 'active' | 'development' | 'pilot' | 'sunset';

export interface ProductLifecycleItem {
  productId: string;
  productName: string;
  category: string;
  status: ProductLifecycleStatus;
  launchDate?: string;
  sunsetDate?: string;
  notes?: string;
}

export interface ProductStatusGroup {
  status: ProductLifecycleStatus;
  label: string;
  products: ProductLifecycleItem[];
}

// Gold standard thresholds
export const UNIT_ECONOMICS_THRESHOLDS = {
  ltvCacMinimum: 3,           // Minimum viable LTV/CAC
  ltvCacTarget: 7,            // Target LTV/CAC
  ltvCacIdeal: 10,            // Ideal LTV/CAC
  paybackMaxMonths: 12,       // Maximum acceptable payback
  paybackTargetMonths: 6,     // Target payback
  churnMaxPercent: 2,         // Maximum monthly churn
  churnTargetPercent: 1.5,    // Target monthly churn
} as const;

export const MARGIN_THRESHOLDS = {
  healthy: 35,  // Green: >35%
  ok: 25,       // Amber: 25-35%
  // Red: <25%
} as const;
