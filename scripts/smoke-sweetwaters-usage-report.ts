/**
 * One-off smoke: assemble + PDF for Unjani Sweetwaters (CT-UNJ-020).
 * Usage:
 *   set -a && source /home/circletel/.env.local && set +a && \
 *     npx tsx scripts/smoke-sweetwaters-usage-report.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assembleSiteUsageReport } from '@/lib/usage-reports/assemble-report';
import { generateSiteUsageReportPdf, generateSkipSlipPdf } from '@/lib/usage-reports/pdf-generator';
import { resolveReportPeriod } from '@/lib/usage-reports/periods';
import { bytesToGb } from '@/lib/usage-reports/bytes';

const SWEETWATERS_ID = '2bcbdccf-f709-49bc-9078-e8a12d4046b3';

async function smoke(preset: 'weekly' | 'monthly') {
  const period = resolveReportPeriod(preset);
  console.log(`\n=== Sweetwaters ${preset} ===`);
  console.log(`Period: ${period.rangeLabel} (${period.inclusiveDayCount}d, short=${period.isShortPeriod})`);

  const result = await assembleSiteUsageReport({
    siteId: SWEETWATERS_ID,
    period,
    patientRow: null,
  });

  if (!result.ok) {
    console.log(`SKIP: ${result.reason} — ${result.siteLabel}`);
    const slip = generateSkipSlipPdf({
      siteLabel: result.siteLabel,
      periodLabel: `${period.label} · ${period.rangeLabel}`,
      reason:
        result.reason === 'core_unavailable'
          ? 'No usable Ruijie or Interstellio source for this period'
          : `Site not eligible (${result.reason})`,
      generatedAtIso: new Date().toISOString(),
    });
    const out = resolve(`/tmp/sweetwaters-usage-${preset}-skip.pdf`);
    writeFileSync(out, Buffer.from(slip));
    console.log(`Wrote skip slip: ${out} (${slip.byteLength} bytes)`);
    return { ok: false as const, reason: result.reason, out };
  }

  const m = result.model;
  console.log(`Site: ${m.site.name} (${m.site.accountNumber})`);
  console.log(`Core source: ${m.core.sourceLabel}`);
  console.log(
    `Core DL/UL: ${bytesToGb(m.core.downloadBytes)} / ${bytesToGb(m.core.uploadBytes)} GB`
  );
  console.log(`Device: ${m.device ? `${m.device.name} · ${m.device.serial}` : 'none'}`);
  console.log(`Staff: ${m.staff.kind}${m.staff.kind === 'available' ? ` ${bytesToGb(m.staff.totalBytes)} GB` : ''}`);
  console.log(`Patient: ${m.patient.kind}`);

  const pdf = generateSiteUsageReportPdf(m);
  const out = resolve(`/tmp/sweetwaters-usage-${preset}.pdf`);
  writeFileSync(out, Buffer.from(pdf));
  console.log(`Wrote PDF: ${out} (${pdf.byteLength} bytes, magic=${Buffer.from(pdf).subarray(0, 4).toString()})`);
  return { ok: true as const, out, source: m.core.source, staff: m.staff.kind };
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  const weekly = await smoke('weekly');
  const monthly = await smoke('monthly');
  console.log('\n=== Summary ===');
  console.log(JSON.stringify({ weekly, monthly }, null, 2));
  if (!weekly.ok && !monthly.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
