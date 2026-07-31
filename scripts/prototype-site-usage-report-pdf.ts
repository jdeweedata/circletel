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
const AMBER = '#B45309';
const AMBER_BG = [255, 251, 235] as const; // #FFFBEB

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
  doc.text('Generated 31 July 2026, 15:28 SAST', pageW - 14, y + 14, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(ORANGE);
  doc.text('PROTOTYPE — sample layout (Variant A)', pageW - 14, y + 19, { align: 'right' });

  y = 40;
  doc.setDrawColor(ORANGE);
  doc.setLineWidth(0.8);
  doc.line(14, y, pageW - 14, y);

  // Site + period block — stacked labels, human dates (no ISO strings)
  y = 48;
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('SITE', 14, y);
  doc.text('REPORT PERIOD', pageW - 14, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(DARK);
  doc.text('Unjani Clinic — Alexandra', 14, y);
  doc.text('June 2026', pageW - 14, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(GRAY);
  doc.text('CT-UNJ-002 · Unjani Clinics NPC', 14, y);
  doc.text('1 – 30 June 2026 · SAST', pageW - 14, y, { align: 'right' });

  y += 4.5;
  doc.setFontSize(8);
  doc.text('Last complete calendar month · Africa/Johannesburg', pageW - 14, y, {
    align: 'right',
  });

  y = 68;
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
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(DARK);
    doc.text(value, x, y + 6);
  });

  y = 84;
  doc.setDrawColor(LIGHT);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageW - 14, y);

  y = 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(DARK);
  doc.text('Core site traffic', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text('Primary: Interstellio BNG (PPPoE)', pageW - 14, y, { align: 'right' });
  y += 5;
  doc.text(
    'Site-level BNG aggregate for the period. Not SSID-split — Free + Staff + other traffic mixed.',
    14,
    y
  );

  y += 7;
  const days = [
    3.2, 4.1, 5.8, 4.4, 6.2, 2.1, 1.8, 5.5, 6.0, 5.1, 4.8, 5.9, 2.0, 1.5, 6.4, 7.1, 5.3, 4.9,
    5.6, 2.2, 1.9, 6.8, 7.4, 5.0, 4.7, 5.2, 2.3, 1.6, 6.1, 5.8,
  ];
  const max = Math.max(...days);
  const chartH = 22;
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
  y += chartH + 3.5;
  doc.setFontSize(7);
  doc.setTextColor('#9CA3AF');
  doc.text('Daily download (GB) — placeholder series · 1–30 June 2026', 14, y);

  y += 6;
  doc.setFillColor(249, 250, 251);
  doc.rect(14, y, pageW - 28, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Device identity', 16, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY);
  doc.text('UNJANIALEX2 · RAP2200(F) · SN G1U52HL00261B · Group Unjani · Online', 16, y + 8);

  // —— Unjani dual-source: Staff (critical gap) then Patient ——
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(DARK);
  doc.text('Unjani Wi-Fi breakdown (separate sources — do not sum)', 14, y);

  // Staff full-width investigation panel
  y += 5;
  const staffH = 58;
  doc.setFillColor(...AMBER_BG);
  doc.rect(14, y, pageW - 28, staffH, 'F');
  doc.setDrawColor(ORANGE);
  doc.setLineWidth(0.6);
  doc.rect(14, y, pageW - 28, staffH, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(AMBER);
  doc.text('Staff Wi-Fi — NOT DISPLAYING (critical gap)', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(DARK);
  doc.text('SSID: Unjani Clinic Staff · Source: CircleTel radio (SSID period bytes)', 18, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Why this section is empty:', 18, y + 17);
  doc.setFont('helvetica', 'normal');
  const whyLines = [
    '1. We do not yet store period GB broken down by Wi-Fi SSID (only site/device aggregates).',
    '2. Device Traffic (flow/show/hour) is total AP usage — Free + Staff mixed; no SSID dimension.',
    '3. Clients-tab RATES are live Kbps, not June totals — they must not be used as period usage.',
    '4. Need scheduled STA session-byte rollups by SSID (allow-list Staff + Free WiFi) to unlock.',
  ];
  let ly = y + 22;
  whyLines.forEach((line) => {
    doc.text(line, 18, ly, { maxWidth: pageW - 36 });
    ly += 4.2;
  });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(AMBER);
  doc.text(
    'Why investigate: Staff period usage is the critical CircleTel metric to view alongside Patient Free Wi-Fi (TDX).',
    18,
    y + staffH - 5,
    { maxWidth: pageW - 36 }
  );

  // Patient box
  y += staffH + 5;
  const patientH = 36;
  doc.setDrawColor(LIGHT);
  doc.setLineWidth(0.4);
  doc.rect(14, y, pageW - 28, patientH, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DARK);
  doc.text('Patient Free Wi-Fi', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY);
  doc.text('Source: TDX/ThinkWiFi (manual Looker export)', pageW - 18, y + 6, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(DARK);
  doc.text('Unique users: 1,842', 18, y + 14);
  doc.text('Login sessions: 6,210', 70, y + 14);
  doc.text('Download: 96.3 GB', 130, y + 14);

  doc.setFontSize(7);
  doc.setTextColor('#9CA3AF');
  doc.text(
    'Source: TDX/ThinkWiFi (manual export) · 1–30 June 2026 · aggregate/anonymised · may be revised by TDX · do not sum with Staff or BNG totals.',
    18,
    y + 22,
    { maxWidth: pageW - 36 }
  );
  doc.setTextColor(AMBER);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'Note: Patient figures alone cannot explain Staff load — Staff section above must be instrumented to compare.',
    18,
    y + 30,
    { maxWidth: pageW - 36 }
  );

  y = 285;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor('#9CA3AF');
  doc.text(
    'CircleTel · CT-UNJ-002 · Generated 31 July 2026, 15:28 SAST · Do not sum Patient + Staff + BNG · Page 1 of 1',
    pageW / 2,
    y,
    { align: 'center' }
  );

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(doc.output('arraybuffer')));
  console.log(`Wrote ${OUT}`);
}

main();
