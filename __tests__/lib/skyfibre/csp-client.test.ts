import {
  normalizeCspFeasibilityResponse,
  selectCspFeasibilityMethod,
} from '@/lib/coverage/skyfibre/csp-client';

describe('MTN CSP orderability client helpers', () => {
  it('uses the legacy feasibility endpoint for 50Mbps and 100Mbps', () => {
    expect(selectCspFeasibilityMethod(50)).toBe('feasibilityOld');
    expect(selectCspFeasibilityMethod(100)).toBe('feasibilityOld');
  });

  it('uses the current feasibility endpoint for 200Mbps', () => {
    expect(selectCspFeasibilityMethod(200)).toBe('feasibilityCheck');
  });

  it('normalizes old CSP Tarana responses', () => {
    const result = normalizeCspFeasibilityResponse(
      {
        outputs: [
          {
            FWA: {
              Tarana_Feasible: true,
              Tarana_zone: 3,
            },
          },
        ],
      },
      100
    );

    expect(result).toEqual(
      expect.objectContaining({
        provider: 'mtn-csp',
        method: 'feasibilityOld',
        capacityMbps: 100,
        orderable: true,
        status: 'orderable',
        taranaFeasible: true,
        taranaZone: 3,
      })
    );
  });

  it('normalizes new CSP product feasibility responses', () => {
    const result = normalizeCspFeasibilityResponse(
      {
        outputs: [
          {
            product_feasible: false,
          },
        ],
      },
      200
    );

    expect(result).toEqual(
      expect.objectContaining({
        provider: 'mtn-csp',
        method: 'feasibilityCheck',
        capacityMbps: 200,
        orderable: false,
        status: 'not_orderable',
      })
    );
  });

  it('marks malformed CSP responses as unknown without leaking raw data', () => {
    const result = normalizeCspFeasibilityResponse({ outputs: [] }, 50);

    expect(result.orderable).toBeNull();
    expect(result.status).toBe('unknown');
    expect(result).not.toHaveProperty('raw');
  });
});
