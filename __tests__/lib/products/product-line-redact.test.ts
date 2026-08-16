import { redactProductLineCosts } from '@/lib/products/product-line-service';
import type { ProductLineWithRelations } from '@/lib/types/product-lines';

describe('redactProductLineCosts', () => {
  it('strips wholesale cost from bundle components for sales viewers', () => {
    const line = {
      id: '1',
      code: 'otg',
      bundle_components: [
        {
          id: 'c1',
          product_line_id: '1',
          component_role: 'licence',
          name: 'M365',
          source: 'm365_csp',
          helios_includes_cpe: false,
          default_monthly_excl: 329,
          default_cost_excl: 270,
          amortise_months: null,
          package_sku: null,
          sort_order: 3,
        },
      ],
      skus: [],
    } as unknown as ProductLineWithRelations;

    const redacted = redactProductLineCosts(line);
    expect(redacted.bundle_components[0].default_cost_excl).toBeNull();
    expect(line.bundle_components[0].default_cost_excl).toBe(270);
  });
});
