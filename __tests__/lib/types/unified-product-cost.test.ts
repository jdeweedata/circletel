import { normalizeAdminProductToUnified } from '@/lib/types/unified-product';
import type { AdminProduct, AdminProductPricing } from '@/lib/types/admin-products';

const row = {
  id: 'p1', name: 'HomeConnect 50', slug: 'homeconnect-50', category: 'fibre',
  service_type: 'fibre', description: 'Test', status: 'draft',
  is_featured: false, created_at: null, updated_at: null,
} as unknown as AdminProduct;
const pricing = { price_regular: 899 } as unknown as AdminProductPricing;

describe('normalizeAdminProductToUnified cost', () => {
  it('uses the summed cost when provided', () => {
    const u = normalizeAdminProductToUnified(row, pricing, 600);
    expect(u.cost).toBe(600);
    expect(u.margin).toBe(33); // (899-600)/899 ≈ 33%
  });

  it('defaults to 0 cost when not provided (backward compatible)', () => {
    const u = normalizeAdminProductToUnified(row, pricing);
    expect(u.cost).toBe(0);
    expect(u.margin).toBe(0);
  });
});
