/**
 * Send Prins Mhlanga Statement & Invoices to Jeffrey
 * - Branded email with CircleTel logo and styling
 * - PDF invoices with embedded PayNow links
 *
 * Usage: npx tsx scripts/send-jeffrey-prins-branded.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_DETAILS } from '../lib/invoices/invoice-pdf-generator';
import { circleTelLogoBase64 } from '../lib/quotes/circletel-logo-base64';

config({ path: resolve(process.cwd(), '.env.production.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Brand colors
const COLORS = {
  primary: '#F5831F',
  dark: '#1F2937',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
  green: '#059669',
  red: '#DC2626',
};

// PayNow config
const PAYNOW_BASE = 'https://paynow.netcash.co.za/site/paynow.aspx';
const SERVICE_KEY = '65251ca3-95d8-47da-bbeb-d7fad8cd9ef1';
const PCI_VAULT_KEY = '6940844b-ea39-44a5-b929-427b205e457e';

const CUSTOMER = {
  name: 'Prins Mhlanga',
  accountNumber: 'CT-2025-00030',
  email: 'prins.mhlanga@ocean76.com',
};

const INVOICES = [
  {
    invoiceNumber: 'INV-2026-00001',
    invoiceDate: '2026-01-25',
    dueDate: '2026-02-05',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    periodLabel: 'January 2026',
    amount: 999.00,
    status: 'paid',
    statusLabel: 'PAID',
    paynowRef: null,
  },
  {
    invoiceNumber: 'INV-2026-00005',
    invoiceDate: '2026-02-27',
    dueDate: '2026-03-05',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    periodLabel: 'February 2026',
    amount: 999.00,
    status: 'due',
    statusLabel: 'DUE',
    paynowRef: 'CT-INV2026-00005-1773320769',
  },
  {
    invoiceNumber: 'INV-2026-00003',
    invoiceDate: '2026-02-27',
    dueDate: '2026-03-05',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    periodLabel: 'March 2026',
    amount: 999.00,
    status: 'due',
    statusLabel: 'DUE',
    paynowRef: 'CT-INV2026-00003-1773319726',
  },
];

function buildPayNowUrl(ref: string, invoiceNumber: string, amount: number): string {
  return `${PAYNOW_BASE}?m1=${SERVICE_KEY}&m2=${PCI_VAULT_KEY}&p2=${ref}&p3=${encodeURIComponent(`CircleTel - ${invoiceNumber}`)}&p4=${amount.toFixed(2)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate Invoice PDF with PayNow link
 */
