import { NextRequest, NextResponse } from 'next/server';

import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { signedReportUrl } from '@/lib/usage-reports/storage';

interface ReportJobRow {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  outcome: { progress?: number } | null;
  error_message: string | null;
  storage_path: string | null;
  content_type: string | null;
  byte_size: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_usage_report_jobs')
      .select(
        'id,status,outcome,error_message,storage_path,content_type,byte_size,expires_at,created_at,updated_at'
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Report job not found' }, { status: 404 });
    }

    const job = data as ReportJobRow;
    const downloadUrl =
      job.status === 'succeeded' && job.storage_path
        ? await signedReportUrl(supabase, job.storage_path)
        : undefined;
    const fallbackProgress = {
      queued: 0,
      running: 25,
      succeeded: 100,
      failed: 100,
    }[job.status];

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.outcome?.progress ?? fallbackProgress,
      downloadUrl,
      error: job.error_message ?? undefined,
      contentType: job.content_type,
      byteSize: job.byte_size,
      expiresAt: job.expires_at,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    });
  } catch (error) {
    console.error('[UsageReportsJob] Failed to load job:', error);
    return NextResponse.json({ error: 'Failed to load report job' }, { status: 500 });
  }
}
