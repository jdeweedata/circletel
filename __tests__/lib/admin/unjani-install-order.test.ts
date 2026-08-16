import { recommendedAccess } from '@/lib/portal/coverage-summary';
import { canPlaceInstallOrder } from '@/lib/admin/unjani-warehouse';
import { coverageExplorerConfig } from '@/lib/portal/coverage-explorer-config';

describe('place Unjani install order', () => {
  it('rejects coverage that is not feasible', () => {
    expect(canPlaceInstallOrder({ tarana: { feasible: false } })).toBe(false);
    expect(recommendedAccess({ tarana: { feasible: false } })).toBe('none');
  });

  it('allows an order when Tarana, 5G or 4G is available', () => {
    expect(canPlaceInstallOrder({ tarana: { feasible: true } })).toBe(true);
    expect(canPlaceInstallOrder({ five_g: { available: true } })).toBe(true);
    expect(canPlaceInstallOrder({ lte: { available: true } })).toBe(true);
  });
});

describe('coverage explorer API wiring', () => {
  it('keeps the portal explorer on portal coverage APIs', () => {
    const portal = coverageExplorerConfig('portal');
    expect(portal.apiBase).toBe('/api/portal/coverage');
    expect(portal.onboardPath).toBe('/api/portal/coverage/onboard');
    expect(portal.ctaLabel).toBe('Nominate');
    expect(portal.formTitle).toBe('Nominate clinic');
  });

  it('points admin at the Unjani coverage API and Process install order', () => {
    const admin = coverageExplorerConfig('admin');
    expect(admin.apiBase).toBe('/api/admin/unjani/coverage');
    expect(admin.onboardPath).toBe('/api/admin/unjani/install-orders');
    expect(admin.ctaLabel).toBe('Process install order');
    expect(admin.formTitle).toBe('Process install order');
  });
});
