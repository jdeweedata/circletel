import { bytesToGb } from './bytes';
import type { SiteUsageReportModel } from './types';

const HEADERS = [
  'site',
  'period',
  'core source',
  'download GB',
  'upload GB',
  'staff total GB',
  'staff download GB',
  'staff upload GB',
  'staff N/A reason',
  'patient users',
  'patient sessions',
  'patient download GB',
  'patient status',
];

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function gb(value: number): string {
  return bytesToGb(value).toFixed(2);
}

export function reportModelToCsv(model: SiteUsageReportModel): string {
  const staff = model.staff.kind === 'available'
    ? [gb(model.staff.totalBytes), gb(model.staff.rxBytes), gb(model.staff.txBytes), '']
    : [
        '',
        '',
        '',
        model.staff.kind === 'no_samples'
          ? 'Not available — no Staff Wi-Fi samples in this period'
          : 'Not available — AP not linked to site',
      ];

  const patient =
    model.patient.kind === 'available'
      ? [
          model.patient.uniqueUsers ?? '',
          model.patient.loginSessions ?? '',
          model.patient.downloadGb.toFixed(2),
          model.patient.source,
        ]
      : [
          '',
          '',
          '',
          model.patient.kind === 'ap_unlinked'
            ? 'Not available — AP not linked to site'
            : model.patient.kind === 'no_samples'
              ? 'Not available — no Free Clinic Wi-Fi samples in this period'
              : 'Awaiting TDX export',
        ];

  const row = [
    model.site.name,
    model.period.label,
    model.core.sourceLabel,
    gb(model.core.downloadBytes),
    gb(model.core.uploadBytes),
    ...staff,
    ...patient,
  ];

  return `${HEADERS.map(csvCell).join(',')}\r\n${row.map(csvCell).join(',')}\r\n`;
}
