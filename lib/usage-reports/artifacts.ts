import JSZip from 'jszip';

import {
  assembleSiteUsageReport,
  type AssembleResult,
  type AssembleSiteUsageReportInput,
} from './assemble-report';
import { reportModelToCsv } from './csv';
import { generateSiteUsageReportExcel } from './excel';
import { patientRowForSite, type TdxPatientRow } from './patient-wifi';
import {
  generateSiteUsageReportPdf,
  generateSkipSlipPdf,
  type SkipSlipInput,
} from './pdf-generator';
import type {
  AssembleSkipReason,
  ReportPeriod,
  SiteUsageReportModel,
} from './types';

export interface UsageReportArtifactSite {
  id: string;
  accountNumber: string;
}

export type UsageReportFormat = 'pdf' | 'excel';

export const EXCEL_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface UsageReportArtifactInput {
  sites: UsageReportArtifactSite[];
  period: ReportPeriod;
  patientRows: TdxPatientRow[];
  includeCsv: boolean;
  /** Report file format — skip slips stay PDF in either case. Default 'pdf'. */
  format?: UsageReportFormat;
}

export interface UsageReportArtifactDeps {
  assemble(input: AssembleSiteUsageReportInput): Promise<AssembleResult>;
  reportPdf(model: SiteUsageReportModel): ArrayBuffer;
  reportExcel(model: SiteUsageReportModel): Promise<Buffer>;
  skipPdf(input: SkipSlipInput): ArrayBuffer;
  csv(model: SiteUsageReportModel): string;
}

export interface UsageReportArtifact {
  bytes: Buffer;
  contentType: 'application/pdf' | 'application/zip' | typeof EXCEL_CONTENT_TYPE;
  filename: string;
  primarySources: Record<string, string>;
  outcome: {
    generated: string[];
    skipped: Array<{ siteId: string; reason: string }>;
  };
}

const defaultDeps: UsageReportArtifactDeps = {
  assemble: assembleSiteUsageReport,
  reportPdf: generateSiteUsageReportPdf,
  reportExcel: generateSiteUsageReportExcel,
  skipPdf: generateSkipSlipPdf,
  csv: reportModelToCsv,
};

function safeFilenamePart(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return sanitized || 'site';
}

function periodFilenamePart(period: ReportPeriod): string {
  return `${period.startIso.slice(0, 10)}_to_${period.endIso.slice(0, 10)}`;
}

function skipReason(reason: AssembleSkipReason): string {
  return reason === 'core_unavailable'
    ? 'Core traffic data was unavailable for the selected period.'
    : 'The site is not eligible for usage reporting.';
}

export async function buildUsageReportArtifact(
  input: UsageReportArtifactInput,
  deps: UsageReportArtifactDeps = defaultDeps
): Promise<UsageReportArtifact> {
  const periodPart = periodFilenamePart(input.period);
  const generated: Array<{ siteId: string; filenameBase: string; model: SiteUsageReportModel }> = [];
  const skipped: Array<{
    siteId: string;
    filenameBase: string;
    result: Extract<AssembleResult, { ok: false }>;
  }> = [];

  for (const site of input.sites) {
    const result = await deps.assemble({
      siteId: site.id,
      period: input.period,
      patientRow: patientRowForSite(input.patientRows, site.accountNumber),
    });

    if (result.ok) {
      generated.push({
        siteId: site.id,
        filenameBase: safeFilenamePart(result.model.site.accountNumber || result.model.site.name),
        model: result.model,
      });
    } else {
      skipped.push({
        siteId: site.id,
        filenameBase: safeFilenamePart(result.siteLabel),
        result,
      });
    }
  }

  const outcome = {
    generated: generated.map(({ siteId }) => siteId),
    skipped: skipped.map(({ siteId, result }) => ({ siteId, reason: result.reason })),
  };
  const primarySources = Object.fromEntries(
    generated.map(({ siteId, model }) => [siteId, model.core.source])
  );

  const format: UsageReportFormat = input.format ?? 'pdf';

  if (generated.length === 1 && skipped.length === 0 && !input.includeCsv) {
    const report = generated[0];
    if (format === 'excel') {
      return {
        bytes: await deps.reportExcel(report.model),
        contentType: EXCEL_CONTENT_TYPE,
        filename: `CircleTel_Usage_${report.filenameBase}_${periodPart}.xlsx`,
        primarySources,
        outcome,
      };
    }
    return {
      bytes: Buffer.from(deps.reportPdf(report.model)),
      contentType: 'application/pdf',
      filename: `CircleTel_Usage_${report.filenameBase}_${periodPart}.pdf`,
      primarySources,
      outcome,
    };
  }

  const zip = new JSZip();
  for (const report of generated) {
    const base = `CircleTel_Usage_${report.filenameBase}_${periodPart}`;
    if (format === 'excel') {
      zip.file(`${base}.xlsx`, await deps.reportExcel(report.model));
    } else {
      zip.file(`${base}.pdf`, Buffer.from(deps.reportPdf(report.model)));
    }
    if (input.includeCsv) {
      zip.file(`${base}.csv`, deps.csv(report.model));
    }
  }
  for (const skip of skipped) {
    zip.file(
      `CircleTel_Usage_${skip.filenameBase}_${periodPart}_SKIPPED.pdf`,
      Buffer.from(
        deps.skipPdf({
          siteLabel: skip.result.siteLabel,
          periodLabel: input.period.rangeLabel,
          reason: skipReason(skip.result.reason),
          generatedAtIso: new Date().toISOString(),
        })
      )
    );
  }

  return {
    bytes: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    contentType: 'application/zip',
    filename: `CircleTel_Usage_${periodPart}.zip`,
    primarySources,
    outcome,
  };
}
