import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import { deleteReportArtifact } from '@/lib/usage-reports/storage';
import { inngest } from '../client';

interface ExpiredReportArtifact {
  id: string;
  storage_path: string;
}

export async function purgeExpiredReportArtifacts(
  supabase: SupabaseClient,
  nowIso = new Date().toISOString()
): Promise<number> {
  const { data, error } = await supabase
    .from('site_usage_report_jobs')
    .select('id, storage_path')
    .lt('expires_at', nowIso)
    .not('storage_path', 'is', null);

  if (error) {
    throw new Error(`Failed to load expired report artifacts: ${error.message}`);
  }

  const artifacts = (data ?? []) as ExpiredReportArtifact[];

  for (const artifact of artifacts) {
    await deleteReportArtifact(supabase, artifact.storage_path);

    const { error: updateError } = await supabase
      .from('site_usage_report_jobs')
      .update({
        storage_path: null,
        updated_at: nowIso,
      })
      .eq('id', artifact.id);

    if (updateError) {
      throw new Error(
        `Failed to retain purged report audit row ${artifact.id}: ${updateError.message}`
      );
    }
  }

  return artifacts.length;
}

export const siteUsageReportPurgeFunction = inngest.createFunction(
  {
    id: 'site-usage-report-purge',
    name: 'Site Usage Report Artifact Purge',
    retries: 2,
    triggers: { cron: '15 3 * * *' },
  },
  async ({ step }) => {
    const purgedCount = await step.run('purge-expired-report-artifacts', async () => {
      const supabase = await createClient();
      return purgeExpiredReportArtifacts(supabase);
    });

    return { purgedCount };
  }
);
