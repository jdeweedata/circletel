'use client';

/**
 * Usage Reports dashboard (#693) — Variant B "report-first" from #688.
 *
 * Page chrome follows /admin/network/analytics (breadcrumb, right-aligned
 * toolbar, source + freshness line, selectable cards); the canvas follows the
 * printed report. Preview is a pure read — the endpoint writes nothing — so
 * looking costs no audit row and no stored artifact (#690).
 *
 * Download uses the shipped generate/jobs routes; the button is a PDF/Excel
 * format dropdown (Excel is sync-path only — up to 5 sites). CSV retirement
 * and the Patient CSV rebind remain #694.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PiArrowClockwiseBold,
  PiCaretDownBold,
  PiClockBold,
  PiDownloadSimpleBold,
  PiFilePdfBold,
  PiFileXlsBold,
  PiSpinnerGapBold,
} from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { formatBytesAsGb } from '@/lib/usage-reports/bytes';
import type {
  CoreUnavailableDiagnosis,
  ReportPeriodPreset,
  SiteUsageReportModel,
} from '@/lib/usage-reports/types';

import { JobProgress } from '../JobProgress';
import type { UsageReportSite } from '../SiteMultiSelect';
import { NotAvailablePanel } from './NotAvailablePanel';
import { ReportDocument } from './ReportDocument';
import { SitePicker } from './SitePicker';

const PERIOD_LABELS: Record<ReportPeriodPreset, string> = {
  weekly: 'Last complete week',
  monthly: 'Previous month',
  sixty_day: 'Last 60 days',
  custom: 'Custom range',
};

type PreviewResult =
  | { ok: true; model: SiteUsageReportModel }
  | {
      ok: false;
      reason: 'core_unavailable' | 'site_not_eligible';
      siteLabel: string;
      diagnosis: CoreUnavailableDiagnosis | null;
      period: { label: string; rangeLabel: string };
    };

interface UsageReportDashboardProps {
  initialSiteId?: string;
  initialUnjaniOnly?: boolean;
}

export function UsageReportDashboard({
  initialSiteId,
  initialUnjaniOnly = false,
}: UsageReportDashboardProps) {
  const [period, setPeriod] = useState<ReportPeriodPreset>('monthly');
  const [includeProvisioned, setIncludeProvisioned] = useState(true);
  const [unjaniOnly, setUnjaniOnly] = useState(initialUnjaniOnly);

  const [sites, setSites] = useState<UsageReportSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSiteId ? [initialSiteId] : []
  );
  const [focusedId, setFocusedId] = useState<string | null>(initialSiteId ?? null);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  /**
   * Session cache per (site, period): re-focusing a site you have already
   * looked at is free. Long periods hit the Interstellio API per site, so
   * clicking back and forth would otherwise re-pay that every time.
   */
  const cache = useRef(new Map<string, { result: PreviewResult; at: string }>());

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
          { credentials: 'include', cache: 'no-store', signal: controller.signal }
        );
        const data = (await response.json()) as {
          sites?: UsageReportSite[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || 'Failed to load eligible sites');

        const next = data.sites ?? [];
        const eligible = new Set(next.map((site) => site.id));
        setSites(next);
        setSelectedIds((current) => current.filter((id) => eligible.has(id)));
        setFocusedId((current) => (current && eligible.has(current) ? current : null));
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

  const loadPreview = useCallback(
    async (siteId: string, { force = false } = {}) => {
      const key = `${siteId}:${period}`;
      const cached = cache.current.get(key);
      if (cached && !force) {
        setPreview(cached.result);
        setLoadedAt(cached.at);
        return;
      }

      setPreviewLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/network/usage-reports/preview', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId, period }),
        });
        const data = (await response.json()) as PreviewResult & { error?: string };
        if (!response.ok) throw new Error(data.error || 'Failed to load preview');

        const at = new Date().toLocaleTimeString('en-ZA', {
          hour: '2-digit',
          minute: '2-digit',
        });
        cache.current.set(key, { result: data, at });
        setPreview(data);
        setLoadedAt(at);
      } catch (previewError) {
        setPreview(null);
        setError(
          previewError instanceof Error ? previewError.message : 'Failed to load preview'
        );
      } finally {
        setPreviewLoading(false);
      }
    },
    [period]
  );

  // Focusing a site, or changing the period, reloads what is on screen.
  useEffect(() => {
    if (!focusedId) {
      setPreview(null);
      return;
    }
    void loadPreview(focusedId);
  }, [focusedId, loadPreview]);

  // A different period invalidates every cached model.
  useEffect(() => {
    cache.current.clear();
  }, [period]);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
    if (ids.length > 0 && (!focusedId || !ids.includes(focusedId))) {
      setFocusedId(ids[0]);
    }
    if (ids.length === 0) setFocusedId(null);
  };

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    setJobId(null);
    setError(null);

    const payload = {
      siteIds: selectedIds,
      period,
      includeCsv: false,
      patientRows: [],
      format,
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
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || 'Failed to generate usage report');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download =
          response.headers
            .get('content-disposition')
            ?.match(/filename="([^"]+)"/i)?.[1] ??
          `CircleTel_Usage_Report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
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
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Failed to generate usage report'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (jobId) {
    return <JobProgress jobId={jobId} onReset={() => setJobId(null)} />;
  }

  const selectedSites = sites.filter((site) => selectedIds.includes(site.id));
  const focusedSite = sites.find((site) => site.id === focusedId) ?? null;

  return (
    <div className="space-y-6">
      {/* Page chrome — Analytics grammar */}
      <div>
        <p className="text-xs text-slate-400">Activity / Infrastructure / Usage Reports</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Site Usage Reports</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Preview a site&apos;s report, then download it or the whole selection
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SitePicker
              sites={sites}
              selectedIds={selectedIds}
              loading={sitesLoading}
              onChange={handleSelectionChange}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 font-normal">
                  {PERIOD_LABELS[period]}
                  <PiCaretDownBold className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Report period (SAST)</DropdownMenuLabel>
                {(['weekly', 'monthly', 'sixty_day'] as const).map((preset) => (
                  <DropdownMenuCheckboxItem
                    key={preset}
                    checked={period === preset}
                    onCheckedChange={() => setPeriod(preset)}
                  >
                    {PERIOD_LABELS[preset]}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-normal text-xs text-slate-400">
                  Custom ranges: use the generate flow
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="gap-2 font-normal"
              disabled={!focusedId || previewLoading}
              onClick={() => focusedId && void loadPreview(focusedId, { force: true })}
            >
              {previewLoading ? (
                <PiSpinnerGapBold className="h-4 w-4 animate-spin" />
              ) : (
                <PiArrowClockwiseBold className="h-4 w-4" />
              )}
              Refresh
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={submitting || selectedIds.length === 0}>
                  {submitting ? (
                    <PiSpinnerGapBold className="mr-2 h-4 w-4 animate-spin" />
                  ) : selectedIds.length > 5 ? (
                    <PiClockBold className="mr-2 h-4 w-4" />
                  ) : (
                    <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
                  )}
                  {selectedIds.length > 5
                    ? `Queue ${selectedIds.length} (ZIP)`
                    : 'Download'}
                  <PiCaretDownBold className="ml-2 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => void handleDownload('pdf')}
                  disabled={submitting}
                >
                  <PiFilePdfBold className="mr-2 h-4 w-4" aria-hidden="true" />
                  PDF report
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleDownload('excel')}
                  disabled={submitting || selectedIds.length > 5}
                >
                  <PiFileXlsBold className="mr-2 h-4 w-4" aria-hidden="true" />
                  Excel workbook
                </DropdownMenuItem>
                {selectedIds.length > 5 && (
                  <DropdownMenuLabel className="font-normal text-xs text-slate-400">
                    Excel is available for up to 5 sites
                  </DropdownMenuLabel>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          {preview?.ok && (
            <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
              {preview.model.core.sourceLabel}
            </span>
          )}
          <span className="text-slate-400">
            {focusedSite ? focusedSite.name : 'No site selected'}
            {loadedAt && ` · loaded ${loadedAt}`}
          </span>
          <span className="ml-auto flex items-center gap-4">
            <label className="flex items-center gap-2 text-slate-600">
              <Checkbox
                id="include-provisioned"
                checked={includeProvisioned}
                onCheckedChange={(checked) => setIncludeProvisioned(checked === true)}
              />
              <Label htmlFor="include-provisioned" className="cursor-pointer font-normal">
                Include provisioned
              </Label>
            </label>
            <label className="flex items-center gap-2 text-slate-600">
              <Checkbox
                id="unjani-only"
                checked={unjaniOnly}
                onCheckedChange={(checked) => setUnjaniOnly(checked === true)}
              />
              <Label htmlFor="unjani-only" className="cursor-pointer font-normal">
                Unjani only
              </Label>
            </label>
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Selected sites — Analytics' Group Traffic card pattern */}
      {selectedSites.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Selected sites</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Click a site to preview its report — download acts on the whole selection
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {selectedSites.map((site) => {
              const isFocused = site.id === focusedId;
              const cached = cache.current.get(`${site.id}:${period}`)?.result;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setFocusedId(site.id)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    isFocused
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {site.name}
                  </span>
                  <span className="mt-1 block text-lg font-semibold text-slate-900">
                    {cached?.ok
                      ? formatBytesAsGb(cached.model.core.downloadBytes)
                      : cached
                        ? '—'
                        : '·'}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {cached?.ok
                      ? site.account_number
                      : cached
                        ? 'Not available'
                        : site.account_number}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* The document */}
      {!focusedId ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No site selected</p>
          <p className="mt-1 text-sm text-slate-500">
            Choose one or more sites to preview a report.
          </p>
        </div>
      ) : previewLoading && !preview ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <PiSpinnerGapBold className="mx-auto h-6 w-6 animate-spin text-orange-600" />
          <p className="mt-3 text-sm text-slate-500">Assembling report…</p>
        </div>
      ) : preview?.ok ? (
        <ReportDocument model={preview.model} />
      ) : preview ? (
        <NotAvailablePanel
          siteLabel={preview.siteLabel}
          periodLabel={preview.period.rangeLabel}
          reason={preview.reason}
          diagnosis={preview.diagnosis}
        />
      ) : null}
    </div>
  );
}
