/**
 * Service Order PDF Generator
 *
 * Generates a professional Service Order PDF record for Unjani clinics.
 * This is issued back-to-back with the Master Service Agreement (MSA).
 *
 * Layout:
 * - Page 1: Header + SO Number + Clinic Details + Service Summary (pricing)
 * - Page 2: Service Order Terms + Acceptance declaration + Footer
 */

import jsPDF from 'jspdf';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';
import { CONTACT } from '@/lib/constants/contact';
import { SERVICE_ORDER_TERMS, SERVICE_ORDER_MSA_REFERENCE, stripHtmlFromTerms } from '@/lib/onboarding/service-order-terms';

// CircleTel brand colors (RGB tuples)
const COLORS = {
  orange: [245, 131, 31] as [number, number, number],
  darkText: [31, 41, 55] as [number, number, number],
  secondaryText: [75, 85, 99] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
  mutedText: [107, 114, 128] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  borderGray: [209, 213, 219] as [number, number, number],
  headerGray: [55, 65, 81] as [number, number, number],
};

/**
 * Format currency for South Africa (ZAR)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display (e.g., "21 June 2026")
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Add CircleTel header to PDF page
 */
function addHeader(doc: jsPDF, pageWidth: number): number {
  // CircleTel Logo (left side)
  try {
    doc.addImage(circleTelLogoBase64, 'PNG', 20, 15, 45, 45);
  } catch {
    // Fallback to text if image fails
    doc.setTextColor(...COLORS.orange);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('circleTEL', 20, 35);
  }

  // Contact info (right side, right-aligned)
  doc.setTextColor(...COLORS.secondaryText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const rightX = pageWidth - 20;
  doc.text('Tel: +27 87 087 6305', rightX, 25, { align: 'right' });
  doc.text('Email: sales@circletel.co.za', rightX, 32, { align: 'right' });
  doc.text('Web: www.circletel.co.za', rightX, 39, { align: 'right' });

  // Orange underline below header
  doc.setDrawColor(...COLORS.orange);
  doc.setLineWidth(1.5);
  doc.line(20, 68, pageWidth - 20, 68);

  return 80; // Starting Y position after header
}

/**
 * Add three-column footer to PDF page
 */
function addFooter(doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number): void {
  const footerY = pageHeight - 32;
  const colWidth = (pageWidth - 40) / 3;
  const col1Center = 20 + colWidth / 2;
  const col2Center = 20 + colWidth + colWidth / 2;
  const col3Center = 20 + colWidth * 2 + colWidth / 2;

  // Separator line above footer
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 8, pageWidth - 20, footerY - 8);

  doc.setFontSize(9);

  // Column 1: Head Office
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.headerGray);
  doc.text('HEAD OFFICE', col1Center, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.mutedText);
  doc.text('CircleTel (Pty) Ltd', col1Center, footerY + 5, { align: 'center' });
  doc.text('Registration: 2008/026404/07', col1Center, footerY + 10, { align: 'center' });
  doc.text('VAT: 4380269318', col1Center, footerY + 15, { align: 'center' });

  // Column 2: Contact
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.headerGray);
  doc.text('CONTACT', col2Center, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.mutedText);
  doc.text('Tel: +27 87 087 6305', col2Center, footerY + 5, { align: 'center' });
  doc.text('Email: sales@circletel.co.za', col2Center, footerY + 10, { align: 'center' });
  doc.text('Web: www.circletel.co.za', col2Center, footerY + 15, { align: 'center' });

  // Column 3: Support
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.headerGray);
  doc.text('SUPPORT', col3Center, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.mutedText);
  doc.text('24/7 NOC: support@circletel.co.za', col3Center, footerY + 5, { align: 'center' });
  doc.text('Business Hours: 08:00 - 17:00', col3Center, footerY + 10, { align: 'center' });
  doc.text('Emergency: +27 87 087 6305', col3Center, footerY + 15, { align: 'center' });

  // Page number
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.mutedText);
  doc.text(`${pageNum}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

/**
 * Add section header with underline
 */
function addSectionHeader(doc: jsPDF, title: string, x: number, y: number, width: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.headerGray);
  doc.text(title, x, y);

  // Underline
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.line(x, y + 2, x + width, y + 2);

  return y + 10;
}

export interface ServiceOrderInput {
  accountNumber: string;
  clinicName: string;
  clinicAddress: string;
  clinicProvince: string;
  clinicEmail: string;
  clinicPhone?: string;
  monthlyFeeExclVat: number;
  vatPercentage: number; // Usually 15
  billingDay: '1' | '15' | '20' | '25';
  activationDate: string; // ISO 8601
  submittedAt: string; // ISO 8601
  /**
   * Acceptance evidence captured at the Step-5 click-accept (submission_data.acceptance).
   * When present, the PDF renders the terms SNAPSHOT the clinic actually accepted
   * (not the current live terms) and an audit-grade acceptance declaration.
   */
  acceptance?: {
    acceptedAtIso: string;
    ip?: string | null;
    termsVersion?: string;
    termsHash?: string;
    /** Plain-text clauses exactly as accepted. */
    termsSnapshot?: string[];
    linkSentVia?: string; // 'whatsapp' | 'sms' | ...
    linkSentAtIso?: string;
    maskedPhone?: string; // e.g. 073 *** 8016
    submissionId?: string;
  };
}

/** Format an ISO timestamp as date + time in South African time, e.g. "11 June 2026, 14:32:07 (SAST)". */
function formatDateTimeSAST(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  });
  const time = d.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Africa/Johannesburg',
  });
  return `${date}, ${time} (SAST)`;
}

/**
 * Generate Service Order PDF
 *
 * Returns a jsPDF document that can be converted to blob/buffer/base64
 */
export function generateServiceOrderPdf(input: ServiceOrderInput): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Calculate pricing
  const vatAmount = input.monthlyFeeExclVat * (input.vatPercentage / 100);
  const monthlyFeeInclVat = input.monthlyFeeExclVat + vatAmount;

  // Service Order number: SO-<account_number>
  const soNumber = `SO-${input.accountNumber}`;

  const leftCol = 20;
  const colWidth = pageWidth - 50;

  // =============================================
  // PAGE 1: Header + Title + Details
  // =============================================
  let yPos = addHeader(doc, pageWidth);

  // === Title Section ===
  doc.setTextColor(...COLORS.darkText);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE ORDER', leftCol, yPos);

  yPos += 12;
  doc.setFontSize(10);

  // SO Number
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Service Order No:', leftCol, yPos);
  doc.setTextColor(...COLORS.orange);
  doc.setFont('helvetica', 'bold');
  doc.text(soNumber, leftCol + 50, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Date:', leftCol, yPos);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(new Date().toISOString()), leftCol + 50, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Effective Date:', leftCol, yPos);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(input.activationDate), leftCol + 50, yPos);

  yPos += 15;

  // === CLINIC DETAILS ===
  let clinicY = addSectionHeader(doc, 'CLINIC DETAILS', leftCol, yPos, colWidth);

  const clinicFields = [
    ['Clinic Name:', input.clinicName],
    ['Account Number:', input.accountNumber],
    ['Address:', input.clinicAddress],
    ['Province:', input.clinicProvince],
    ['Email:', input.clinicEmail],
    ['Phone:', input.clinicPhone || '-'],
  ];

  doc.setFontSize(9);
  clinicFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondaryText);
    doc.text(label, leftCol, clinicY);

    doc.setTextColor(...COLORS.darkText);
    const valueLines = doc.splitTextToSize(String(value), colWidth - 45);
    doc.text(valueLines, leftCol + 50, clinicY);
    clinicY += 6 * Math.max(valueLines.length, 1);
  });

  yPos = clinicY + 8;

  // === SERVICE SUMMARY ===
  let serviceY = addSectionHeader(doc, 'SERVICE SUMMARY', leftCol, yPos, colWidth);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Service:', leftCol, serviceY);
  doc.setTextColor(...COLORS.darkText);
  doc.text('CircleTel ClinicConnect — Managed Connectivity', leftCol + 50, serviceY);
  serviceY += 8;

  // Billing day
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Billing Day of Month:', leftCol, serviceY);
  doc.setTextColor(...COLORS.darkText);
  const billingDayLabel = input.billingDay === '1' ? '1st' : input.billingDay === '15' ? '15th' : input.billingDay === '20' ? '20th' : '25th';
  doc.text(billingDayLabel, leftCol + 50, serviceY);
  serviceY += 8;

  // Pricing box (highlighted)
  serviceY += 4;
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(leftCol, serviceY - 5, colWidth, 28, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Monthly Fee (Excl. VAT):', leftCol + 5, serviceY);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(input.monthlyFeeExclVat), leftCol + colWidth - 5, serviceY, { align: 'right' });

  serviceY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text(`VAT (${input.vatPercentage}%):`, leftCol + 5, serviceY);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(vatAmount), leftCol + colWidth - 5, serviceY, { align: 'right' });

  serviceY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.orange);
  doc.text('Monthly Fee (Incl. VAT):', leftCol + 5, serviceY);
  doc.text(formatCurrency(monthlyFeeInclVat), leftCol + colWidth - 5, serviceY, { align: 'right' });

  yPos = serviceY + 12;

  // === MSA REFERENCE ===
  yPos += 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  const msaLines = doc.splitTextToSize(SERVICE_ORDER_MSA_REFERENCE, colWidth);
  doc.text(msaLines, leftCol, yPos);
  yPos += 4 * msaLines.length + 4;

  // Check if we need to go to page 2 for terms
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = addHeader(doc, pageWidth);
  }

  // =============================================
  // PAGE 2 (or continuation): Terms + Acceptance
  // =============================================
  if (doc.getNumberOfPages() === 1) {
    // Still on page 1, add a page break for terms
    doc.addPage();
    yPos = addHeader(doc, pageWidth);
  }

  // === TERMS AND CONDITIONS ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.darkText);
  doc.text('TERMS AND CONDITIONS', leftCol, yPos);
  yPos += 8;

  // Render the terms snapshot the clinic actually accepted; fall back to current live terms
  // (older submissions made before acceptance evidence was captured).
  const plainTerms = input.acceptance?.termsSnapshot?.length
    ? input.acceptance.termsSnapshot
    : stripHtmlFromTerms(SERVICE_ORDER_TERMS);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  // jsPDF renders multi-line text at fontSize × lineHeightFactor (default 1.15).
  // At 8pt that is ~3.25mm per rendered line — the previous 2.5mm advance
  // under-counted this, so long clauses (e.g. clause 3) drew over the next
  // clause's heading. These values reserve the true rendered height.
  const bodyLineH = 3.3; // mm per rendered body line at 8pt
  const titleGap = 4; // mm below a clause title before its body
  const clauseGap = 3.5; // mm between one clause and the next

  plainTerms.forEach((term, index) => {
    // Extract title (before colon)
    const colonIndex = term.indexOf(':');
    if (colonIndex <= 0) return;

    const title = term.substring(0, colonIndex + 1);
    const body = term.substring(colonIndex + 1).trim();
    const bodyLines = doc.splitTextToSize(body, colWidth - 10);

    // Page-break guard: if this clause won't fit above the footer band,
    // start it on a fresh page rather than overrunning the footer.
    const clauseHeight = titleGap + bodyLines.length * bodyLineH + clauseGap;
    if (yPos + clauseHeight > pageHeight - 45) {
      doc.addPage();
      yPos = addHeader(doc, pageWidth);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.darkText);
    doc.text(`${index + 1}. ${title}`, leftCol, yPos);
    yPos += titleGap;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondaryText);
    doc.text(bodyLines, leftCol + 5, yPos);
    yPos += bodyLines.length * bodyLineH + clauseGap;
  });

  yPos += 5;

  // === ACCEPTANCE DECLARATION ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.darkText);
  doc.text('ACCEPTANCE', leftCol, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);

  const acc = input.acceptance;
  let acceptanceText: string;
  if (acc) {
    const channel =
      acc.linkSentVia === 'whatsapp' ? 'WhatsApp' : acc.linkSentVia === 'sms' ? 'SMS' : 'a secure channel';
    const linkSentence =
      acc.maskedPhone && acc.linkSentAtIso
        ? ` Access was via a single-use secure link sent by ${channel} to ${acc.maskedPhone} on ${formatDate(acc.linkSentAtIso)}.`
        : '';
    const ipSentence = acc.ip ? ` Originating IP address: ${acc.ip}.` : '';
    acceptanceText =
      `This Service Order was accepted electronically by the clinic on ${formatDateTimeSAST(acc.acceptedAtIso)} ` +
      `via the CircleTel onboarding portal (click-accept), in terms of the Electronic Communications and ` +
      `Transactions Act 25 of 2002.${linkSentence}${ipSentence} No manual signature is required.`;
  } else {
    acceptanceText =
      `This Service Order was accepted electronically by the clinic on ${formatDate(input.submittedAt)} ` +
      `via the CircleTel onboarding portal (click-accept). No manual signature is required.`;
  }
  const acceptanceLines = doc.splitTextToSize(acceptanceText, colWidth);
  doc.text(acceptanceLines, leftCol, yPos);
  yPos += acceptanceLines.length * 4 + 4;

  // Audit reference line — ties this document to the immutable acceptance record
  if (acc && (acc.submissionId || acc.termsVersion || acc.termsHash)) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondaryText);
    const auditParts = [
      acc.submissionId ? `Acceptance record: ${acc.submissionId}` : null,
      acc.termsVersion ? `Terms version: ${acc.termsVersion}` : null,
      acc.termsHash ? `Terms SHA-256: ${acc.termsHash}` : null,
    ].filter(Boolean);
    const auditLines = doc.splitTextToSize(auditParts.join('  ·  '), colWidth);
    doc.text(auditLines, leftCol, yPos);
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  return doc;
}

/**
 * Generate PDF as Blob (for uploading to storage)
 */
export function generateServiceOrderBlob(input: ServiceOrderInput): Blob {
  const pdf = generateServiceOrderPdf(input);
  return pdf.output('blob');
}

/**
 * Generate PDF as Buffer (for Node.js server-side usage)
 */
export function generateServiceOrderBuffer(input: ServiceOrderInput): Buffer {
  const pdf = generateServiceOrderPdf(input);
  const arrayBuffer = pdf.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Generate PDF as base64 string (for embedding in URLs)
 */
export function generateServiceOrderBase64(input: ServiceOrderInput): string {
  const pdf = generateServiceOrderPdf(input);
  return pdf.output('datauristring');
}
