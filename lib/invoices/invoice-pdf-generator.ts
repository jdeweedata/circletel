/**
 * SARS-Compliant Tax Invoice PDF Generator
 *
 * Generates PDF invoices that comply with South African Revenue Service (SARS) requirements:
 * - Supplier details (name, address, VAT number)
 * - Invoice details (number, date, due date)
 * - Customer details (name, address, account number)
 * - Line items with VAT breakdown
 * - Bank details for payment
 *
 * Uses jsPDF with autotable for professional table formatting
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';
import { CONTACT } from '@/lib/constants/contact';

// CircleTel Company Details (SARS requirement: supplier info)
// Address sourced from lib/constants/contact.ts — update there to propagate everywhere.
export const COMPANY_DETAILS = {
  name: CONTACT.PHYSICAL_ADDRESS.name,
  vatNumber: '4380269318',
  registrationNumber: '2008/026404/07',
  address: {
    line1: `${CONTACT.PHYSICAL_ADDRESS.building}, ${CONTACT.PHYSICAL_ADDRESS.street}`,
    line2: CONTACT.PHYSICAL_ADDRESS.suburb,
    province: CONTACT.PHYSICAL_ADDRESS.province,
    postalCode: CONTACT.PHYSICAL_ADDRESS.postalCode,
    country: CONTACT.PHYSICAL_ADDRESS.country,
  },
  contact: {
    email: CONTACT.EMAIL_SUPPORT,
    phone: '+27 10 500 0000',
    website: CONTACT.WEBSITE_SHORT,
  },
  banking: {
    bankName: 'Standard Bank',
    accountName: CONTACT.PHYSICAL_ADDRESS.name,
    accountNumber: '202413993',
    accountType: 'Current',
    branchCode: '051001',
    swiftCode: 'SBZAZAJJ'
  }
};

// Brand colors
const COLORS = {
  primary: '#F5831F',      // CircleTel Orange
  dark: '#1F2937',         // Dark neutral
  gray: '#6B7280',         // Gray text
  lightGray: '#F3F4F6',    // Light background
  white: '#FFFFFF'
};

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;  // Excl VAT
  discount_percent?: number;
  vat_percent: number; // Usually 15%
  excl_total: number;
  incl_total: number;
}

export interface InvoiceCustomer {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  accountNumber?: string;
  businessName?: string;
  businessRegistration?: string;
  businessVatNumber?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;       // YYYY-MM-DD
  dueDate: string;           // YYYY-MM-DD
  paymentReference?: string;
  periodStart?: string;      // For recurring invoices
  periodEnd?: string;
  customer: InvoiceCustomer;
  lineItems: InvoiceLineItem[];
  subtotal: number;          // Excl VAT
  totalDiscount: number;
  totalVat: number;
  total: number;             // Incl VAT
  amountPaid: number;        // Total payments received
  amountDue: number;         // Remaining balance
  notes?: string;
  status?: string;
}

/**
 * Format date as "7 April 2026" (long format matching HTML preview)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format currency as South African Rand
 */
function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Get status badge colors
 */
function getStatusColors(status: string): { bgColor: string; textColor: string } {
  switch (status.toLowerCase()) {
    case 'paid':    return { bgColor: '#DCFCE7', textColor: '#16A34A' };
    case 'overdue': return { bgColor: '#FEE2E2', textColor: '#DC2626' };
    case 'sent':    return { bgColor: '#DBEAFE', textColor: '#1D4ED8' };
    case 'draft':   return { bgColor: '#F3F4F6', textColor: '#6B7280' };
    default:        return { bgColor: '#FEF3C7', textColor: '#D97706' };
  }
}

/**
 * Generate SARS-compliant Tax Invoice PDF — layout matches InvoicePreview.tsx
 */
