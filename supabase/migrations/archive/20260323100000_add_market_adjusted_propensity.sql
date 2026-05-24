-- Add market-adjusted propensity column to sales_zones
-- Stores the propensity score adjusted by provincial market signals
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS market_adjusted_propensity DECIMAL(5,2);
