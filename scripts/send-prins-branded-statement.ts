/**
 * Send Prins Mhlanga Account Statement with CircleTel Branding
 *
 * - Generates PDF invoices using CircleTel invoice generator
 * - Generates PDF statement using CircleTel branding
 * - Sends professional email with PDF attachments
 *
 * Usage: npx ts-node scripts/send-prins-branded-statement.ts
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

// Load environment variables
config({ path: resolve(process.cwd(), '.env.production.local') });
config({ path: resolve(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CLICKATELL_API_KEY = process.env.CLICKATELL_API_KEY;

// Brand colors (from invoice-pdf-generator)
const COLORS = {
  primary: '#F5831F',      // CircleTel Orange (accent only)
  dark: '#1F2937',         // Dark text
  gray: '#6B7280',         // Secondary text
  lightGray: '#F3F4F6',    // Light background
  white: '#FFFFFF',
  green: '#059669',        // Success/Paid
  red: '#DC2626',          // Due/Overdue
};

// Customer data
const CUSTOMER = {
  id: '479e39fb-a111-4f8a-a62f-253d3568d00e',
  name: 'Prins Mhlanga',
  accountNumber: 'CT-2025-00030',
  email: 'prins.mhlanga@ocean76.com',
  phone: '27829910287',
};

// PA data
const PA = {
  name: 'Lara Buzzi',
  email: 'lara.buzzi@ocean76.com',
  phone: '27719923974',
};

// Jeffrey for CC
const JEFFREY = {
  name: 'Jeffrey de Wee',
  email: 'jeffrey.de.wee@circletel.co.za',
};

// Invoices data
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
    creditNote: 'CN-2026-00001',
    creditReason: 'January billing waived due to installation delays',
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

// PayNow URLs
const PAYNOW_BASE = 'https://paynow.netcash.co.za/site/paynow.aspx';
const SERVICE_KEY = '65251ca3-95d8-47da-bbeb-d7fad8cd9ef1';
const PCI_VAULT_KEY = '6940844b-ea39-44a5-b929-427b205e457e';

function buildPayNowUrl(ref: string, invoiceNumber: string, amount: number): string {
  return `${PAYNOW_BASE}?m1=${SERVICE_KEY}&m2=${PCI_VAULT_KEY}&p2=${ref}&p3=${encodeURIComponent(`CircleTel - ${invoiceNumber}`)}&p4=${amount.toFixed(2)}`;
}

// Short URLs for SMS
const SHORT_URLS = {
  'INV-2026-00005': 'https://www.circletel.co.za/api/paynow/CT-INV2026-00005-1773320769',
  'INV-2026-00003': 'https://www.circletel.co.za/api/paynow/CT-INV2026-00003-1773319726',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Generate Statement PDF with CircleTel branding
 */
