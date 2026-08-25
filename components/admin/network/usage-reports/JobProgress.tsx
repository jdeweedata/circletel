'use client';

import { useEffect, useState } from 'react';
import {
  PiCheckCircleBold,
  PiDownloadSimpleBold,
  PiSpinnerGapBold,
  PiWarningCircleBold,
} from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface UsageReportJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

interface JobProgressProps {
  jobId: string;
  onReset: () => void;
}

export function JobProgress({ jobId, onReset }: JobProgressProps) {
  const [job, setJob] = useState<UsageReportJob | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/admin/network/usage-reports/jobs/${encodeURIComponent(jobId)}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const data = (await response.json()) as UsageReportJob & { error?: string };
        if (!response.ok) throw new Error(data.error || 'Failed to load report job');
        if (cancelled) return;

        setJob(data);
        setPollError(null);
        if (data.status === 'queued' || data.status === 'running') {
          timer = setTimeout(poll, 2_000);
        }
      } catch (error) {
        if (cancelled) return;
        setPollError(error instanceof Error ? error.message : 'Failed to load report job');
        timer = setTimeout(poll, 2_000);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  const status = job?.status ?? 'queued';
  const progress = Math.max(0, Math.min(100, job?.progress ?? 0));
  const isWorking = status === 'queued' || status === 'running';

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isWorking && <PiSpinnerGapBold className="h-5 w-5 animate-spin text-orange-600" />}
          {status === 'succeeded' && (
            <PiCheckCircleBold className="h-5 w-5 text-emerald-600" />
          )}
          {status === 'failed' && (
            <PiWarningCircleBold className="h-5 w-5 text-red-600" />
          )}
          {isWorking
            ? 'Preparing report archive'
            : status === 'succeeded'
              ? 'Report archive ready'
              : 'Report generation failed'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span className="capitalize">{status}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-100" />
        </div>

        {(pollError || job?.error) && (
          <p className="text-sm text-red-600">{pollError || job?.error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {status === 'succeeded' && job?.downloadUrl && (
            <Button asChild>
              <a href={job.downloadUrl}>
                <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
                Download ZIP
              </a>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onReset}>
            Create another report
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
