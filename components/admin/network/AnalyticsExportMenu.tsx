'use client';

/**
 * Download dropdown for Network Analytics — exports the current group/device
 * view as PDF or Excel via /api/admin/network/analytics/export.
 */

import { useState } from 'react';
import {
  PiCaretDownBold,
  PiDownloadSimpleBold,
  PiFilePdfBold,
  PiFileXlsBold,
  PiSpinnerGapBold,
} from 'react-icons/pi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface AnalyticsExportMenuProps {
  groupId: string;
  deviceSn: string | null;
  /** Preset hours string, or 'custom' when using start/end dates. */
  periodMode: string;
  customStart: string;
  customEnd: string;
  disabled?: boolean;
}

export function AnalyticsExportMenu({
  groupId,
  deviceSn,
  periodMode,
  customStart,
  customEnd,
  disabled,
}: AnalyticsExportMenuProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    setDownloading(format);
    try {
      const params = new URLSearchParams({ format });
      if (groupId) params.set('groupId', groupId);
      if (deviceSn) params.set('deviceSn', deviceSn);
      if (periodMode === 'custom') {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
        params.set('hours', '24');
      } else {
        params.set('hours', periodMode);
      }

      const response = await fetch(
        `/api/admin/network/analytics/export?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Export failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download =
        response.headers
          .get('content-disposition')
          ?.match(/filename="([^"]+)"/i)?.[1] ??
        `CircleTel_Analytics.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to download ${format.toUpperCase()} report`
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled || downloading !== null || !groupId}
        >
          {downloading ? (
            <PiSpinnerGapBold className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <PiDownloadSimpleBold className="w-4 h-4" aria-hidden="true" />
          )}
          Download
          <PiCaretDownBold className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => void handleDownload('pdf')}
          disabled={downloading !== null}
        >
          <PiFilePdfBold className="mr-2 h-4 w-4" aria-hidden="true" />
          PDF report
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleDownload('excel')}
          disabled={downloading !== null}
        >
          <PiFileXlsBold className="mr-2 h-4 w-4" aria-hidden="true" />
          Excel workbook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
