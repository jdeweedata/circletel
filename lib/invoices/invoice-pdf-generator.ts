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

// CircleTel Company Details (SARS requirement: supplier info)
export const COMPANY_DETAILS = {
  name: 'CircleTel (Pty) Ltd',
  vatNumber: '4380269318',
  registrationNumber: '2024/123456/07',
  address: {
    line1: 'Unit 5, Highveld Techno Park',
    line2: 'Centurion',
    province: 'Gauteng',
    postalCode: '0157',
    country: 'South Africa'
  },
  contact: {
    email: 'support@circletel.co.za',
    phone: '+27 12 345 6789',
    website: 'www.circletel.co.za'
  },
  banking: {
    bankName: 'First National Bank',
    accountName: 'CircleTel (Pty) Ltd',
    accountNumber: '62123456789',
    accountType: 'Business Current',
    branchCode: '250655',
    swiftCode: 'FIRNZAJJ'
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
  notes?: string;
  status?: string;
}

/**
 * Format date as DD/MM/YYYY (South African format)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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
 * Generate SARS-compliant Tax Invoice PDF
 */
export function generateInvoicePDF(invoice: InvoiceData): jsPDF {
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
  // HEADER SECTION - Company Logo/Name
  // ============================================

  // Company name (as logo placeholder - you can replace with actual logo)
  doc.setFillColor(COLORS.primary);
  doc.rect(margin, yPos, 60, 12, 'F');
  doc.setTextColor(COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CircleTel', margin + 5, yPos + 8);

  yPos += 20;

  // ============================================
  // COMPANY DETAILS (Left) & INVOICE INFO (Right)
  // ============================================

  // Company details - left side
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_DETAILS.name, margin, yPos);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  yPos += 5;
  doc.text(`VAT# ${COMPANY_DETAILS.vatNumber}`, margin, yPos);
  yPos += 4;
  doc.text(COMPANY_DETAILS.address.line1, margin, yPos);
  yPos += 4;
  doc.text(COMPANY_DETAILS.address.line2, margin, yPos);
  yPos += 4;
  doc.text(`${COMPANY_DETAILS.address.province}, ${COMPANY_DETAILS.address.postalCode}`, margin, yPos);

  // Invoice details - right side
  const rightCol = pageWidth - margin - 60;
  const labelCol = rightCol;
  const valueCol = rightCol + 40;
  let rightYPos = 40;

  doc.setTextColor(COLORS.gray);
  doc.setFontSize(9);

  const invoiceDetails = [
    ['Invoice Number:', invoice.invoiceNumber],
    ['Invoice Date:', formatDate(invoice.invoiceDate)],
    ['Account Number:', invoice.customer.accountNumber || 'N/A'],
    ['Payment Reference #:', invoice.paymentReference || invoice.invoiceNumber],
    ['Due Date:', formatDate(invoice.dueDate)],
  ];

  // Add business details if available
  if (invoice.customer.businessRegistration) {
    invoiceDetails.push(['Business Registration #:', invoice.customer.businessRegistration]);
  }
  if (invoice.customer.businessVatNumber) {
    invoiceDetails.push(['Business VAT #:', invoice.customer.businessVatNumber]);
  }

  invoiceDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, labelCol, rightYPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text(value, valueCol, rightYPos);
    doc.setTextColor(COLORS.gray);
    rightYPos += 5;
  });

  yPos = Math.max(yPos, rightYPos) + 10;

  // ============================================
  // DIVIDER LINE
  // ============================================
  doc.setDrawColor(COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ============================================
  // TAX INVOICE TITLE & CUSTOMER DETAILS
  // ============================================

  doc.setTextColor(COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Invoice', margin, yPos);
  yPos += 8;

  // Customer name
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.customer.businessName || invoice.customer.name, margin, yPos);
  yPos += 6;

  // Customer address
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);

  if (invoice.customer.address) {
    if (invoice.customer.address.province) {
      doc.text(invoice.customer.address.province, margin, yPos);
      yPos += 4;
    }
    if (invoice.customer.address.line1 || invoice.customer.address.city) {
      doc.text(invoice.customer.address.line1 || invoice.customer.address.city || '', margin, yPos);
      yPos += 4;
    }
    if (invoice.customer.address.postalCode) {
      doc.text(invoice.customer.address.postalCode, margin, yPos);
      yPos += 4;
    }
  }

  yPos += 6;

  // ============================================
  // DIVIDER LINE
  // ============================================
  doc.setDrawColor(COLORS.lightGray);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ============================================
  // INVOICE DETAIL SECTION HEADER
  // ============================================
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Detail', margin, yPos);
  yPos += 6;

  // ============================================
  // LINE ITEMS TABLE
  // ============================================

  const tableHeaders = [
    'DESCRIPTION',
    'QTY',
    'EXCL. PRICE',
    'DISC %',
    'VAT %',
    'EXCL. TOTAL',
    'INCL. TOTAL'
  ];

  const tableData = invoice.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    `${item.discount_percent || 0}%`,
    `${item.vat_percent}%`,
    formatCurrency(item.excl_total),
    formatCurrency(item.incl_total)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.dark,
      lineColor: COLORS.lightGray,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: COLORS.white,
      textColor: COLORS.gray,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 60 },  // Description
      1: { cellWidth: 15, halign: 'center' },  // QTY
      2: { cellWidth: 25, halign: 'right' },   // EXCL. PRICE
      3: { cellWidth: 15, halign: 'center' },  // DISC %
      4: { cellWidth: 15, halign: 'center' },  // VAT %
      5: { cellWidth: 25, halign: 'right' },   // EXCL. TOTAL
      6: { cellWidth: 25, halign: 'right' }    // INCL. TOTAL
    },
    margin: { left: margin, right: margin }
  });

  // Get the Y position after the table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================
  // BANK DETAILS (Left) & TOTALS (Right)
  // ============================================

  const bankDetailsX = margin;
  const totalsX = pageWidth - margin - 70;
  const totalsValueX = pageWidth - margin;

  // Bank Details - Left side
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.setFont('helvetica', 'normal');

  doc.text(`Bank Details: ${COMPANY_DETAILS.banking.accountName}`, bankDetailsX, yPos);
  doc.text(`Bank: ${COMPANY_DETAILS.banking.bankName}`, bankDetailsX, yPos + 4);
  doc.text(`Acc No: ${COMPANY_DETAILS.banking.accountNumber}`, bankDetailsX, yPos + 8);
  doc.text(`Acc Type: ${COMPANY_DETAILS.banking.accountType}`, bankDetailsX, yPos + 12);
  doc.text(`Branch Code: ${COMPANY_DETAILS.banking.branchCode}`, bankDetailsX, yPos + 16);
  doc.text(`Payment Reference #: ${invoice.paymentReference || invoice.customer.accountNumber || invoice.invoiceNumber}`, bankDetailsX, yPos + 20);

  // Totals - Right side
  doc.setFontSize(9);
  const totals = [
    ['Total Discount:', formatCurrency(invoice.totalDiscount)],
    ['Total (Excl VAT):', formatCurrency(invoice.subtotal)],
    ['Total VAT:', formatCurrency(invoice.totalVat)],
    ['Sub Total:', formatCurrency(invoice.total)]
  ];

  let totalsYPos = yPos;
  totals.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.gray);
    doc.text(label, totalsX, totalsYPos, { align: 'left' });
    doc.setTextColor(COLORS.dark);
    doc.text(value, totalsValueX, totalsYPos, { align: 'right' });
    totalsYPos += 5;
  });

  // Grand Total (larger, emphasized)
  totalsYPos += 5;
  doc.setDrawColor(COLORS.dark);
  doc.setLineWidth(0.3);
  doc.line(totalsX, totalsYPos - 3, totalsValueX, totalsYPos - 3);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('Total:', totalsX, totalsYPos + 3);
  doc.text(formatCurrency(invoice.total), totalsValueX, totalsYPos + 3, { align: 'right' });

  yPos = Math.max(yPos + 30, totalsYPos + 15);

  // ============================================
  // FOOTER MESSAGE
  // ============================================

  // Draw footer box
  const footerY = yPos + 10;
  doc.setFillColor('#F9FAFB');
  doc.roundedRect(margin, footerY, pageWidth - (margin * 2), 20, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.setFont('helvetica', 'bold');
  doc.text('Please remember – ', margin + 5, footerY + 8);

  doc.setFont('helvetica', 'normal');
  const footerText = 'you can manage your account 24/7 in our Client Zone; view invoices, update details, change services and log support tickets at circletel.co.za/dashboard.';
  doc.text(footerText, margin + 35, footerY + 8);

  // ============================================
  // PAGE FOOTER - SARS Compliance Notice
  // ============================================

  doc.setFontSize(7);
  doc.setTextColor(COLORS.gray);
  doc.text(
    `This is a valid Tax Invoice as per SARS requirements. | Company Reg: ${COMPANY_DETAILS.registrationNumber} | VAT: ${COMPANY_DETAILS.vatNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

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
 * Build invoice data from database records
 * Helper function to transform DB data to InvoiceData format
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

  // Transform line items
  const lineItems: InvoiceLineItem[] = (invoice.line_items || []).map((item: any) => {
    const unitPrice = item.unit_price || item.amount || 0;
    const quantity = item.quantity || 1;
    const discountPercent = item.discount_percent || 0;
    const vatPercent = 15; // SA VAT rate

    const exclTotal = unitPrice * quantity * (1 - discountPercent / 100);
    const inclTotal = exclTotal * (1 + vatPercent / 100);

    return {
      description: item.description || 'Service',
      quantity,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      vat_percent: vatPercent,
      excl_total: Math.round(exclTotal * 100) / 100,
      incl_total: Math.round(inclTotal * 100) / 100
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
    totalDiscount: 0, // Can be calculated from line items if needed
    totalVat: invoice.tax_amount ?? invoice.vat_amount ?? 0,  // Support both column names
    total: invoice.total_amount,
    notes: invoice.notes,
    status: invoice.status
  };
}
