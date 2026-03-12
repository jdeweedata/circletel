/**
 * Send Prins Mhlanga Statement & Invoices to Jeffrey
 *
 * Usage: npx ts-node scripts/send-jeffrey-prins-docs.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  generateInvoicePDF,
  InvoiceData,
  COMPANY_DETAILS
} from '../lib/invoices/invoice-pdf-generator';
import { circleTelLogoBase64 } from '../lib/quotes/circletel-logo-base64';

config({ path: resolve(process.cwd(), '.env.production.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const COLORS = {
  primary: '#F5831F',
  dark: '#1F2937',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
};

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
  },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateStatementPDF(): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header with logo
  try {
    doc.addImage(circleTelLogoBase64, 'PNG', margin, yPos, 25, 25);
  } catch {
    doc.setFillColor(COLORS.primary);
    doc.rect(margin, yPos, 25, 25, 'F');
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('STATEMENT', pageWidth - margin, yPos + 10, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, yPos + 18, { align: 'right' });

  yPos += 35;

  // FROM section
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('FROM', margin, yPos);
  yPos += 5;
  doc.setFontSize(11);
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

  // TO section
  const midX = pageWidth / 2;
  let toY = yPos - 22;
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('TO', midX + 10, toY);
  toY += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(CUSTOMER.name, midX + 10, toY);
  toY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Account: ${CUSTOMER.accountNumber}`, midX + 10, toY);

  yPos += 15;

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
      `${inv.periodLabel} - Monthly Service`,
      formatCurrency(inv.amount),
      '',
      formatCurrency(balance)
    ]);

    if (inv.status === 'paid') {
      balance -= inv.amount;
      txData.push([
        formatDate('2026-03-12'),
        'CN-2026-00001',
        'Credit Note - January waived',
        '',
        formatCurrency(inv.amount),
        formatCurrency(balance)
      ]);
    }
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']],
    body: txData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.dark },
    headStyles: { fillColor: COLORS.lightGray, textColor: COLORS.dark, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 }, 1: { cellWidth: 28 }, 2: { cellWidth: 58 },
      3: { cellWidth: 25, halign: 'right' }, 4: { cellWidth: 25, halign: 'right' }, 5: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Aging Summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Aging Summary', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Current', '30 Days', '60 Days', '90 Days', '120+ Days', 'Total Due']],
    body: [[formatCurrency(1998), formatCurrency(0), formatCurrency(0), formatCurrency(0), formatCurrency(0), formatCurrency(1998)]],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4, textColor: COLORS.dark, halign: 'center' },
    headStyles: { fillColor: COLORS.lightGray, textColor: COLORS.dark, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Payment Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Payment Details', margin, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Bank: ${COMPANY_DETAILS.banking.bankName}`, margin, yPos);
  yPos += 4;
  doc.text(`Account: ${COMPANY_DETAILS.banking.accountNumber}`, margin, yPos);
  yPos += 4;
  doc.text(`Branch: ${COMPANY_DETAILS.banking.branchCode}`, margin, yPos);
  yPos += 4;
  doc.text(`Reference: ${CUSTOMER.accountNumber}`, margin, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(
    `${COMPANY_DETAILS.name} | Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}`,
    pageWidth / 2, pageHeight - 10, { align: 'center' }
  );

  return doc;
}

function generateInvoice(inv: typeof INVOICES[0]): jsPDF {
  const data: InvoiceData = {
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    periodStart: inv.periodStart,
    periodEnd: inv.periodEnd,
    customer: { name: CUSTOMER.name, email: CUSTOMER.email, accountNumber: CUSTOMER.accountNumber },
    lineItems: [{
      description: `Internet Service - ${inv.periodLabel}`,
      quantity: 1,
      unit_price: 868.70,
      vat_percent: 15,
      excl_total: 868.70,
      incl_total: 999.00
    }],
    subtotal: 868.70,
    totalDiscount: 0,
    totalVat: 130.30,
    total: 999.00,
    status: inv.status
  };
  return generateInvoicePDF(data);
}

async function main() {
  console.log('Generating PDFs for Prins Mhlanga...');

  // Generate Statement
  const statementPdf = generateStatementPDF();
  const statementB64 = Buffer.from(statementPdf.output('arraybuffer')).toString('base64');
  console.log('  Statement generated');

  // Generate Invoices
  const attachments = [
    { filename: `Statement_${CUSTOMER.accountNumber}_2026-03-12.pdf`, content: statementB64 }
  ];

  for (const inv of INVOICES) {
    const pdf = generateInvoice(inv);
    attachments.push({
      filename: `${inv.invoiceNumber}.pdf`,
      content: Buffer.from(pdf.output('arraybuffer')).toString('base64')
    });
    console.log(`  ${inv.invoiceNumber} generated`);
  }

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
      subject: `[INTERNAL] Prins Mhlanga Statement & Invoices - ${CUSTOMER.accountNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1F2937;">Prins Mhlanga Account Documents</h2>
          <p style="color: #4B5563;">Account: <strong>${CUSTOMER.accountNumber}</strong></p>

          <h3 style="color: #1F2937; margin-top: 24px;">Attached Documents:</h3>
          <ul style="color: #4B5563;">
            <li>Statement (${formatDate(new Date().toISOString())})</li>
            <li>INV-2026-00001 - January 2026 (PAID via credit note)</li>
            <li>INV-2026-00005 - February 2026 (DUE - R999.00)</li>
            <li>INV-2026-00003 - March 2026 (DUE - R999.00)</li>
          </ul>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="margin: 0; color: #92400E;"><strong>Total Outstanding: R1,998.00</strong></p>
          </div>

          <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
            This is an internal copy for your records.
          </p>
        </div>
      `,
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
  console.log('\nAttachments:');
  attachments.forEach(a => console.log(`  - ${a.filename}`));
}

main().catch(console.error);
