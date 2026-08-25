'use client';

/**
 * Download dropdown for the device detail header — exports the device dossier
 * (summary, current traffic window, clients, logs) as PDF or Excel via
 * /api/ruijie/devices/[sn]/export.
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

interface DeviceExportMenuProps {
  sn: string;
  /** Traffic window the report covers — follows the Traffic tab's selection. */
  hours: number;
}

export function DeviceExportMenu({ sn, hours }: DeviceExportMenuProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    setDownloading(format);
    try {
      const response = await fetch(
        `/api/ruijie/devices/${encodeURIComponent(sn)}/export?hours=${hours}&format=${format}`,
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
        `CircleTel_Device_${sn}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to download ${format.toUpperCase()} report`
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={downloading !== null}>
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
          onClick={() => handleDownload('pdf')}
          disabled={downloading !== null}
        >
          <PiFilePdfBold className="mr-2 h-4 w-4" aria-hidden="true" />
          PDF report
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDownload('excel')}
          disabled={downloading !== null}
        >
          <PiFileXlsBold className="mr-2 h-4 w-4" aria-hidden="true" />
          Excel workbook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
