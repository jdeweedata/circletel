/**
 * PROTOTYPE (#667) — generate a sample branded Unjani Site Network Usage Report PDF.
 *
 * Mirrors Variant A (classic document) for human reaction on the ticket.
 *
 * Usage: npx tsx scripts/prototype-site-usage-report-pdf.ts
 * Output: docs/prototypes/2026-07-31-site-usage-report-unjani-alexandra.pdf
 */
import fs from 'node:fs';
import path from 'node:path';
import jsPDF from 'jspdf';
import { circleTelLogoBase64 } from '../lib/quotes/circletel-logo-base64';

const ORANGE = '#F5831F';
const DARK = '#1F2937';
const GRAY = '#6B7280';
const LIGHT = '#E5E7EB';

const OUT = path.join(
  process.cwd(),
  'docs/prototypes/2026-07-31-site-usage-report-unjani-alexandra.pdf'
);

function main() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;

  try {
    doc.addImage(circleTelLogoBase64, 'PNG', 14, y, 22, 22);
  } catch {
    // logo optional in prototype
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(DARK);
  doc.text('Site Network Usage Report', pageW - 14, y + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(GRAY);
  doc.text('Generated 2026-07-31T15:28:00+02:00', pageW - 14, y + 14, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(ORANGE);
  doc.text('PROTOTYPE — sample layout (Variant A)', pageW - 14, y + 19, { align: 'right' });

  y = 40;
  doc.setDrawColor(ORANGE);
  doc.setLineWidth(0.8);
  doc.line(14, y, pageW - 14, y);

  y = 48;
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Unjani Clinic — Alexandra', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(GRAY);
  doc.text('CT-UNJ-002 · Unjani Clinics NPC', 14, y + 5);
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('June 2026 (calendar month)', pageW - 14, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY);
  doc.text('2026-06-01 → 2026-06-30 (Africa/Johannesburg)', pageW - 14, y + 5, {
    align: 'right',
  });

  y = 62;
  const kpis = [
    ['Downloaded', '142.6 GB'],
    ['Uploaded', '18.4 GB'],
    ['Avg DL', '448.2 Kbps'],
    ['Peak bucket', '980.4 MB'],
  ];
  const colW = (pageW - 28) / 4;
  kpis.forEach(([label, value], i) => {
    const x = 14 + i * colW;
    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(DARK);
    doc.text(value, x, y + 6);
    doc.setFont('helvetica', 'normal');
  });

  y = 78;
  doc.setDrawColor(LIGHT);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageW - 14, y);

  y = 86;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(DARK);
  doc.text('Core site traffic', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text('Primary: Interstellio BNG (PPPoE)', pageW - 14, y, { align: 'right' });
  y += 5;
  doc.text('Site-level BNG aggregate for the period. Not SSID-split.', 14, y);

  // Simple bar chart placeholder
  y += 8;
  const days = [
    3.2, 4.1, 5.8, 4.4, 6.2, 2.1, 1.8, 5.5, 6.0, 5.1, 4.8, 5.9, 2.0, 1.5, 6.4, 7.1, 5.3, 4.9,
    5.6, 2.2, 1.9, 6.8, 7.4, 5.0, 4.7, 5.2, 2.3, 1.6, 6.1, 5.8,
  ];
  const max = Math.max(...days);
  const chartH = 28;
  const chartW = pageW - 28;
  const barW = chartW / days.length;
  doc.setFillColor(249, 250, 251);
  doc.rect(14, y, chartW, chartH, 'F');
  doc.setDrawColor(LIGHT);
  doc.rect(14, y, chartW, chartH, 'S');
  days.forEach((v, i) => {
    const h = Math.max(1.5, (v / max) * (chartH - 2));
    doc.setFillColor(245, 131, 31);
    doc.rect(14 + i * barW + 0.3, y + chartH - h - 1, barW - 0.6, h, 'F');
  });
  y += chartH + 4;
  doc.setFontSize(7);
  doc.setTextColor('#9CA3AF');
  doc.text('Daily download (GB) — placeholder series', 14, y);

  y += 8;
  doc.setFillColor(249, 250, 251);
  doc.rect(14, y, pageW - 28, 12, 'F');
  doc.setFontSize(8);
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Device identity', 16, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY);
  doc.text('UNJANIALEX2 · RAP2200(F) · SN G1U52HL00261B · Group Unjani · Online', 16, y + 9);

  y += 20;
  const boxW = (pageW - 28 - 4) / 2;
  // Staff
  doc.setDrawColor('#D1D5DB');
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(14, y, boxW, 52, 'S');
  doc.setLineDashPattern([], 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DARK);
  doc.text('Staff Wi-Fi', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#B45309');
  doc.text('Not available — instrumentation pending', 18, y + 13, { maxWidth: boxW - 8 });
  doc.setTextColor(GRAY);
  doc.setFontSize(8);
  doc.text('SSID: Unjani Clinic Staff', 18, y + 22);
  doc.text('Unlock: link APs · STA SSID byte rollups · allow-list SSIDs', 18, y + 28, {
    maxWidth: boxW - 8,
  });
  doc.setFontSize(7);
  doc.setTextColor('#9CA3AF');
  doc.text('Source: CircleTel radio — not available for this period.', 18, y + 42, {
    maxWidth: boxW - 8,
  });

  // Patient
  const px = 14 + boxW + 4;
  doc.setDrawColor(LIGHT);
  doc.rect(px, y, boxW, 52, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DARK);
  doc.text('Patient Free Wi-Fi', px + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(DARK);
  doc.text('Unique users: 1,842', px + 4, y + 14);
  doc.text('Login sessions: 6,210', px + 4, y + 20);
  doc.text('Download: 96.3 GB', px + 4, y + 26);
  doc.setFontSize(7);
  doc.setTextColor('#9CA3AF');
  doc.text(
    'Source: TDX/ThinkWiFi (manual export) · June 2026 · aggregate/anonymised · may be revised by TDX · do not sum with Staff or BNG totals.',
    px + 4,
    y + 34,
    { maxWidth: boxW - 8 }
  );

  y = 280;
  doc.setFontSize(7);
  doc.setTextColor('#9CA3AF');
  doc.text(
    'CircleTel · Admin Site Network Usage Report · CT-UNJ-002 · Do not sum Patient + Staff + BNG · Page 1 of 1',
    pageW / 2,
    y,
    { align: 'center' }
  );

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(doc.output('arraybuffer')));
  console.log(`Wrote ${OUT}`);
}

main();
