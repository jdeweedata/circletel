'use client';

import { useMemo } from 'react';
import { Product } from '@/lib/types/products';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import {
  getPortfolioMetrics,
  getMarginHealth,
  getUnitEconomics,
  getProductStatusGroups,
  getProductsByCategoryGroup,
} from '@/lib/admin/portfolio-service';
import { CategoryGroupName } from '@/lib/admin/product-categories';
import { PortfolioOverviewSection } from './PortfolioOverviewSection';
import { MarginHealthSection } from './MarginHealthSection';
import { UnitEconomicsSection } from './UnitEconomicsSection';
import { ProductStatusMatrix } from './ProductStatusMatrix';
import { useState } from 'react';

interface ProductPortfolioDashboardProps {
  products: Product[];
}

const PORTFOLIO_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'margin', label: 'Margin Health' },
  { id: 'economics', label: 'Unit Economics' },
  { id: 'lifecycle', label: 'Lifecycle' },
] as const;

export function ProductPortfolioDashboard({ products }: ProductPortfolioDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Calculate all metrics
  const metrics = useMemo(() => getPortfolioMetrics(products), [products]);
  const marginHealth = useMemo(() => getMarginHealth(products), [products]);
  const unitEconomics = useMemo(() => getUnitEconomics(), []); // Hardcoded for now
  const statusGroups = useMemo(() => getProductStatusGroups(products), [products]);

  // Get products by category group with MRR
  const productsByGroup = useMemo(() => {
    const grouped = getProductsByCategoryGroup(products);
    const result: Record<CategoryGroupName, { count: number; mrr: number }> = {
      'Consumer Connectivity': { count: 0, mrr: 0 },
      'Managed Services': { count: 0, mrr: 0 },
      'Enterprise & Niche': { count: 0, mrr: 0 },
      'Hardware & Bundles': { count: 0, mrr: 0 },
    };

    (Object.entries(grouped) as [CategoryGroupName, Product[]][]).forEach(([group, prods]) => {
      result[group] = {
        count: prods.length,
        mrr: prods.reduce((sum, p) => sum + parseFloat(p.base_price_zar || '0'), 0),
      };
    });

    return result;
  }, [products]);

  return (
    <div className="space-y-6">
      <UnderlineTabs
        tabs={PORTFOLIO_TABS as unknown as readonly { id: string; label: string }[]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <TabPanel id="overview" activeTab={activeTab}>
        <PortfolioOverviewSection
          metrics={metrics}
          productsByGroup={productsByGroup}
        />
      </TabPanel>

      <TabPanel id="margin" activeTab={activeTab}>
        <MarginHealthSection data={marginHealth} />
      </TabPanel>

      <TabPanel id="economics" activeTab={activeTab}>
        <UnitEconomicsSection data={unitEconomics} />
      </TabPanel>

      <TabPanel id="lifecycle" activeTab={activeTab}>
        <ProductStatusMatrix groups={statusGroups} />
      </TabPanel>
    </div>
  );
}
