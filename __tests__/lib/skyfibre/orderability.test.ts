import {
  buildSkyFibreDecision,
  buildTcsCoverageFromProximity,
  checkSkyFibreOrderability,
  isSkyFibrePackage,
} from '@/lib/coverage/skyfibre/orderability';
import { checkBaseStationProximity } from '@/lib/coverage/mtn/base-station-service';
import type { BaseStationProximityResult } from '@/lib/coverage/types';

jest.mock('@/lib/coverage/mtn/base-station-service', () => ({
  checkBaseStationProximity: jest.fn(),
}));

const mockCheckBaseStationProximity = checkBaseStationProximity as jest.MockedFunction<typeof checkBaseStationProximity>;

const baseProximity: BaseStationProximityResult = {
  hasCoverage: true,
  confidence: 'high',
  requiresElevatedInstall: false,
  installationNote: null,
  nearestStation: {
    siteName: 'Sandton BN',
    hostname: 'BN-001',
    distanceKm: 1.4,
    activeConnections: 12,
    market: 'Gauteng',
    deviceStatus: 1,
  },
  allNearbyStations: [],
  metadata: {
    checkedAt: '2026-06-16T10:00:00.000Z',
    coordinatesUsed: { lat: -26.1, lng: 28.0 },
    stationsChecked: 1,
  },
};

describe('SkyFibre orderability decisions', () => {
  it('allows ordering when TCS confidence is acceptable and CSP is orderable', () => {
    const decision = buildSkyFibreDecision({
      segment: 'business',
      capacityMbps: 100,
      tcsCoverage: buildTcsCoverageFromProximity(baseProximity),
      cspOrderability: {
        provider: 'mtn-csp',
        productName: 'Fixed Wireless Broadband',
        method: 'feasibilityOld',
        capacityMbps: 100,
        orderable: true,
        status: 'orderable',
        taranaZone: 2,
        checkedAt: '2026-06-16T10:00:00.000Z',
      },
    });

    expect(decision.decision).toBe('orderable');
  });

  it('blocks ordering when TCS is covered but CSP is not orderable', () => {
    const decision = buildSkyFibreDecision({
      segment: 'residential',
      capacityMbps: 50,
      tcsCoverage: buildTcsCoverageFromProximity(baseProximity),
      cspOrderability: {
        provider: 'mtn-csp',
        productName: 'Fixed Wireless Broadband',
        method: 'feasibilityOld',
        capacityMbps: 50,
        orderable: false,
        status: 'not_orderable',
        checkedAt: '2026-06-16T10:00:00.000Z',
      },
    });

    expect(decision.decision).toBe('covered_not_orderable');
  });

  it('downgrades active BNs without active RN evidence to manual review', () => {
    const tcsCoverage = buildTcsCoverageFromProximity({
      ...baseProximity,
      confidence: 'high',
      nearestStation: {
        ...baseProximity.nearestStation!,
        activeConnections: 0,
      },
    });

    const decision = buildSkyFibreDecision({
      segment: 'business',
      capacityMbps: 200,
      tcsCoverage,
      cspOrderability: {
        provider: 'mtn-csp',
        productName: 'Fixed Wireless Broadband',
        method: 'feasibilityCheck',
        capacityMbps: 200,
        orderable: true,
        status: 'orderable',
        checkedAt: '2026-06-16T10:00:00.000Z',
      },
    });

    expect(tcsCoverage.confidence).toBe('medium');
    expect(decision.decision).toBe('manual_review');
  });

  it('returns not covered when the nearest BN is offline', () => {
    const tcsCoverage = buildTcsCoverageFromProximity({
      ...baseProximity,
      hasCoverage: false,
      confidence: 'none',
      nearestStation: {
        ...baseProximity.nearestStation!,
        deviceStatus: 0,
      },
    });

    const decision = buildSkyFibreDecision({
      segment: 'residential',
      capacityMbps: 100,
      tcsCoverage,
    });

    expect(decision.decision).toBe('not_covered');
  });

  it('does not call CSP when TCS has no active coverage', async () => {
    mockCheckBaseStationProximity.mockResolvedValue({
      ...baseProximity,
      hasCoverage: false,
      confidence: 'none',
      nearestStation: null,
    });
    const cspClient = { checkOrderability: jest.fn() };

    const result = await checkSkyFibreOrderability(
      {
        latitude: -26.1,
        longitude: 28.0,
        capacityMbps: 100,
        segment: 'residential',
      },
      { cspClient: cspClient as any }
    );

    expect(result.decision).toBe('not_covered');
    expect(cspClient.checkOrderability).not.toHaveBeenCalled();
  });

  it('still calls CSP when an online BN has no RN evidence', async () => {
    mockCheckBaseStationProximity.mockResolvedValue({
      ...baseProximity,
      confidence: 'low',
      nearestStation: {
        ...baseProximity.nearestStation!,
        activeConnections: 0,
        deviceStatus: 1,
      },
    });
    const cspClient = {
      checkOrderability: jest.fn().mockResolvedValue({
        provider: 'mtn-csp',
        productName: 'Fixed Wireless Broadband',
        method: 'feasibilityOld',
        capacityMbps: 50,
        orderable: true,
        status: 'orderable',
        checkedAt: '2026-06-16T10:00:00.000Z',
      }),
    };

    const result = await checkSkyFibreOrderability(
      {
        latitude: -25.7134413,
        longitude: 28.3962027,
        capacityMbps: 50,
        segment: 'business',
      },
      { cspClient: cspClient as any }
    );

    expect(cspClient.checkOrderability).toHaveBeenCalledWith({
      latitude: -25.7134413,
      longitude: 28.3962027,
      capacityMbps: 50,
    });
    expect(result.cspOrderability?.status).toBe('orderable');
    expect(result.decision).toBe('manual_review');
  });

  it('detects only explicit SkyFibre or Tarana packages for the order gate', () => {
    expect(isSkyFibrePackage({ package_name: 'SkyFibre Business 100' })).toBe(true);
    expect(isSkyFibrePackage({ service_type: 'Tarana FWB' })).toBe(true);
    expect(isSkyFibrePackage({ service_type: 'wireless', product_category: 'connectivity' })).toBe(false);
  });
});
