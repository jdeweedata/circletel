/**
 * Managed Service Agreement PDF Generator
 *
 * Generates professional contract PDFs for managed connectivity services.
 * Layout matches the B2B quote template EXACTLY (reference: CircleTel - Reliable Tech Solutions.pdf)
 *
 * Structure:
 * - Page 1: Header + Title + Customer/Service Details + Service Package Table
 * - Page 2: Pricing + Benefits + Terms (two-column)
 * - Page 3: Acceptance + Signature + Footer
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ManagedServiceContractInput } from './types';
import { getTemplateForServiceType } from './contract-templates';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';

// CircleTel brand colors (RGB tuples)
const COLORS = {
  orange: [245, 131, 31] as [number, number, number],
  darkText: [31, 41, 55] as [number, number, number],
  secondaryText: [75, 85, 99] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number], // Lighter gray for fills
  mutedText: [107, 114, 128] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  borderGray: [209, 213, 219] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  headerGray: [55, 65, 81] as [number, number, number], // For section headers
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
 * Format date for display (e.g., "21 November 2025")
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate next contract number if not provided
 * Format: CT-YYYY-XXX
 */
function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900) + 100; // 100-999
  return `CT-${year}-${random}`;
}

/**
 * Add CircleTel header to PDF page
 * Layout: Logo left, contact info right, orange underline
 */
function addHeader(doc: jsPDF, pageWidth: number): number {
  // White background (default)

  // CircleTel Logo (left side) - larger like reference
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
  doc.text('Email: quotes@circletel.co.za', rightX, 32, { align: 'right' });
  doc.text('Web: www.circletel.co.za', rightX, 39, { align: 'right' });

  // Orange underline below header
  doc.setDrawColor(...COLORS.orange);
  doc.setLineWidth(1.5);
  doc.line(20, 68, pageWidth - 20, 68);

  return 80; // Starting Y position after header
}

/**
 * Add three-column footer to PDF page (centered text)
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

  // Column 1: Head Office (centered)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.headerGray);
  doc.text('HEAD OFFICE', col1Center, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.mutedText);
  doc.text('CircleTel (Pty) Ltd', col1Center, footerY + 5, { align: 'center' });
  doc.text('Registration: 2020/123456/07', col1Center, footerY + 10, { align: 'center' });
  doc.text('VAT: 4123456789', col1Center, footerY + 15, { align: 'center' });

  // Column 2: Contact (centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.headerGray);
  doc.text('CONTACT', col2Center, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.mutedText);
  doc.text('Tel: +27 87 087 6305', col2Center, footerY + 5, { align: 'center' });
  doc.text('Email: quotes@circletel.co.za', col2Center, footerY + 10, { align: 'center' });
  doc.text('Web: www.circletel.co.za', col2Center, footerY + 15, { align: 'center' });

  // Column 3: Support (centered)
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

  // Page number (bottom center)
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.mutedText);
  doc.text(`${pageNum}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

/**
 * Add section header with underline (matches reference style)
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

/**
 * Draw checkmark bullet point (green checkmark like reference)
 */
function drawCheckmark(doc: jsPDF, x: number, y: number, text: string, maxWidth: number): number {
  // Green checkmark
  doc.setTextColor(...COLORS.green);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('\u2713', x, y); // Unicode checkmark

  // Text next to checkmark
  doc.setTextColor(...COLORS.secondaryText);
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(text, maxWidth - 10);
  doc.text(lines, x + 7, y);

  return y + 4 * lines.length + 1;
}

/**
 * Draw checkbox with label (square checkbox like reference)
 */
function drawCheckbox(doc: jsPDF, x: number, y: number, text: string, maxWidth: number): number {
  // Draw empty checkbox square
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.rect(x, y - 3, 4, 4);

  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text, maxWidth - 12);
  doc.text(lines, x + 8, y);

  return y + 5 * lines.length + 3;
}

/**
 * Generate Managed Service Agreement PDF
 *
 * Layout (matches reference exactly):
 * - Page 1: Header + Title + PREPARED FOR + Customer/Service Details + Service Package Table
 * - Page 2: Pricing + Benefits (two-column) + CONTRACT SUMMARY + Terms (two-column)
 * - Page 3: Customer Acceptance + Signature + Three-column footer + Thank you
 */
