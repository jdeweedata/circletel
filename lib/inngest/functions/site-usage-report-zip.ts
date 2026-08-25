import { inngest } from '@/lib/inngest/client';
import { displayDateRange } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { buildUsageReportArtifact } from '@/lib/usage-reports/artifacts';
import { fetchInclusionSiteRows } from '@/lib/usage-reports/inclusion';
import type { TdxPatientRow } from '@/lib/usage-reports/patient-wifi';
import type { ReportPeriod, ReportPeriodPreset } from '@/lib/usage-reports/types';
import { uploadReportArtifact } from '@/lib/usage-reports/storage';

interface UsageReportJobRow {
  id: string;
  created_at: string;
  period_preset: ReportPeriodPreset;
  period_start: string;
  period_end: string;
  site_ids: string[];
  include_csv: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

function sastIso(date: Date): string {
  return new Date(date.getTime() + SAST_OFFSET_MS)
    .toISOString()
    .replace('Z', '+02:00');
}

function hydratePeriod(job: UsageReportJobRow): ReportPeriod {
  const startUtc = new Date(job.period_start);
  const endUtc = new Date(job.period_end);
  const startIso = sastIso(startUtc);
  const endIso = sastIso(endUtc);
  const startDate = new Date(`${startIso.slice(0, 10)}T00:00:00Z`);
  const endDate = new Date(`${endIso.slice(0, 10)}T00:00:00Z`);
  const inclusiveDayCount = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
  const labels: Record<ReportPeriodPreset, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    sixty_day: 'Last 60 days',
    custom: 'Custom period',
  };

  return {
    preset: job.period_preset,
    timezone: 'Africa/Johannesburg',
    startIso,
    endIso,
    startUtc,
    endUtc,
    label: labels[job.period_preset],
    rangeLabel: displayDateRange(new Date(startIso), new Date(endIso)),
    inclusiveDayCount,
    isShortPeriod: inclusiveDayCount <= 7,
  };
}

export const siteUsageReportZipFunction = inngest.createFunction(
  {
    id: 'site-usage-report-zip',
    name: 'Site Usage Report ZIP',
    retries: 2,
    concurrency: { limit: 2 },
    triggers: { event: 'usage-reports/zip.requested' },
  },
  async ({ event, step }) => {
    const jobId = event.data.jobId as string;
    const patientRows = (event.data.patientRows ?? []) as TdxPatientRow[];

    try {
      const job = await step.run('mark-running', async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('site_usage_report_jobs')
          .select(
            'id,created_at,period_preset,period_start,period_end,site_ids,include_csv'
          )
          .eq('id', jobId)
          .single();
        if (error || !data) {
          throw new Error(`Failed to load report job: ${error?.message ?? 'Not found'}`);
        }
        const { error: updateError } = await supabase
          .from('site_usage_report_jobs')
          .update({
            status: 'running',
            outcome: { progress: 10 },
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
        if (updateError) {
          throw new Error(`Failed to mark report job running: ${updateError.message}`);
        }
        return data as UsageReportJobRow;
      });

      const artifact = await step.run('build-and-upload-zip', async () => {
        const supabase = await createClient();
        const rows = await fetchInclusionSiteRows(supabase);
        const rowsById = new Map(rows.map((row) => [row.id, row]));
        const built = await buildUsageReportArtifact({
          sites: job.site_ids.map((id) => ({
            id,
            accountNumber: rowsById.get(id)?.account_number ?? id,
          })),
          period: hydratePeriod(job),
          patientRows,
          includeCsv: job.include_csv,
        });
        const storagePath = await uploadReportArtifact(
          supabase,
          `jobs/${job.id}/${built.filename}`,
          built.bytes,
          built.contentType
        );
        return {
          storagePath,
          contentType: built.contentType,
          byteSize: built.bytes.length,
          primarySources: built.primarySources,
          outcome: built.outcome,
          filename: built.filename,
        };
      });

      await step.run('mark-succeeded', async () => {
        const supabase = await createClient();
        const { error } = await supabase
          .from('site_usage_report_jobs')
          .update({
            status: 'succeeded',
            storage_path: artifact.storagePath,
            content_type: artifact.contentType,
            byte_size: artifact.byteSize,
            primary_sources: artifact.primarySources,
            outcome: { ...artifact.outcome, progress: 100 },
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
        if (error) throw new Error(`Failed to complete report job: ${error.message}`);
      });

      return {
        jobId,
        storagePath: artifact.storagePath,
        filename: artifact.filename,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await step.run('mark-failed', async () => {
        const supabase = await createClient();
        await supabase
          .from('site_usage_report_jobs')
          .update({
            status: 'failed',
            error_message: message,
            outcome: { progress: 100 },
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      });
      throw error;
    }
  }
);
