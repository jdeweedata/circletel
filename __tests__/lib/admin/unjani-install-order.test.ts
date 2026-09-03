import { recommendedAccess } from '@/lib/portal/coverage-summary';
import {
  adminInstallOrderPrompt,
  canPlaceInstallOrder,
  canProcessInstallOrder,
} from '@/lib/admin/unjani-warehouse';
import { coverageExplorerConfig } from '@/lib/portal/coverage-explorer-config';
import type { StageKey } from '@/lib/portal/onboarding-stage';
import { installOrderStageForClinic, placeUnjaniInstallOrder } from '@/lib/admin/unjani-install-orders';

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

describe('canProcessInstallOrder', () => {
  const feasible = { tarana: { feasible: true } };
  const allowed: StageKey[] = [
    'details_confirmed',
    'changes_requested',
    'visit_booked',
    'installing',
  ];

  it('rejects feasible coverage that is still awaiting Unjani NPC', () => {
    expect(canProcessInstallOrder({ results: feasible, stage: 'nominated' })).toBe(false);
    expect(canProcessInstallOrder({ results: feasible, stage: undefined })).toBe(false);
    expect(canProcessInstallOrder({ results: feasible, stage: null })).toBe(false);
  });

  it('rejects a live clinic even when coverage is feasible', () => {
    expect(canProcessInstallOrder({ results: feasible, stage: 'live' })).toBe(false);
  });

  it('rejects infeasible coverage even after NPC confirmation', () => {
    expect(
      canProcessInstallOrder({
        results: { tarana: { feasible: false } },
        stage: 'details_confirmed',
      })
    ).toBe(false);
  });

  it('allows Process install order only after clinic details are confirmed', () => {
    expect(canProcessInstallOrder({ results: feasible, stage: 'introduced' })).toBe(false);
    for (const stage of allowed) {
      expect(canProcessInstallOrder({ results: feasible, stage })).toBe(true);
    }
  });

  it('tells admin to wait for Unjani NPC when coverage is feasible but still nominated', () => {
    expect(adminInstallOrderPrompt({ results: feasible, stage: 'nominated' })).toBe('await_npc');
    expect(adminInstallOrderPrompt({ results: feasible, stage: undefined })).toBe('await_npc');
    expect(adminInstallOrderPrompt({ results: feasible, stage: 'introduced' })).toBe('await_npc');
  });

  it('unlocks the Process install order prompt after clinic details are confirmed', () => {
    expect(adminInstallOrderPrompt({ results: feasible, stage: 'details_confirmed' })).toBe(
      'process'
    );
  });
});

describe('installOrderStageForClinic', () => {
  it('treats a coverage-check-only clinic as not yet confirmed', () => {
    expect(installOrderStageForClinic({})).toBeNull();
  });

  it('stays nominated until an intro link has been sent', () => {
    expect(
      installOrderStageForClinic({
        customer: { id: 'cust-1' },
        site: { status: 'pending', installed_at: null },
      })
    ).toBe('nominated');
  });

  it('moves to introduced once the onboarding link is sent', () => {
    expect(
      installOrderStageForClinic({
        customer: { id: 'cust-1' },
        onboardingLinkSent: true,
      })
    ).toBe('introduced');
  });
});

function thenable(result: { data: unknown; error?: unknown | null }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const method of ['select', 'eq', 'in', 'order', 'limit', 'insert', 'update', 'is', 'not']) {
    api[method] = self;
  }
  api.single = async () => result;
  api.maybeSingle = async () => result;
  api.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return api;
}

describe('placeUnjaniInstallOrder NPC gate', () => {
  const check = {
    id: 'chk-1',
    organisation_id: 'org-unj',
    clinic_name: 'Suurman',
    address: 'Suurman Village',
    latitude: -25.39,
    longitude: 28.21,
    results: { tarana: { feasible: true } },
  };

  it('rejects a feasible clinic that Unjani NPC has not confirmed', async () => {
    const db = {
      from: (table: string) => {
        if (table === 'b2b_coverage_checks') {
          return thenable({ data: check, error: null });
        }
        if (table === 'unjani_install_orders') {
          return thenable({ data: null, error: null });
        }
        if (table === 'customers') {
          return thenable({ data: [], error: null });
        }
        if (table === 'corporate_sites') {
          return thenable({ data: [], error: null });
        }
        return thenable({ data: [], error: null });
      },
    };

    await expect(
      placeUnjaniInstallOrder(db, {
        organisationId: 'org-unj',
        coverageCheckId: 'chk-1',
        clinicName: 'Suurman',
        address: 'Suurman Village',
      })
    ).rejects.toThrow(
      'Process install order after Unjani NPC confirms clinic details and coverage.'
    );
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
    expect(admin.formHelp).toMatch(/Unjani NPC/i);
  });
});