export function generateManagedServiceAgreementPDF(input: ManagedServiceContractInput): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const template = getTemplateForServiceType('managed_wireless');

  const contractNumber = input.contract.contractNumber || generateContractNumber();
  const validUntil = new Date(input.contract.commencementDate);
  validUntil.setDate(validUntil.getDate() + 30);

  // Calculate pricing
  const monthlyVat = input.pricing.monthlyFee * input.pricing.vatRate;
  const monthlyTotal = input.pricing.monthlyFee + monthlyVat;
  const installVat = input.pricing.installationFee * input.pricing.vatRate;
  const installTotal = input.pricing.installationFee + installVat;

  // Calculate contract value (monthly * term in months)
  const termMonths = input.contract.term.includes('month')
    ? parseInt(input.contract.term) || 12
    : 12;
  const totalContractValue = monthlyTotal * termMonths;

  const leftCol = 20;
  const rightCol = pageWidth / 2 + 10;
  const colWidth = pageWidth / 2 - 30;

  // =============================================
  // PAGE 1: Header + Title + Customer/Service Details + Table
  // =============================================
  let yPos = addHeader(doc, pageWidth);

  // === Title Section (Two-Column Layout) ===

  // Left: SERVICE AGREEMENT title + metadata
  doc.setTextColor(...COLORS.darkText);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE AGREEMENT', leftCol, yPos);

  yPos += 12;
  doc.setFontSize(10);

  // Contract No: (label gray, value orange)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Contract No:', leftCol, yPos);
  doc.setTextColor(...COLORS.orange);
  doc.setFont('helvetica', 'bold');
  doc.text(contractNumber, leftCol + 28, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Date:', leftCol, yPos);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(new Date().toISOString()), leftCol + 28, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Valid Until:', leftCol, yPos);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(validUntil.toISOString()), leftCol + 28, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Status:', leftCol, yPos);

  // Status badge (green rounded rect like reference)
  const statusX = leftCol + 28;
  doc.setFillColor(...COLORS.green);
  doc.roundedRect(statusX - 2, yPos - 4, 20, 6, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Draft', statusX + 8, yPos, { align: 'center' });

  // Right: PREPARED FOR box (gray fill with header like reference)
  const preparedForY = yPos - 30;
  const preparedForHeight = 50;

  // Gray header bar
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(rightCol, preparedForY, colWidth, 8, 'F');
  doc.setTextColor(...COLORS.mutedText);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PREPARED FOR:', rightCol + 5, preparedForY + 5.5);

  // Box border
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.rect(rightCol, preparedForY, colWidth, preparedForHeight);

  // Company name (large, bold)
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const companyLines = doc.splitTextToSize(input.customer.companyName, colWidth - 10);
  doc.text(companyLines, rightCol + colWidth - 5, preparedForY + 18, { align: 'right' });

  // Contact info (right-aligned)
  let infoY = preparedForY + 18 + (companyLines.length * 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondaryText);
  doc.text(input.customer.contactPerson, rightCol + colWidth - 5, infoY, { align: 'right' });
  infoY += 5;
  doc.text(input.customer.companyName, rightCol + colWidth - 5, infoY, { align: 'right' });
  infoY += 5;
  if (input.customer.phone) {
    doc.text(input.customer.phone, rightCol + colWidth - 5, infoY, { align: 'right' });
  }

  yPos += 25;

  // === CUSTOMER DETAILS + SERVICE SUMMARY (Two-Column with underlines) ===

  // Left Column: CUSTOMER DETAILS
  let leftY = addSectionHeader(doc, 'CUSTOMER DETAILS', leftCol, yPos, colWidth);

  const customerFields = [
    ['Company:', input.customer.companyName],
    ['Contact Person:', input.customer.contactPerson],
    ['Email:', input.customer.email],
    ['Phone:', input.customer.phone || '-'],
    ['Service Address:', input.customer.address],
  ];

  doc.setFontSize(9);
  customerFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondaryText);
    doc.text(label, leftCol, leftY);

    doc.setTextColor(...COLORS.darkText);
    const valueLines = doc.splitTextToSize(value, colWidth - 40);
    doc.text(valueLines, leftCol + colWidth, leftY, { align: 'right' });
    leftY += 6 * Math.max(valueLines.length, 1);
  });

  // Right Column: SERVICE SUMMARY
  let rightY = addSectionHeader(doc, 'SERVICE SUMMARY', rightCol, yPos, colWidth);

  const serviceFields = [
    ['Customer Type:', 'Business'],
    ['Contract Term:', input.contract.term],
    ['Services:', '1 package(s)'],
  ];

  doc.setFontSize(9);
  serviceFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondaryText);
    doc.text(label, rightCol, rightY);

    doc.setTextColor(...COLORS.darkText);
    doc.text(value, rightCol + colWidth, rightY, { align: 'right' });
    rightY += 6;
  });

  // Monthly Total (highlighted in orange, larger font)
  rightY += 2;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Monthly Total:', rightCol, rightY);

  doc.setTextColor(...COLORS.orange);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(formatCurrency(monthlyTotal), rightCol + colWidth, rightY, { align: 'right' });

  yPos = Math.max(leftY, rightY) + 15;

  // === SERVICE PACKAGE DETAILS Table ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.darkText);
  doc.text('SERVICE PACKAGE DETAILS', leftCol, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Service Description', 'Qty', 'Speed', 'Data', 'Monthly (Excl. VAT)', 'Installation (Excl. VAT)']],
    body: [[
      input.service.description || input.service.type,
      '1',
      `${input.service.speedDown}\u2193/${input.service.speedUp}\u2191 Mbps`,
      input.service.dataPolicy,
      formatCurrency(input.pricing.monthlyFee),
      formatCurrency(input.pricing.installationFee),
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.lightGray,
      textColor: COLORS.darkText,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.darkText,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 40 },
      1: { cellWidth: 12 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 32 },
      5: { cellWidth: 30 },
    },
    margin: { left: 20, right: 20 },
  });

  // =============================================
  // PAGE 2: Pricing + Benefits + CONTRACT SUMMARY + Terms
  // =============================================
  doc.addPage();
  yPos = addHeader(doc, pageWidth);

  // === PRICING BREAKDOWN + INCLUSIVE BENEFITS (Two-Column) ===

  // Left Column: PRICING BREAKDOWN
  let pricingY = addSectionHeader(doc, 'PRICING BREAKDOWN', leftCol, yPos, colWidth);

  // MONTHLY RECURRING COSTS subheader
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkText);
  doc.text('MONTHLY RECURRING COSTS', leftCol, pricingY);
  pricingY += 6;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Subtotal (Excl. VAT):', leftCol, pricingY);
  doc.setTextColor(...COLORS.darkText);
  doc.text(formatCurrency(input.pricing.monthlyFee), leftCol + colWidth, pricingY, { align: 'right' });
  pricingY += 4;

  // VAT
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('VAT (15%):', leftCol, pricingY);
  doc.setTextColor(...COLORS.darkText);
  doc.text(formatCurrency(monthlyVat), leftCol + colWidth, pricingY, { align: 'right' });
  pricingY += 5;

  // Monthly Total (bold, orange)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkText);
  doc.text('Monthly Total (Incl. VAT):', leftCol, pricingY);
  doc.setTextColor(...COLORS.orange);
  doc.text(formatCurrency(monthlyTotal), leftCol + colWidth, pricingY, { align: 'right' });
  pricingY += 10;

  // ONE-TIME INSTALLATION COSTS subheader
  doc.setTextColor(...COLORS.darkText);
  doc.text('ONE-TIME INSTALLATION COSTS', leftCol, pricingY);
  pricingY += 5;

  // Installation in bordered box (like reference)
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.rect(leftCol, pricingY - 2, colWidth, 22);

  pricingY += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Subtotal (Excl. VAT):', leftCol + 5, pricingY);
  doc.setTextColor(...COLORS.darkText);
  doc.text(formatCurrency(input.pricing.installationFee), leftCol + colWidth - 5, pricingY, { align: 'right' });
  pricingY += 4;

  doc.setTextColor(...COLORS.secondaryText);
  doc.text('VAT (15%):', leftCol + 5, pricingY);
  doc.setTextColor(...COLORS.darkText);
  doc.text(formatCurrency(installVat), leftCol + colWidth - 5, pricingY, { align: 'right' });
  pricingY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.orange);
  doc.text('Installation Total (Incl. VAT):', leftCol + 5, pricingY);
  doc.text(formatCurrency(installTotal), leftCol + colWidth - 5, pricingY, { align: 'right' });
  pricingY += 14;

  // CONTRACT SUMMARY box (bordered with orange accent)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.darkText);
  doc.text('CONTRACT SUMMARY', leftCol, pricingY);
  pricingY += 4;

  // Orange left border accent + gray box
  doc.setFillColor(...COLORS.orange);
  doc.rect(leftCol, pricingY, 3, 28, 'F');
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.rect(leftCol, pricingY, colWidth, 28);

  pricingY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Contract Term:', leftCol + 8, pricingY);
  doc.setTextColor(...COLORS.darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(input.contract.term, leftCol + colWidth - 5, pricingY, { align: 'right' });
  pricingY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondaryText);
  doc.text('Total Contract Value:', leftCol + 8, pricingY);
  doc.setTextColor(...COLORS.orange);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(formatCurrency(totalContractValue), leftCol + colWidth - 5, pricingY, { align: 'right' });

  // Right Column: INCLUSIVE BENEFITS
  let benefitsY = addSectionHeader(doc, 'INCLUSIVE BENEFITS', rightCol, yPos, colWidth);

  const benefits = [
    '24/7 Network Operations Centre (NOC) monitoring',
    '99.9% Service Level Agreement (SLA)',
    'Dedicated account manager',
    'Equipment maintenance and replacement',
    'Free technical support during business hours',
    'Monthly usage reporting and analytics',
    'No fair usage policy restrictions',
    'Priority technical support',
    'Professional installation and configuration',
    'Service level reporting',
    'South African-based customer support',
    'Static IP address allocation',
    'Symmetric upload/download speeds',
    'Unlimited data usage',
  ];

  benefits.forEach((benefit) => {
    benefitsY = drawCheckmark(doc, rightCol, benefitsY, benefit, colWidth);
  });

  yPos = Math.max(pricingY + 20, benefitsY) + 8;

  // === TERMS AND CONDITIONS (Two-Column) ===
  // Separator line
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.darkText);
  doc.text('TERMS AND CONDITIONS', leftCol, yPos);
  yPos += 10;

  const terms = [
    {
      title: '1. CONTRACT TERMS',
      text: `This quote is valid for 30 days from the date issued. Pricing is subject to change after this period. Contract term as specified above.`,
    },
    {
      title: '2. INSTALLATION',
      text: 'Installation will be scheduled within 7-14 business days of order confirmation, subject to site readiness and third-party provider availability.',
    },
    {
      title: '3. PAYMENT TERMS',
      text: 'Monthly charges are payable in advance. Installation fees are due on completion of installation. All amounts are inclusive of VAT where applicable.',
    },
    {
      title: '4. SERVICE LEVEL AGREEMENT',
      text: `CircleTel provides a ${input.sla.uptimeGuarantee}% uptime SLA measured monthly. Service credits apply for verified outages exceeding SLA thresholds.`,
    },
    {
      title: '5. CANCELLATION',
      text: `${input.contract.noticePeriod} days written notice required for cancellation. Early termination fees may apply for contract term commitments.`,
    },
    {
      title: '6. EQUIPMENT',
      text: `Customer Premises Equipment (CPE) remains CircleTel property and must be returned in good condition upon service termination.`,
    },
    {
      title: '7. FAIR USAGE',
      text: 'While data is unlimited, CircleTel reserves the right to manage traffic during peak periods to ensure fair usage across all customers.',
    },
    {
      title: '8. GOVERNING LAW',
      text: 'This agreement is governed by South African law. Full terms and conditions available at www.circletel.co.za/terms',
    },
  ];

  // Two columns for terms (1-4 left, 5-8 right)
  const termColWidth = (pageWidth - 50) / 2;
  let termLeftY = yPos;
  let termRightY = yPos;
  const maxTermY = pageHeight - 50; // Leave space for footer

  terms.forEach((term, index) => {
    const isLeftCol = index < 4;
    const termX = isLeftCol ? leftCol : rightCol;
    let termY = isLeftCol ? termLeftY : termRightY;

    // Compact font sizes
    const termFontSize = 8;
    const descFontSize = 7;

    // Bold numbered title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(termFontSize);
    doc.setTextColor(...COLORS.darkText);
    doc.text(term.title, termX, termY);
    termY += 3.5;

    // Description text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(descFontSize);
    doc.setTextColor(...COLORS.secondaryText);
    const lines = doc.splitTextToSize(term.text, termColWidth);
    doc.text(lines, termX, termY);
    termY += 2.8 * lines.length + 3;

    if (isLeftCol) {
      termLeftY = termY;
    } else {
      termRightY = termY;
    }
  });

  // =============================================
  // PAGE 3: Customer Acceptance + Signature
  // =============================================
  doc.addPage();
  yPos = addHeader(doc, pageWidth);

  // === CUSTOMER ACCEPTANCE Box (Orange Border, Centered Title) ===
  const acceptanceBoxY = yPos;
  const acceptanceBoxHeight = 110; // Taller to fit signature box

  // Orange border box
  doc.setDrawColor(...COLORS.orange);
  doc.setLineWidth(1.5);
  doc.rect(20, acceptanceBoxY, pageWidth - 40, acceptanceBoxHeight);

  // Centered title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.darkText);
  doc.text('CUSTOMER ACCEPTANCE', pageWidth / 2, acceptanceBoxY + 12, { align: 'center' });

  // Two columns inside box
  const acceptLeftX = 28;
  const acceptRightX = pageWidth / 2 + 5;
  const acceptColWidth = (pageWidth - 70) / 2;

  // Left: ACCEPTANCE DECLARATION
  let acceptY = acceptanceBoxY + 25;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCEPTANCE DECLARATION', acceptLeftX, acceptY);
  acceptY += 10;

  const acceptanceItems = [
    'I accept the terms and conditions as outlined above',
    'I confirm the service address and technical requirements are correct',
    'I authorize CircleTel to proceed with installation',
    'I have authority to sign on behalf of the company',
  ];

  acceptanceItems.forEach((item) => {
    acceptY = drawCheckbox(doc, acceptLeftX, acceptY, item, acceptColWidth);
  });

  // Right: SIGNATURE
  let sigY = acceptanceBoxY + 25;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.darkText);
  doc.text('SIGNATURE', acceptRightX, sigY);
  sigY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.secondaryText);

  // Authorized Signatory Name
  doc.text('Authorized Signatory Name:', acceptRightX, sigY);
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.line(acceptRightX, sigY + 6, acceptRightX + acceptColWidth - 5, sigY + 6);
  sigY += 14;

  // Position/Title
  doc.text('Position/Title:', acceptRightX, sigY);
  doc.line(acceptRightX, sigY + 6, acceptRightX + acceptColWidth - 5, sigY + 6);
  sigY += 14;

  // Date
  doc.text('Date:', acceptRightX, sigY);
  doc.line(acceptRightX, sigY + 6, acceptRightX + acceptColWidth - 5, sigY + 6);
  sigY += 14;

  // Signature box (dashed border) - keep inside acceptance box
  doc.text('Signature:', acceptRightX, sigY);
  sigY += 4;

  // Dashed signature box - smaller to fit inside
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineDashPattern([3, 3], 0);
  doc.rect(acceptRightX, sigY, acceptColWidth - 5, 15);
  doc.setLineDashPattern([], 0); // Reset to solid

  doc.setTextColor(...COLORS.mutedText);
  doc.setFontSize(9);
  doc.text('Sign Here', acceptRightX + (acceptColWidth - 5) / 2, sigY + 9, { align: 'center' });

  yPos = acceptanceBoxY + acceptanceBoxHeight + 8;

  // Note below box
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.secondaryText);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This quote can be accepted digitally via the online portal or manually signed and returned.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  // === Thank You Message (at bottom, above footer) ===
  const thankYouY = pageHeight - 65;

  // Separator line
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.line(20, thankYouY - 5, pageWidth - 20, thankYouY - 5);

  doc.setTextColor(...COLORS.secondaryText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Thank you for choosing CircleTel as your telecommunications partner. We look forward to delivering exceptional',
    pageWidth / 2,
    thankYouY + 2,
    { align: 'center' }
  );
  doc.text(
    'connectivity solutions for your business.',
    pageWidth / 2,
    thankYouY + 8,
    { align: 'center' }
  );

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  return doc;
}

/**
 * Generate and download PDF
 */
export function downloadManagedServiceAgreementPDF(input: ManagedServiceContractInput): void {
  const pdf = generateManagedServiceAgreementPDF(input);
  const contractNumber = input.contract.contractNumber || 'DRAFT';
  const companySlug = input.customer.companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  pdf.save(`CircleTel_MSA_${companySlug}_${contractNumber}.pdf`);
}

/**
 * Generate PDF as blob for server-side usage or storage
 */
export function generateManagedServiceAgreementBlob(input: ManagedServiceContractInput): Blob {
  const pdf = generateManagedServiceAgreementPDF(input);
  return pdf.output('blob');
}

/**
 * Generate PDF as base64 string
 */
export function generateManagedServiceAgreementBase64(input: ManagedServiceContractInput): string {
  const pdf = generateManagedServiceAgreementPDF(input);
  return pdf.output('datauristring');
}