function generateInvoicePDF(inv: typeof INVOICES[0]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // ===== HEADER =====
  try {
    doc.addImage(circleTelLogoBase64, 'PNG', margin, yPos, 25, 25);
  } catch {
    doc.setFillColor(COLORS.primary);
    doc.rect(margin, yPos, 25, 25, 'F');
  }

  // TAX INVOICE title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('TAX INVOICE', pageWidth - margin, yPos + 8, { align: 'right' });

  // Invoice number below title
  doc.setFontSize(11);
  doc.setTextColor(COLORS.gray);
  doc.text(inv.invoiceNumber, pageWidth - margin, yPos + 16, { align: 'right' });

  yPos += 35;

  // ===== COMPANY INFO (Left) & INVOICE DETAILS (Right) =====

  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(COMPANY_DETAILS.name, margin, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`VAT: ${COMPANY_DETAILS.vatNumber}`, margin, yPos);
  yPos += 4;
  doc.text(COMPANY_DETAILS.address.line1, margin, yPos);
  yPos += 4;
  doc.text(COMPANY_DETAILS.address.line2, margin, yPos);
  yPos += 4;
  doc.text(`${COMPANY_DETAILS.address.province}, ${COMPANY_DETAILS.address.postalCode}`, margin, yPos);

  // Invoice details (right side)
  const rightX = pageWidth - margin - 55;
  let rightY = yPos - 17;

  const details = [
    ['Invoice Date:', formatDate(inv.invoiceDate)],
    ['Due Date:', formatDate(inv.dueDate)],
    ['Account:', CUSTOMER.accountNumber],
    ['Period:', inv.periodLabel],
  ];

  doc.setFontSize(9);
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(label, rightX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text(value, rightX + 30, rightY);
    rightY += 5;
  });

  yPos += 15;

  // ===== BILL TO =====
  doc.setDrawColor(COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('BILL TO', margin, yPos);
  yPos += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(CUSTOMER.name, margin, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(CUSTOMER.email, margin, yPos);

  yPos += 12;

  // ===== LINE ITEMS TABLE =====
  const exclPrice = 868.70;
  const vatAmount = 130.30;
  const total = 999.00;

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Price (Excl)', 'VAT 15%', 'Total (Incl)']],
    body: [[
      `Internet Service - ${inv.periodLabel}`,
      '1',
      formatCurrency(exclPrice),
      formatCurrency(vatAmount),
      formatCurrency(total)
    ]],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4, textColor: COLORS.dark },
    headStyles: { fillColor: COLORS.lightGray, textColor: COLORS.dark, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===== TOTALS =====
  const totalsX = pageWidth - margin - 70;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('Subtotal (Excl VAT):', totalsX, yPos);
  doc.setTextColor(COLORS.dark);
  doc.text(formatCurrency(exclPrice), pageWidth - margin, yPos, { align: 'right' });

  yPos += 5;
  doc.setTextColor(COLORS.gray);
  doc.text('VAT (15%):', totalsX, yPos);
  doc.setTextColor(COLORS.dark);
  doc.text(formatCurrency(vatAmount), pageWidth - margin, yPos, { align: 'right' });

  yPos += 6;
  doc.setDrawColor(COLORS.dark);
  doc.setLineWidth(0.3);
  doc.line(totalsX, yPos, pageWidth - margin, yPos);

  yPos += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Total Due:', totalsX, yPos);
  doc.text(formatCurrency(total), pageWidth - margin, yPos, { align: 'right' });

  yPos += 15;

  // ===== PAYMENT SECTION =====

  // Bank details box
  doc.setFillColor('#F9FAFB');
  doc.roundedRect(margin, yPos, 80, 35, 3, 3, 'F');

  let bankY = yPos + 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('EFT PAYMENT DETAILS', margin + 4, bankY);
  bankY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Bank: ${COMPANY_DETAILS.banking.bankName}`, margin + 4, bankY);
  bankY += 4;
  doc.text(`Account: ${COMPANY_DETAILS.banking.accountNumber}`, margin + 4, bankY);
  bankY += 4;
  doc.text(`Branch: ${COMPANY_DETAILS.banking.branchCode}`, margin + 4, bankY);
  bankY += 4;
  doc.text(`Reference: ${CUSTOMER.accountNumber}`, margin + 4, bankY);

  // PayNow button (if invoice is due)
  if (inv.status === 'due' && inv.paynowRef) {
    const paynowUrl = buildPayNowUrl(inv.paynowRef, inv.invoiceNumber, inv.amount);
    const btnX = margin + 90;
    const btnY = yPos;
    const btnW = pageWidth - margin - btnX;
    const btnH = 35;

    // Orange button background
    doc.setFillColor(COLORS.primary);
    doc.roundedRect(btnX, btnY, btnW, btnH, 3, 3, 'F');

    // Button text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.white);
    doc.text('PAY NOW', btnX + btnW / 2, btnY + 12, { align: 'center' });

    doc.setFontSize(14);
    doc.text(formatCurrency(inv.amount), btnX + btnW / 2, btnY + 22, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Click to pay securely online', btnX + btnW / 2, btnY + 30, { align: 'center' });

    // Add clickable link
    doc.link(btnX, btnY, btnW, btnH, { url: paynowUrl });
  } else if (inv.status === 'paid') {
    // Paid stamp
    const stampX = margin + 90;
    const stampY = yPos;
    const stampW = pageWidth - margin - stampX;
    const stampH = 35;

    doc.setFillColor('#D1FAE5');
    doc.roundedRect(stampX, stampY, stampW, stampH, 3, 3, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#065F46');
    doc.text('PAID', stampX + stampW / 2, stampY + 18, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Credit Note Applied', stampX + stampW / 2, stampY + 26, { align: 'center' });
  }

  yPos += 45;

  // ===== FOOTER =====
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(
    `${COMPANY_DETAILS.name} | Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}`,
    pageWidth / 2, pageHeight - 10, { align: 'center' }
  );

  return doc;
}

/**
 * Generate Statement PDF with PayNow links
 */
function generateStatementPDF(): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header
  try {
    doc.addImage(circleTelLogoBase64, 'PNG', margin, yPos, 25, 25);
  } catch {
    doc.setFillColor(COLORS.primary);
    doc.rect(margin, yPos, 25, 25, 'F');
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('STATEMENT', pageWidth - margin, yPos + 10, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, yPos + 18, { align: 'right' });

  yPos += 35;

  // FROM
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('FROM', margin, yPos);
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(COMPANY_DETAILS.name, margin, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`VAT: ${COMPANY_DETAILS.vatNumber}`, margin, yPos);
  yPos += 4;
  doc.text(`${COMPANY_DETAILS.address.line1}, ${COMPANY_DETAILS.address.line2}`, margin, yPos);

  // TO
  const midX = pageWidth / 2;
  let toY = yPos - 14;
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('TO', midX + 10, toY);
  toY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(CUSTOMER.name, midX + 10, toY);
  toY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Account: ${CUSTOMER.accountNumber}`, midX + 10, toY);

  yPos += 12;

  // Divider
  doc.setDrawColor(COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Transaction History
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Transaction History', margin, yPos);
  yPos += 6;

  let balance = 0;
  const txData: string[][] = [];

  INVOICES.forEach(inv => {
    balance += inv.amount;
    txData.push([
      formatDate(inv.invoiceDate),
      inv.invoiceNumber,
      `${inv.periodLabel} Service`,
      formatCurrency(inv.amount),
      '',
      formatCurrency(balance)
    ]);

    if (inv.status === 'paid') {
      balance -= inv.amount;
      txData.push([
        '12/03/2026',
        'CN-2026-00001',
        'Credit Note Applied',
        '',
        formatCurrency(inv.amount),
        formatCurrency(balance)
      ]);
    }
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Ref', 'Description', 'Debit', 'Credit', 'Balance']],
    body: txData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.dark },
    headStyles: { fillColor: COLORS.lightGray, textColor: COLORS.dark, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 }, 1: { cellWidth: 28 }, 2: { cellWidth: 50 },
      3: { cellWidth: 28, halign: 'right' }, 4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Total Due Box
  doc.setFillColor(COLORS.dark);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#9CA3AF');
  doc.text('TOTAL AMOUNT DUE', margin + 8, yPos + 8);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text(formatCurrency(1998.00), pageWidth - margin - 8, yPos + 12, { align: 'right' });

  yPos += 28;

  // Payment Options
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Payment Options', margin, yPos);
  yPos += 8;

  // PayNow buttons for due invoices
  const dueInvoices = INVOICES.filter(i => i.status === 'due');
  const btnWidth = (pageWidth - 2 * margin - 10) / 2;

  dueInvoices.forEach((inv, idx) => {
    const btnX = margin + (idx * (btnWidth + 10));
    const paynowUrl = buildPayNowUrl(inv.paynowRef!, inv.invoiceNumber, inv.amount);

    doc.setFillColor(COLORS.primary);
    doc.roundedRect(btnX, yPos, btnWidth, 22, 3, 3, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.white);
    doc.text(`PAY ${inv.invoiceNumber}`, btnX + btnWidth / 2, yPos + 8, { align: 'center' });

    doc.setFontSize(12);
    doc.text(formatCurrency(inv.amount), btnX + btnWidth / 2, yPos + 17, { align: 'center' });

    doc.link(btnX, yPos, btnWidth, 22, { url: paynowUrl });
  });

  yPos += 32;

  // Bank Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('EFT Details:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`${COMPANY_DETAILS.banking.bankName} | Acc: ${COMPANY_DETAILS.banking.accountNumber} | Branch: ${COMPANY_DETAILS.banking.branchCode} | Ref: ${CUSTOMER.accountNumber}`, margin + 22, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(
    `${COMPANY_DETAILS.name} | Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}`,
    pageWidth / 2, pageHeight - 10, { align: 'center' }
  );

  return doc;
}

