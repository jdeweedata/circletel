import { shouldSkipOrderContext } from '@/lib/order/skip-order-context';

describe('shouldSkipOrderContext', () => {
  it('skips Unjani and portal routes so they do not call consumer /api/order-drafts', () => {
    expect(shouldSkipOrderContext('/unjani/coverage')).toBe(true);
    expect(shouldSkipOrderContext('/unjani/team')).toBe(true);
    expect(shouldSkipOrderContext('/portal/coverage')).toBe(true);
  });

  it('still skips admin, partner, and auth pages', () => {
    expect(shouldSkipOrderContext('/admin/b2b-customers')).toBe(true);
    expect(shouldSkipOrderContext('/partners/dashboard')).toBe(true);
    expect(shouldSkipOrderContext('/auth/login')).toBe(true);
  });

  it('still runs on the consumer order flow', () => {
    expect(shouldSkipOrderContext('/order')).toBe(false);
    expect(shouldSkipOrderContext('/coverage')).toBe(false);
    expect(shouldSkipOrderContext('/')).toBe(false);
  });
});
