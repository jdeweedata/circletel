import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('../../client', () => ({
  inngest: {
    createFunction: jest.fn((config, handler) => ({ ...config, handler })),
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/usage-reports/storage', () => ({
  deleteReportArtifact: jest.fn().mockResolvedValue(undefined),
}));

import { deleteReportArtifact } from '@/lib/usage-reports/storage';
import {
  purgeExpiredReportArtifacts,
  siteUsageReportPurgeFunction,
} from '../site-usage-report-purge';

describe('site usage report purge', () => {
  it('deletes expired artifacts and retains their audit rows', async () => {
    const rows = [
      { id: 'job-1', storage_path: 'jobs/job-1/report.zip' },
      { id: 'job-2', storage_path: 'jobs/job-2/report.pdf' },
    ];
    const not = jest.fn().mockResolvedValue({ data: rows, error: null });
    const lt = jest.fn().mockReturnValue({ not });
    const select = jest.fn().mockReturnValue({ lt });
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select, update });
    const supabase = { from } as unknown as SupabaseClient;
    const now = '2026-08-01T03:15:00.000Z';

    const purged = await purgeExpiredReportArtifacts(supabase, now);

    expect(select).toHaveBeenCalledWith('id, storage_path');
    expect(lt).toHaveBeenCalledWith('expires_at', now);
    expect(not).toHaveBeenCalledWith('storage_path', 'is', null);
    expect(deleteReportArtifact).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenNthCalledWith(1, {
      storage_path: null,
      updated_at: now,
    });
    expect(eq).toHaveBeenNthCalledWith(1, 'id', 'job-1');
    expect(eq).toHaveBeenNthCalledWith(2, 'id', 'job-2');
    expect(purged).toBe(2);
  });

  it('uses the required daily cron schedule', () => {
    expect(siteUsageReportPurgeFunction.triggers).toEqual({
      cron: '15 3 * * *',
    });
  });
});
