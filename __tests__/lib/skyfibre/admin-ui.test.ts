import {
  buildAdminSkyFibreOrderabilityRequest,
  getAdminSkyFibreCapacity,
  getSkyFibreDecisionLabel,
  isAdminSkyFibrePackage,
} from '@/lib/coverage/skyfibre/admin-ui';

describe('SkyFibre admin UI helpers', () => {
  it('builds the admin orderability request for business Tarana/SkyFibre checks', () => {
    expect(
      buildAdminSkyFibreOrderabilityRequest({
        leadId: 'lead-123',
        lat: -26.1076,
        lng: 28.0567,
        capacityMbps: 100,
      })
    ).toEqual({
      leadId: 'lead-123',
      latitude: -26.1076,
      longitude: 28.0567,
      capacityMbps: 100,
      segment: 'business',
    });
  });

  it('uses reader-facing labels for final decisions', () => {
    expect(getSkyFibreDecisionLabel('orderable')).toBe('Orderable');
    expect(getSkyFibreDecisionLabel('covered_not_orderable')).toBe('Covered, not orderable');
    expect(getSkyFibreDecisionLabel('manual_review')).toBe('Manual review');
    expect(getSkyFibreDecisionLabel('not_covered')).toBe('Not covered');
  });

  it('identifies selected SkyFibre and Tarana packages for sales feasibility', () => {
    expect(isAdminSkyFibrePackage({ name: 'SkyFibre Business 100' })).toBe(true);
    expect(isAdminSkyFibrePackage({ serviceType: 'Tarana FWB' })).toBe(true);
    expect(isAdminSkyFibrePackage({ serviceType: 'BizFibreConnect' })).toBe(false);
    expect(isAdminSkyFibrePackage({ serviceType: 'wireless', productCategory: 'connectivity' })).toBe(false);
  });

  it('extracts supported SkyFibre capacities for admin checks', () => {
    expect(getAdminSkyFibreCapacity(50)).toBe(50);
    expect(getAdminSkyFibreCapacity('SkyFibre 200 Mbps')).toBe(200);
    expect(getAdminSkyFibreCapacity('500 Mbps')).toBeNull();
  });
});
