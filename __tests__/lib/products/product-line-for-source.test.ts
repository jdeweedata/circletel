import { findProductLineIdForSource } from '@/lib/products/product-line-service';
import { redactUnifiedProductCosts } from '@/lib/types/unified-product';
import type { UnifiedProduct } from '@/lib/types/unified-product';

type SkuRow = {
  product_line_id: string;
  source_table: string;
  source_id: string;
  sku: string | null;
};

function mockSkuClient(rows: SkuRow[]) {
  return {
    from(table: string) {
      if (table !== 'product_line_skus') {
        throw new Error(`unexpected table ${table}`);
      }
      const filters: Record<string, string> = {};
      const builder = {
        select() {
          return builder;
        },
        eq(col: string, val: string) {
          filters[col] = val;
          return builder;
        },
        limit() {
          return builder;
        },
        async maybeSingle() {
          const match = rows.find((row) =>
            Object.entries(filters).every(
              ([key, value]) => String((row as Record<string, unknown>)[key]) === value
            )
          );
          return { data: match ? { product_line_id: match.product_line_id } : null };
        },
      };
      return builder;
    },
  };
}

const SKUS: SkuRow[] = [
  {
    product_line_id: 'line-circleconnect',
    source_table: 'service_packages',
    source_id: 'pkg-cc',
    sku: 'circleconnect-50',
  },
];

describe('findProductLineIdForSource', () => {
  it('matches a linked SKU by source_table and source_id', async () => {
    const id = await findProductLineIdForSource(
      mockSkuClient(SKUS) as never,
      'service_packages',
      'pkg-cc'
    );
    expect(id).toBe('line-circleconnect');
  });

  it('falls back to sku when source_id is not linked', async () => {
    const id = await findProductLineIdForSource(
      mockSkuClient(SKUS) as never,
      'service_packages',
      'stale-id',
      'circleconnect-50'
    );
    expect(id).toBe('line-circleconnect');
  });

  it('returns null for unlinked hardware or MTN rows', async () => {
    const id = await findProductLineIdForSource(
      mockSkuClient(SKUS) as never,
      'circletel_hardware_products',
      'rectron-1',
      'REC-123'
    );
    expect(id).toBeNull();
  });
});

describe('redactUnifiedProductCosts', () => {
  it('zeros cost and margin and strips cost keys from raw', () => {
    const product = {
      uid: 'circletel_hardware_products:1',
      id: '1',
      sourceTable: 'circletel_hardware_products',
      price: 1999,
      cost: 1200,
      margin: 40,
      raw: { cost_price: 1200, name: 'Router' },
    } as unknown as UnifiedProduct;

    const redacted = redactUnifiedProductCosts(product);

    expect(redacted.cost).toBe(0);
    expect(redacted.margin).toBe(0);
    expect(redacted.raw.cost_price).toBeNull();
    expect(redacted.raw.name).toBe('Router');
    expect(product.cost).toBe(1200);
  });
});