function generateStatementPDF(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // ============================================
  // HEADER - Logo + STATEMENT
  // ============================================

  // Add CircleTel logo
  try {
    doc.addImage(circleTelLogoBase64, 'PNG', margin, yPos, 25, 25);
  } catch (e) {
    doc.setFillColor(COLORS.primary);
    doc.rect(margin, yPos, 25, 25, 'F');
    doc.setTextColor(COLORS.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CT', margin + 7, yPos + 15);
  }

  // STATEMENT title - right aligned
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('STATEMENT', pageWidth - margin, yPos + 10, { align: 'right' });

  // Statement date - right aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - margin, yPos + 18, { align: 'right' });

  yPos += 35;

  // ============================================
  // FROM / TO SECTIONS
  // ============================================

  const midX = pageWidth / 2;

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

  // TO section - right column
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

  // ============================================
  // DIVIDER
  // ============================================
  doc.setDrawColor(COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ============================================
  // TRANSACTIONS TABLE
  // ============================================

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Transaction History', margin, yPos);
  yPos += 6;

  const txHeaders = ['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'];

  let runningBalance = 0;
  const txData: string[][] = [];

  // Add each invoice as a debit
  INVOICES.forEach(inv => {
    runningBalance += inv.amount;
    txData.push([
      formatDate(inv.invoiceDate),
      inv.invoiceNumber,
      `${inv.periodLabel} - Monthly Service`,
      formatCurrency(inv.amount),
      '',
      formatCurrency(runningBalance)
    ]);

    // If paid (credit note), add credit
    if (inv.status === 'paid' && inv.creditNote) {
      runningBalance -= inv.amount;
      txData.push([
        formatDate('2026-03-12'),
        inv.creditNote!,
        inv.creditReason!,
        '',
        formatCurrency(inv.amount),
        formatCurrency(runningBalance)
      ]);
    }
  });

  autoTable(doc, {
    startY: yPos,
    head: [txHeaders],
    body: txData,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.dark,
      lineColor: COLORS.lightGray,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: COLORS.lightGray,
      textColor: COLORS.dark,
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      2: { cellWidth: 58 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ============================================
  // AGING SUMMARY
  // ============================================

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Aging Summary', margin, yPos);
  yPos += 6;

  const agingHeaders = ['Current', '30 Days', '60 Days', '90 Days', '120+ Days', 'Total Due'];
  // Both invoices are current (less than 30 days overdue as of March 12)
  const agingData = [
    formatCurrency(1998.00),  // Current
    formatCurrency(0),        // 30 days
    formatCurrency(0),        // 60 days
    formatCurrency(0),        // 90 days
    formatCurrency(0),        // 120+ days
    formatCurrency(1998.00)   // Total
  ];

  autoTable(doc, {
    startY: yPos,
    head: [agingHeaders],
    body: [agingData],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.dark,
      halign: 'center'
    },
    headStyles: {
      fillColor: COLORS.lightGray,
      textColor: COLORS.dark,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      5: { fontStyle: 'bold', textColor: COLORS.red }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ============================================
  // PAYMENT DETAILS
  // ============================================

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
  doc.text(`Account Name: ${COMPANY_DETAILS.banking.accountName}`, margin, yPos);
  yPos += 4;
  doc.text(`Account Number: ${COMPANY_DETAILS.banking.accountNumber}`, margin, yPos);
  yPos += 4;
  doc.text(`Branch Code: ${COMPANY_DETAILS.banking.branchCode}`, margin, yPos);
  yPos += 4;
  doc.text(`Reference: ${CUSTOMER.accountNumber}`, margin, yPos);

  // ============================================
  // FOOTER
  // ============================================

  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text(
    `${COMPANY_DETAILS.name} | Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
}

/**
 * Generate Invoice PDF
 */
function generateInvoice(inv: typeof INVOICES[0]): jsPDF {
  const invoiceData: InvoiceData = {
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    periodStart: inv.periodStart,
    periodEnd: inv.periodEnd,
    customer: {
      name: CUSTOMER.name,
      email: CUSTOMER.email,
      accountNumber: CUSTOMER.accountNumber,
    },
    lineItems: [{
      description: `Internet Service - ${inv.periodLabel}`,
      quantity: 1,
      unit_price: 868.70,  // Excl VAT
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

  return generateInvoicePDF(invoiceData);
}

/**
 * Build professional email HTML with CircleTel branding
 */
function buildEmailHTML(): string {
  const totalDue = 1998.00;
  const dueInvoices = INVOICES.filter(i => i.status === 'due');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Statement - CircleTel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #E5E7EB;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <img src="https://www.circletel.co.za/images/circletel-logo.png" alt="CircleTel" width="140" style="display: block;">
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 24px; font-weight: 700; color: #1F2937;">STATEMENT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #1F2937;">Dear ${CUSTOMER.name},</p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #4B5563; line-height: 1.6;">
                Please find your account statement below. Your prompt attention to the outstanding balance would be appreciated.
              </p>
            </td>
          </tr>

          <!-- Account Summary Box -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 50%; padding-right: 10px;">
                          <p style="margin: 0 0 4px; font-size: 12px; color: #6B7280; text-transform: uppercase;">Account Number</p>
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937;">${CUSTOMER.accountNumber}</p>
                        </td>
                        <td style="width: 50%; padding-left: 10px; text-align: right;">
                          <p style="margin: 0 0 4px; font-size: 12px; color: #6B7280; text-transform: uppercase;">Statement Date</p>
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937;">${formatDate(new Date().toISOString())}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Table -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Summary</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Invoice</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Period</th>
                    <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Amount</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${INVOICES.map(inv => `
                  <tr style="border-top: 1px solid #E5E7EB;${inv.status === 'due' ? ' background-color: #FEF9E7;' : ''}">
                    <td style="padding: 14px 16px; font-size: 14px; color: #1F2937;${inv.status === 'due' ? ' font-weight: 600;' : ''}">${inv.invoiceNumber}</td>
                    <td style="padding: 14px 16px; font-size: 14px; color: #4B5563;">${inv.periodLabel}</td>
                    <td style="padding: 14px 16px; font-size: 14px; color: #1F2937; text-align: right;${inv.status === 'due' ? ' font-weight: 600;' : ''}">${formatCurrency(inv.amount)}</td>
                    <td style="padding: 14px 16px; text-align: center;">
                      <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600;${inv.status === 'paid' ? ' background-color: #D1FAE5; color: #065F46;' : ' background-color: #FEE2E2; color: #991B1B;'}">${inv.statusLabel}</span>
                    </td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Credit Note -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ECFDF5; border-radius: 8px; border: 1px solid #A7F3D0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #065F46;">CN-2026-00001 applied to INV-2026-00001</p>
                    <p style="margin: 0; font-size: 13px; color: #047857;">January billing (R999.00) waived due to installation delays</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Total Due -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1F2937; border-radius: 8px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Total Amount Due</p>
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #F5831F;">${formatCurrency(totalDue)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pay Now Buttons -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px;">Quick Pay</h2>
              ${dueInvoices.map(inv => `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                <tr>
                  <td>
                    <a href="${buildPayNowUrl(inv.paynowRef!, inv.invoiceNumber, inv.amount)}" style="display: block; background-color: #F5831F; color: #FFFFFF; text-decoration: none; padding: 16px 24px; border-radius: 8px; text-align: center; font-size: 15px; font-weight: 600;">
                      Pay ${inv.invoiceNumber} - ${formatCurrency(inv.amount)}
                    </a>
                  </td>
                </tr>
              </table>
              `).join('')}
              <p style="margin: 8px 0 0; font-size: 12px; color: #6B7280; text-align: center;">Secure payment via Card, EFT, or Instant EFT</p>
            </td>
          </tr>

          <!-- Bank Details -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1F2937; text-transform: uppercase; letter-spacing: 0.5px;">EFT Payment Details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #4B5563;">
                      <tr><td style="padding: 4px 0; width: 40%;">Bank:</td><td style="padding: 4px 0; font-weight: 500; color: #1F2937;">${COMPANY_DETAILS.banking.bankName}</td></tr>
                      <tr><td style="padding: 4px 0;">Account Name:</td><td style="padding: 4px 0; font-weight: 500; color: #1F2937;">${COMPANY_DETAILS.banking.accountName}</td></tr>
                      <tr><td style="padding: 4px 0;">Account Number:</td><td style="padding: 4px 0; font-weight: 500; color: #1F2937;">${COMPANY_DETAILS.banking.accountNumber}</td></tr>
                      <tr><td style="padding: 4px 0;">Branch Code:</td><td style="padding: 4px 0; font-weight: 500; color: #1F2937;">${COMPANY_DETAILS.banking.branchCode}</td></tr>
                      <tr><td style="padding: 4px 0;">Reference:</td><td style="padding: 4px 0; font-weight: 600; color: #F5831F;">${CUSTOMER.accountNumber}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                Questions? Contact us at <a href="mailto:contactus@circletel.co.za" style="color: #F5831F; text-decoration: none;">contactus@circletel.co.za</a> or WhatsApp <a href="https://wa.me/27824873900" style="color: #F5831F; text-decoration: none;">082 487 3900</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                ${COMPANY_DETAILS.name}<br>
                Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}
              </p>
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

/**
 * Send email with PDF attachments
 */
async function sendEmail(
  to: string[],
  subject: string,
  html: string,
  attachments: { filename: string; content: string }[]
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel Billing <billing@notify.circletel.co.za>',
        to,
        subject,
        html,
        reply_to: 'contactus@circletel.co.za',
        attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Email failed:', error);
      return false;
    }

    const result = await response.json();
    console.log(`Email sent! ID: ${result.id}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

/**
 * Send SMS
 */
async function sendSMS(to: string, text: string): Promise<boolean> {
  if (!CLICKATELL_API_KEY) {
    console.error('CLICKATELL_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://platform.clickatell.com/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': CLICKATELL_API_KEY,
      },
      body: JSON.stringify({
        messages: [{ channel: 'sms', to, content: text }],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.messages?.[0]?.error) {
      console.error('SMS failed:', data);
      return false;
    }

    console.log(`SMS sent to ${to}! ID: ${data.messages[0].apiMessageId}`);
    return true;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('CircleTel - Prins Mhlanga Statement (Branded)');
  console.log('='.repeat(60));
  console.log('');

  // Generate PDFs
  console.log('Generating PDFs...');

  // Statement
  const statementPdf = generateStatementPDF();
  const statementBase64 = Buffer.from(statementPdf.output('arraybuffer')).toString('base64');
  console.log('  Statement PDF generated');

  // Invoices (only the due ones)
  const attachments: { filename: string; content: string }[] = [
    {
      filename: `Statement_${CUSTOMER.accountNumber}_${new Date().toISOString().slice(0,10)}.pdf`,
      content: statementBase64
    }
  ];

  for (const inv of INVOICES.filter(i => i.status === 'due')) {
    const pdf = generateInvoice(inv);
    const base64 = Buffer.from(pdf.output('arraybuffer')).toString('base64');
    attachments.push({
      filename: `${inv.invoiceNumber}.pdf`,
      content: base64
    });
    console.log(`  ${inv.invoiceNumber} PDF generated`);
  }

  // Build email
  const html = buildEmailHTML();
  const subject = `[ACTION REQUIRED] Account Statement - ${formatCurrency(1998.00)} Due - ${CUSTOMER.accountNumber}`;

  // Send to all recipients
  console.log('');
  console.log('Sending emails...');

  const allRecipients = [CUSTOMER.email, PA.email, JEFFREY.email];
  const emailSent = await sendEmail(allRecipients, subject, html, attachments);

  if (emailSent) {
    console.log(`  Sent to: ${allRecipients.join(', ')}`);
  }

  // Send SMS
  console.log('');
  console.log('Sending SMS notifications...');

  const prinsSms = `Hi Prins, your CircleTel statement shows R1,998.00 due. Pay Feb: ${SHORT_URLS['INV-2026-00005']} Pay Mar: ${SHORT_URLS['INV-2026-00003']} - CircleTel`;
  await sendSMS(CUSTOMER.phone, prinsSms);

  const laraSms = `Hi Lara, Prins Mhlanga's CircleTel statement (R1,998.00) sent. Feb: ${SHORT_URLS['INV-2026-00005']} Mar: ${SHORT_URLS['INV-2026-00003']} - CircleTel`;
  await sendSMS(PA.phone, laraSms);

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary:');
  console.log(`  Account: ${CUSTOMER.accountNumber}`);
  console.log(`  Total Due: ${formatCurrency(1998.00)}`);
  console.log(`  Invoices: INV-2026-00005 (Feb), INV-2026-00003 (Mar)`);
  console.log(`  Recipients: ${allRecipients.join(', ')}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
