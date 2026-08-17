import { listUnjaniCoverageFeed } from '@/lib/portal/unjani-coverage-feed';

function thenable(result: { data: unknown; error?: unknown | null }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const method of ['select', 'eq', 'in', 'order', 'not', 'is']) {
    api[method] = self;
  }
  api.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return api;
}

describe('listUnjaniCoverageFeed', () => {
  it('includes deriveStage keys so admin Process install order can follow onboarding', async () => {
    const db = {
      from: (table: string) => {
        if (table === 'b2b_coverage_checks') {
          return thenable({
            data: [
              {
                id: 'chk-suurman',
                clinic_name: 'Suurman',
                address: 'Suurman Village',
                latitude: -25.39,
                longitude: 28.21,
                results: { nominated: true, tarana: { feasible: true } },
                created_at: '2026-08-16T00:00:00.000Z',
              },
            ],
            error: null,
          });
        }
        if (table === 'corporate_sites') {
          return thenable({ data: [], error: null });
        }
        if (table === 'customers') {
          return thenable({
            data: [
              {
                id: 'cust-lens',
                business_name: 'Unjani Clinic - Lens',
                corporate_site_id: null,
              },
            ],
            error: null,
          });
        }
        if (table === 'onboarding_submissions') {
          return thenable({ data: [], error: null });
        }
        if (table === 'onboarding_tokens') {
          return thenable({
            data: [{ customer_id: 'cust-lens', sent_at: '2026-08-16T08:00:00.000Z' }],
            error: null,
          });
        }
        return thenable({ data: [], error: null });
      },
    };

    const payload = await listUnjaniCoverageFeed(db, 'org-unj');

    expect(payload.stageByClinicKey).toEqual({
      suurman: 'nominated',
      lens: 'introduced',
    });
  });
});
