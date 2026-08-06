'use client';

import { useEffect, useState } from 'react';
import {
  PiClockBold,
  PiDownloadSimpleBold,
  PiFileTextBold,
  PiSpinnerGapBold,
} from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TdxPatientRow } from '@/lib/usage-reports/patient-wifi';
import type { ReportPeriodPreset } from '@/lib/usage-reports/types';

import { JobProgress } from './JobProgress';
import {
  PeriodPicker,
  type CustomPeriodValue,
} from './PeriodPicker';
import {
  SiteMultiSelect,
  type UsageReportSite,
} from './SiteMultiSelect';

interface UsageReportBuilderProps {
  initialSiteId?: string;
  initialUnjaniOnly?: boolean;
}

interface SitesResponse {
  sites?: UsageReportSite[];
  error?: string;
}

function filenameFromDisposition(value: string | null): string {
  const encodedMatch = value?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) return decodeURIComponent(encodedMatch[1]);
  const match = value?.match(/filename="([^"]+)"/i);
  return match?.[1] || `CircleTel_Usage_Reports_${new Date().toISOString().slice(0, 10)}.zip`;
}

async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

function downloadResponseBlob(response: Response, blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filenameFromDisposition(response.headers.get('content-disposition'));
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export function UsageReportBuilder({
  initialSiteId,
  initialUnjaniOnly = false,
}: UsageReportBuilderProps) {
  const [period, setPeriod] = useState<ReportPeriodPreset>('monthly');
  const [custom, setCustom] = useState<CustomPeriodValue>({
    startDate: '',
    endDate: '',
  });
  const [includeProvisioned, setIncludeProvisioned] = useState(true);
  const [unjaniOnly, setUnjaniOnly] = useState(initialUnjaniOnly);
  const [includeCsv, setIncludeCsv] = useState(false);
  const [sites, setSites] = useState<UsageReportSite[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSiteId ? [initialSiteId] : []
  );
  const [sitesLoading, setSitesLoading] = useState(true);
  const [patientRows, setPatientRows] = useState<TdxPatientRow[]>([]);
  const [patientFilename, setPatientFilename] = useState<string | null>(null);
  const [uploadingPatientCsv, setUploadingPatientCsv] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSites = async () => {
      setSitesLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (includeProvisioned) params.set('includeProvisioned', '1');
        if (unjaniOnly) params.set('unjaniOnly', '1');
        const response = await fetch(
          `/api/admin/network/usage-reports/sites?${params.toString()}`,
          {
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
          }
        );
        const data = (await response.json()) as SitesResponse;
        if (!response.ok) throw new Error(data.error || 'Failed to load eligible sites');

        const nextSites = data.sites ?? [];
        const eligibleIds = new Set(nextSites.map((site) => site.id));
        setSites(nextSites);
        setSelectedIds((current) => current.filter((id) => eligibleIds.has(id)));
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setSites([]);
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load eligible sites'
        );
      } finally {
        if (!controller.signal.aborted) setSitesLoading(false);
      }
    };

    void loadSites();
    return () => controller.abort();
  }, [includeProvisioned, unjaniOnly]);

  const handlePatientCsv = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPatientCsv(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const response = await fetch('/api/admin/network/usage-reports/patient-csv', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = (await response.json()) as {
        rows?: TdxPatientRow[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || 'Failed to parse patient CSV');
      setPatientRows(data.rows ?? []);
      setPatientFilename(file.name);
    } catch (uploadError) {
      setPatientRows([]);
      setPatientFilename(null);
      setError(
        uploadError instanceof Error ? uploadError.message : 'Failed to parse patient CSV'
      );
    } finally {
      setUploadingPatientCsv(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one site.');
      return;
    }
    if (period === 'custom' && (!custom.startDate || !custom.endDate)) {
      setError('Choose both a start and end date for the custom period.');
      return;
    }
    if (period === 'custom' && custom.endDate < custom.startDate) {
      setError('The custom end date must be on or after the start date.');
      return;
    }

    setSubmitting(true);
    setJobId(null);
    setError(null);
    const payload = {
      siteIds: selectedIds,
      period,
      custom: period === 'custom' ? custom : undefined,
      includeCsv,
      patientRows: unjaniOnly ? patientRows : [],
    };

    try {
      if (selectedIds.length <= 5) {
        const response = await fetch('/api/admin/network/usage-reports/generate', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(await responseError(response, 'Failed to generate usage report'));
        }
        downloadResponseBlob(response, await response.blob());
      } else {
        const response = await fetch('/api/admin/network/usage-reports/jobs', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { jobId?: string; error?: string };
        if (!response.ok || !data.jobId) {
          throw new Error(data.error || 'Failed to queue usage report job');
        }
        setJobId(data.jobId);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to generate usage report'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (jobId) {
    return <JobProgress jobId={jobId} onReset={() => setJobId(null)} />;
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PiFileTextBold className="h-5 w-5 text-orange-600" />
            Report options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PeriodPicker
            value={period}
            custom={custom}
            onChange={setPeriod}
            onCustomChange={setCustom}
          />

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="include-provisioned"
                checked={includeProvisioned}
                onCheckedChange={(checked) => setIncludeProvisioned(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="include-provisioned" className="cursor-pointer font-normal">
                <span className="block text-sm font-medium text-slate-900">
                  Include provisioned sites
                </span>
                <span className="block text-xs text-slate-500">
                  Include sites not yet marked active.
                </span>
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="unjani-only"
                checked={unjaniOnly}
                onCheckedChange={(checked) => setUnjaniOnly(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="unjani-only" className="cursor-pointer font-normal">
                <span className="block text-sm font-medium text-slate-900">
                  Unjani sites only
                </span>
                <span className="block text-xs text-slate-500">
                  Enables Staff + Free Clinic SSID sections (optional TDX CSV for users/sessions).
                </span>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Choose sites</CardTitle>
        </CardHeader>
        <CardContent>
          <SiteMultiSelect
            sites={sites}
            selectedIds={selectedIds}
            loading={sitesLoading}
            onChange={setSelectedIds}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Files and output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {unjaniOnly && (
            <div className="space-y-2">
              <Label htmlFor="patient-csv">TDX Patient Wi-Fi CSV (optional)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  id="patient-csv"
                  type="file"
                  accept=".csv,text/csv"
                  disabled={uploadingPatientCsv}
                  onChange={(event) => void handlePatientCsv(event.target.files?.[0])}
                  className="max-w-md"
                />
                {uploadingPatientCsv && (
                  <PiSpinnerGapBold className="h-5 w-5 animate-spin text-orange-600" />
                )}
              </div>
              {patientFilename && (
                <p className="text-xs text-emerald-700">
                  {patientFilename}: {patientRows.length} patient usage rows ready.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Checkbox
              id="include-csv"
              checked={includeCsv}
              onCheckedChange={(checked) => setIncludeCsv(checked === true)}
            />
            <Label htmlFor="include-csv" className="cursor-pointer text-sm font-medium text-slate-900">
              Include CSV companion
            </Label>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={
                submitting ||
                sitesLoading ||
                uploadingPatientCsv ||
                selectedIds.length === 0
              }
            >
              {submitting ? (
                <PiSpinnerGapBold className="mr-2 h-4 w-4 animate-spin" />
              ) : selectedIds.length <= 5 ? (
                <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
              ) : (
                <PiClockBold className="mr-2 h-4 w-4" />
              )}
              {submitting
                ? 'Generating…'
                : selectedIds.length > 5
                  ? 'Queue ZIP report'
                  : 'Generate report'}
            </Button>
            <p className="text-xs text-slate-500">
              {selectedIds.length > 5
                ? 'Bulk reports run in the background and download as a ZIP.'
                : 'Up to five selected sites generate immediately.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