export function generateInvoicePDF(invoice: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();   // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 15;
  let yPos = margin;

  // ── Helpers ─────────────────────────────────────────────────────

  function drawFooter() {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#9CA3AF');
    doc.text(
      `${COMPANY_DETAILS.name} | Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(
      `${COMPANY_DETAILS.address.line1}, ${COMPANY_DETAILS.address.line2} | ${COMPANY_DETAILS.contact.email} | ${COMPANY_DETAILS.contact.website}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
  }

  function ensureSpace(needed: number): void {
    if (yPos + needed > pageHeight - 25) {
      drawFooter();
      doc.addPage();
      yPos = margin;
    }
  }

  // ============================================================
  // SECTION 1: HEADER — logo left, "TAX INVOICE" + meta right
  // ============================================================

  // Logo (left)
  try {
    doc.addImage(circleTelLogoBase64, 'PNG', margin, yPos, 28, 28);
  } catch {
    doc.setFillColor(COLORS.primary);
    doc.rect(margin, yPos, 28, 28, 'F');
    doc.setTextColor(COLORS.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CT', margin + 9, yPos + 17);
  }

  // Right side: TAX INVOICE + invoice meta
  let rightY = yPos;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(COLORS.dark);
  doc.text('TAX INVOICE', pageWidth - margin, rightY + 7, { align: 'right' });
  rightY += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark);
  doc.text(invoice.invoiceNumber, pageWidth - margin, rightY, { align: 'right' });
  rightY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.gray);
  doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, pageWidth - margin, rightY, { align: 'right' });
  rightY += 5;
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - margin, rightY, { align: 'right' });
  rightY += 5;

  if (invoice.status) {
    const { bgColor, textColor } = getStatusColors(invoice.status);
    const statusText = invoice.status.toUpperCase();
    const badgeWidth = 22;
    const badgeHeight = 5;
    const badgeX = pageWidth - margin - badgeWidth;
    doc.setFillColor(bgColor);
    doc.roundedRect(badgeX, rightY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
    doc.setTextColor(textColor);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, badgeX + badgeWidth / 2, rightY + 3.3, { align: 'center' });
    rightY += 8;
  }

  yPos = Math.max(yPos + 32, rightY) + 4;

  // ============================================================
  // SECTION 2: ORANGE RULE
  // ============================================================
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.7);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ============================================================
  // SECTION 3: FROM / TO — two-column grid
  // ============================================================
  const col2X = 110;
  let leftY = yPos;
  let col2Y = yPos;

  // FROM header
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#9CA3AF');
  doc.text('FROM', margin, leftY);
  leftY += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(COMPANY_DETAILS.name, margin, leftY);
  leftY += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(COMPANY_DETAILS.address.line1, margin, leftY);  leftY += 4;
  doc.text(COMPANY_DETAILS.address.line2, margin, leftY);  leftY += 4;
  doc.text(`${COMPANY_DETAILS.address.province} ${COMPANY_DETAILS.address.postalCode}`, margin, leftY);  leftY += 4;
  doc.text(COMPANY_DETAILS.address.country, margin, leftY);  leftY += 5;
  doc.text(`VAT No: ${COMPANY_DETAILS.vatNumber}`, margin, leftY);  leftY += 4;
  doc.text(`Reg No: ${COMPANY_DETAILS.registrationNumber}`, margin, leftY);  leftY += 4;
  doc.text(COMPANY_DETAILS.contact.email, margin, leftY);  leftY += 4;
  doc.text(COMPANY_DETAILS.contact.website, margin, leftY);  leftY += 4;

  // TO header
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#9CA3AF');
  doc.text('TO', col2X, col2Y);
  col2Y += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(invoice.customer.businessName || invoice.customer.name, col2X, col2Y);
  col2Y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);

  if (invoice.customer.accountNumber) {
    doc.text(`Account: ${invoice.customer.accountNumber}`, col2X, col2Y);  col2Y += 4;
  }
  if (invoice.customer.email) {
    doc.text(invoice.customer.email, col2X, col2Y);  col2Y += 4;
  }
  if (invoice.customer.phone) {
    doc.text(invoice.customer.phone, col2X, col2Y);  col2Y += 4;
  }
  if (invoice.customer.address) {
    const addr = invoice.customer.address;
    if (addr.line1)      { doc.text(addr.line1,      col2X, col2Y);  col2Y += 4; }
    if (addr.line2)      { doc.text(addr.line2,      col2X, col2Y);  col2Y += 4; }
    if (addr.city)       { doc.text(addr.city,       col2X, col2Y);  col2Y += 4; }
    if (addr.province)   { doc.text(addr.province,   col2X, col2Y);  col2Y += 4; }
    if (addr.postalCode) { doc.text(addr.postalCode, col2X, col2Y);  col2Y += 4; }
  }

  yPos = Math.max(leftY, col2Y) + 8;

  // ============================================================
  // SECTION 4: LINE ITEMS TABLE
  // ============================================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('LINE ITEMS', margin, yPos);
  yPos += 4;

  const tableRows = invoice.lineItems.length > 0
    ? invoice.lineItems.map(item => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        `${item.vat_percent}%`,
        formatCurrency(item.excl_total),
        formatCurrency(item.incl_total),
      ])
    : [['Service Invoice', '', '', '', '', '']];

  autoTable(doc, {
    startY: yPos,
    head: [['DESCRIPTION', 'QTY', 'UNIT PRICE (EXCL)', 'VAT %', 'AMOUNT (EXCL)', 'AMOUNT (INCL)']],
    body: tableRows,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: COLORS.dark,
      lineColor: '#E5E7EB',
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: '#F9FAFB',
      textColor: '#4B5563',
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => { drawFooter(); },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // ============================================================
  // SECTION 5: VAT SUMMARY — right-aligned
  // ============================================================
  ensureSpace(32);

  const summaryLabelX = 123;
  const summaryValueX = pageWidth - margin;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('Subtotal (excl VAT)', summaryLabelX, yPos);
  doc.setTextColor(COLORS.dark);
  doc.text(formatCurrency(invoice.subtotal), summaryValueX, yPos, { align: 'right' });
  yPos += 5;

  doc.setTextColor(COLORS.gray);
  doc.text('VAT (15%)', summaryLabelX, yPos);
  doc.setTextColor(COLORS.dark);
  doc.text(formatCurrency(invoice.totalVat), summaryValueX, yPos, { align: 'right' });
  yPos += 4;

  doc.setDrawColor('#E5E7EB');
  doc.setLineWidth(0.2);
  doc.line(summaryLabelX, yPos, summaryValueX, yPos);
  yPos += 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Total (incl VAT)', summaryLabelX, yPos);
  doc.text(formatCurrency(invoice.total), summaryValueX, yPos, { align: 'right' });
  yPos += 10;

  // ============================================================
  // SECTION 6: PAYMENT SUMMARY — right-aligned gray box
  // ============================================================
  ensureSpace(28);

  const payBoxX = 123;
  const payBoxWidth = pageWidth - margin - payBoxX;
  const payBoxHeight = 22;

  doc.setFillColor('#F9FAFB');
  doc.roundedRect(payBoxX, yPos, payBoxWidth, payBoxHeight, 2, 2, 'F');
  doc.setDrawColor('#E5E7EB');
  doc.setLineWidth(0.2);
  doc.roundedRect(payBoxX, yPos, payBoxWidth, payBoxHeight, 2, 2, 'S');

  const payInnerY = yPos + 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('Amount Paid', payBoxX + 3, payInnerY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#16A34A');
  doc.text(formatCurrency(invoice.amountPaid), summaryValueX - 2, payInnerY, { align: 'right' });

  doc.setDrawColor('#E5E7EB');
  doc.line(payBoxX + 3, payInnerY + 4, summaryValueX - 3, payInnerY + 4);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Amount Due', payBoxX + 3, payInnerY + 10);
  doc.setTextColor(invoice.amountDue > 0 ? '#DC2626' : '#16A34A');
  doc.text(formatCurrency(invoice.amountDue), summaryValueX - 2, payInnerY + 10, { align: 'right' });

  yPos += payBoxHeight + 10;

  // ============================================================
  // SECTION 7: BANKING DETAILS — bordered card
  // ============================================================
  ensureSpace(54);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('BANKING DETAILS', margin, yPos);
  yPos += 4;

  const cardHeight = 44;
  doc.setFillColor('#F9FAFB');
  doc.roundedRect(margin, yPos, 180, cardHeight, 2, 2, 'F');
  doc.setDrawColor('#E5E7EB');
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, yPos, 180, cardHeight, 2, 2, 'S');

  const bankLabelX = margin + 5;
  const bankValueX = margin + 44;
  const bankRightLabelX = margin + 95;
  const bankRightValueX = margin + 134;
  let bankY = yPos + 7;

  const bankRows: Array<[string, string, string, string]> = [
    ['Bank',           COMPANY_DETAILS.banking.bankName,     'Branch Code',  COMPANY_DETAILS.banking.branchCode],
    ['Account Name',   COMPANY_DETAILS.banking.accountName,  'Account Type', COMPANY_DETAILS.banking.accountType],
    ['Account Number', COMPANY_DETAILS.banking.accountNumber, 'Reference',   invoice.customer.accountNumber ?? invoice.invoiceNumber],
  ];

  bankRows.forEach(([leftLabel, leftValue, rightLabel, rightValue]) => {
    doc.setFontSize(8);

    // Left: label
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(leftLabel, bankLabelX, bankY);

    // Left: value
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text(leftValue, bankValueX, bankY);

    // Right: label
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(rightLabel, bankRightLabelX, bankY);

    // Right: value (reference in orange)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rightLabel === 'Reference' ? COLORS.primary : COLORS.dark);
    doc.text(rightValue, bankRightValueX, bankY);

    bankY += 7;
  });

  // Reference note below the grid
  const payRef = invoice.customer.accountNumber ?? invoice.invoiceNumber;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  const noteLabel = 'Please use your account number as payment reference: ';
  doc.text(noteLabel, bankLabelX, bankY);
  const noteLabelWidth = doc.getTextWidth(noteLabel);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(payRef, bankLabelX + noteLabelWidth, bankY);

  yPos += cardHeight + 8;

  // ============================================================
  // SECTION 8: NOTES (conditional)
  // ============================================================
  if (invoice.notes) {
    const noteLines = doc.splitTextToSize(invoice.notes, 172);
    const noteCardHeight = noteLines.length * 4.5 + 10;
    ensureSpace(noteCardHeight + 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text('NOTES', margin, yPos);
    yPos += 4;

    doc.setFillColor('#F9FAFB');
    doc.roundedRect(margin, yPos, 180, noteCardHeight, 2, 2, 'F');
    doc.setDrawColor('#E5E7EB');
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, yPos, 180, noteCardHeight, 2, 2, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(noteLines, margin + 4, yPos + 6);
    yPos += noteCardHeight + 8;
  }

  // ============================================================
  // FOOTER — company registration, VAT, contact
  // ============================================================
  drawFooter();

  return doc;
}

/**
 * Generate PDF and return as base64 string
 */
export function generateInvoicePDFBase64(invoice: InvoiceData): string {
  const doc = generateInvoicePDF(invoice);
  return doc.output('datauristring');
}

/**
 * Generate PDF and return as Blob
 */
export function generateInvoicePDFBlob(invoice: InvoiceData): Blob {
  const doc = generateInvoicePDF(invoice);
  return doc.output('blob');
}

/**
 * Generate PDF and return as ArrayBuffer (for server-side storage)
 */
export function generateInvoicePDFBuffer(invoice: InvoiceData): ArrayBuffer {
  const doc = generateInvoicePDF(invoice);
  return doc.output('arraybuffer');
}

/**
 * Build invoice data from database records.
 * Helper function to transform DB data to InvoiceData format.
 *
 * NOTE: unit_price stored in customer_invoices.line_items is EXCL VAT.
 * Multiply by 1.15 to get incl-VAT totals.
 */
export function buildInvoiceData(params: {
  invoice: {
    id: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    period_start?: string;
    period_end?: string;
    subtotal: number;
    tax_amount?: number;  // Actual DB column name
    vat_amount?: number;  // Legacy/alias support
    total_amount: number;
    line_items: any[];
    notes?: string;
    status?: string;
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    account_number?: string;
    business_name?: string;
    business_registration?: string;
    tax_number?: string;
  };
  order?: {
    installation_address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  };
}): InvoiceData {
  const { invoice, customer, order } = params;

  // Transform line items.
  // unit_price in line_items is EXCL VAT — multiply forward for incl totals.
  const VAT_RATE = 0.15;
  const lineItems: InvoiceLineItem[] = (invoice.line_items || []).map((item: any) => {
    const exclUnitPrice = parseFloat(String(item.unit_price ?? item.amount ?? 0));
    const quantity = Number(item.quantity ?? 1);
    const discountPercent = Number(item.discount_percent ?? 0);
    const vatPercent = 15;

    const exclTotal = Math.round(exclUnitPrice * quantity * (1 - discountPercent / 100) * 100) / 100;
    const inclTotal = Math.round(exclTotal * (1 + VAT_RATE) * 100) / 100;

    return {
      description: item.description || 'Service',
      quantity,
      unit_price: exclUnitPrice,
      discount_percent: discountPercent,
      vat_percent: vatPercent,
      excl_total: exclTotal,
      incl_total: inclTotal,
    };
  });

  return {
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    paymentReference: customer.account_number || invoice.invoice_number,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    customer: {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      accountNumber: customer.account_number,
      businessName: customer.business_name,
      businessRegistration: customer.business_registration,
      businessVatNumber: customer.tax_number,
      address: order ? {
        line1: order.installation_address,
        city: order.city,
        province: order.province,
        postalCode: order.postal_code
      } : undefined
    },
    lineItems,
    subtotal: invoice.subtotal,
    totalDiscount: 0,
    totalVat: invoice.tax_amount ?? invoice.vat_amount ?? 0,
    total: invoice.total_amount,
    amountPaid: 0,                   // Override from DB after calling this function
    amountDue: invoice.total_amount, // Override from DB after calling this function
    notes: invoice.notes,
    status: invoice.status
  };
}