/**
 * Build branded email HTML
 */
function buildEmailHTML(): string {
  const dueInvoices = INVOICES.filter(i => i.status === 'due');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Statement - CircleTel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

          <!-- Logo Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #E5E7EB;">
              <img src="https://www.circletel.co.za/images/circletel-logo.png" alt="CircleTel" width="160" style="display: inline-block;">
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1F2937;">Account Statement</h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #6B7280;">Dear ${CUSTOMER.name},</p>
              <p style="margin: 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
                Please find your account statement attached. You have <strong style="color: #1F2937;">2 invoices</strong> requiring payment.
              </p>
            </td>
          </tr>

          <!-- Account Card -->
          <tr>
            <td style="padding: 24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1F2937 0%, #374151 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 4px; font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Account Number</p>
                          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #FFFFFF;">${CUSTOMER.accountNumber}</p>
                        </td>
                        <td style="text-align: right;">
                          <p style="margin: 0 0 4px; font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Total Due</p>
                          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #F5831F;">${formatCurrency(1998.00)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Summary -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Summary</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Invoice</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Period</th>
                    <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Amount</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${INVOICES.map(inv => `
                  <tr style="border-top: 1px solid #E5E7EB;">
                    <td style="padding: 14px 16px; font-size: 14px; color: #1F2937; font-weight: ${inv.status === 'due' ? '600' : '400'};">${inv.invoiceNumber}</td>
                    <td style="padding: 14px 16px; font-size: 14px; color: #4B5563;">${inv.periodLabel}</td>
                    <td style="padding: 14px 16px; font-size: 14px; color: #1F2937; text-align: right; font-weight: ${inv.status === 'due' ? '600' : '400'};">${formatCurrency(inv.amount)}</td>
                    <td style="padding: 14px 16px; text-align: center;">
                      <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; ${inv.status === 'paid' ? 'background-color: #D1FAE5; color: #065F46;' : 'background-color: #FEE2E2; color: #991B1B;'}">${inv.statusLabel}</span>
                    </td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Pay Now Buttons -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px;">Quick Pay</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  ${dueInvoices.map((inv, idx) => `
                  <td style="width: 48%; ${idx === 0 ? 'padding-right: 8px;' : 'padding-left: 8px;'}">
                    <a href="${buildPayNowUrl(inv.paynowRef!, inv.invoiceNumber, inv.amount)}" style="display: block; background-color: #F5831F; color: #FFFFFF; text-decoration: none; padding: 16px; border-radius: 8px; text-align: center;">
                      <span style="display: block; font-size: 12px; font-weight: 500; opacity: 0.9;">${inv.invoiceNumber}</span>
                      <span style="display: block; font-size: 20px; font-weight: 700; margin-top: 4px;">Pay ${formatCurrency(inv.amount)}</span>
                    </a>
                  </td>
                  `).join('')}
                </tr>
              </table>
              <p style="margin: 12px 0 0; font-size: 12px; color: #6B7280; text-align: center;">Secure payment via Card, EFT, or Instant EFT</p>
            </td>
          </tr>

          <!-- Bank Details -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 12px; font-size: 12px; font-weight: 600; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px;">EFT Payment Details</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 4px 0; color: #6B7280; width: 35%;">Bank:</td>
                        <td style="padding: 4px 0; color: #1F2937; font-weight: 500;">${COMPANY_DETAILS.banking.bankName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6B7280;">Account:</td>
                        <td style="padding: 4px 0; color: #1F2937; font-weight: 500;">${COMPANY_DETAILS.banking.accountNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6B7280;">Branch Code:</td>
                        <td style="padding: 4px 0; color: #1F2937; font-weight: 500;">${COMPANY_DETAILS.banking.branchCode}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6B7280;">Reference:</td>
                        <td style="padding: 4px 0; color: #F5831F; font-weight: 600;">${CUSTOMER.accountNumber}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attachments Note -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FEF3C7; border-radius: 8px; border: 1px solid #FCD34D;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 13px; color: #92400E;">
                      <strong>Attached:</strong> Statement PDF and individual Tax Invoices for your records.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0; font-size: 14px; color: #6B7280; text-align: center;">
                Questions? <a href="mailto:contactus@circletel.co.za" style="color: #F5831F; text-decoration: none; font-weight: 500;">contactus@circletel.co.za</a> or WhatsApp <a href="https://wa.me/27824873900" style="color: #F5831F; text-decoration: none; font-weight: 500;">082 487 3900</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #1F2937; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF;">${COMPANY_DETAILS.name}</p>
              <p style="margin: 0; font-size: 11px; color: #6B7280;">Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function main() {
  console.log('Generating branded PDFs with PayNow links...');

  // Generate Statement
  const statementPdf = generateStatementPDF();
  const statementB64 = Buffer.from(statementPdf.output('arraybuffer')).toString('base64');
  console.log('  Statement with PayNow buttons generated');

  // Generate Invoices
  const attachments = [
    { filename: `Statement_${CUSTOMER.accountNumber}_2026-03-12.pdf`, content: statementB64 }
  ];

  for (const inv of INVOICES) {
    const pdf = generateInvoicePDF(inv);
    attachments.push({
      filename: `${inv.invoiceNumber}.pdf`,
      content: Buffer.from(pdf.output('arraybuffer')).toString('base64')
    });
    console.log(`  ${inv.invoiceNumber} with ${inv.status === 'due' ? 'PayNow link' : 'PAID stamp'} generated`);
  }

  // Build email
  const html = buildEmailHTML();

  // Send to Jeffrey
  console.log('\nSending to jeffrey.de.wee@circletel.co.za...');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CircleTel Billing <billing@notify.circletel.co.za>',
      to: ['jeffrey.de.wee@circletel.co.za'],
      subject: `[REVIEW] Prins Mhlanga Statement - Branded Template with PayNow`,
      html,
      reply_to: 'contactus@circletel.co.za',
      attachments,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error('Failed:', err);
    return;
  }

  const result = await response.json();
  console.log(`\nEmail sent! ID: ${result.id}`);
  console.log('\nAttachments with PayNow:');
  attachments.forEach(a => console.log(`  - ${a.filename}`));
}

main().catch(console.error);
