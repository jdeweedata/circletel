/**
 * Customer Statement PDF Generator
 * Generates professional statements matching CircleTel brand style
 *
 * Features:
 * - Company logo and details
 * - Customer billing information
 * - Transaction history (invoices, payments, credits)
 * - Aging buckets (120+, 90, 60, 30 days, Current)
 * - Balance summary
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_DETAILS } from '@/lib/invoices/invoice-pdf-generator';

// Brand colors - professional, minimal
const COLORS = {
  primary: '#F5831F',      // CircleTel Orange (accent only)
  dark: '#1F2937',         // Dark text
  gray: '#6B7280',         // Secondary text
  lightGray: '#E5E7EB',    // Borders
  white: '#FFFFFF',
  green: '#059669',        // Credits/Payments
  red: '#DC2626',          // Due amounts
};

export interface StatementTransaction {
  date: string;
  reference: string;
  description: string;
  debit?: number;   // Invoice amounts
  credit?: number;  // Payments/credits
}

export interface StatementCustomer {
  name: string;
  accountNumber: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  vatNumber?: string;
}

export interface AgingBuckets {
  over120Days: number;
  days90: number;
  days60: number;
  days30: number;
  current: number;
}

export interface StatementData {
  statementDate: string;
  customer: StatementCustomer;
  transactions: StatementTransaction[];
  aging: AgingBuckets;
  totalDue: number;
  totalPaid: number;
}

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
 * Generate Customer Statement PDF
 */
export function generateStatementPDF(statement: StatementData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ============================================
  // HEADER - Logo (placeholder) + STATEMENT title
  // ============================================

  // Logo placeholder (green circle to match the sample)
  doc.setFillColor(76, 175, 80);
  doc.circle(margin + 12, yPos + 12, 12, 'F');
  doc.setFillColor(129, 199, 132);
  doc.circle(margin + 18, yPos + 8, 8, 'F');
  doc.setFillColor(200, 230, 201);
  doc.circle(margin + 22, yPos + 14, 5, 'F');

  // STATEMENT title - top right
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('STATEMENT', pageWidth - margin, yPos + 8, { align: 'right' });

  // Statement details box - right side
  const detailsX = pageWidth - margin - 50;
  let detailsY = yPos + 18;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);

  doc.text('DATE:', detailsX, detailsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(formatDate(statement.statementDate), pageWidth - margin, detailsY, { align: 'right' });

  detailsY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('PAGE:', detailsX, detailsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('1/1', pageWidth - margin, detailsY, { align: 'right' });

  yPos += 40;

  // ============================================
  // FROM / TO SECTIONS
  // ============================================

  const midX = pageWidth / 2;

  // FROM section
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('FROM', margin, yPos);

  yPos += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(COMPANY_DETAILS.name.toUpperCase(), margin, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`VAT NO: ${COMPANY_DETAILS.vatNumber}`, margin, yPos);

  yPos += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('POSTAL ADDRESS:', margin, yPos);
  doc.text('PHYSICAL ADDRESS:', margin + 45, yPos);

  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(COMPANY_DETAILS.address.line1, margin, yPos);
  doc.text(COMPANY_DETAILS.address.line1, margin + 45, yPos);
  yPos += 4;
  doc.text(COMPANY_DETAILS.address.line2, margin, yPos);
  doc.text(COMPANY_DETAILS.address.line2, margin + 45, yPos);
  yPos += 4;
  doc.text(COMPANY_DETAILS.address.postalCode, margin, yPos);
  doc.text(COMPANY_DETAILS.address.postalCode, margin + 45, yPos);

  // TO section - right side
  let toY = yPos - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('TO', midX + 10, toY);

  toY += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(statement.customer.name.toUpperCase(), midX + 10, toY);

  toY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`ACCOUNT NO: ${statement.customer.accountNumber}`, midX + 10, toY);

  if (statement.customer.vatNumber) {
    toY += 5;
    doc.text(`CUSTOMER VAT NO: ${statement.customer.vatNumber}`, midX + 10, toY);
  }

  toY += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('POSTAL ADDRESS:', midX + 10, toY);

  toY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  if (statement.customer.address) {
    if (statement.customer.address.line1) {
      doc.text(statement.customer.address.line1, midX + 10, toY);
      toY += 4;
    }
    if (statement.customer.address.city) {
      doc.text(statement.customer.address.city, midX + 10, toY);
      toY += 4;
    }
    if (statement.customer.address.province) {
      doc.text(statement.customer.address.province, midX + 10, toY);
      toY += 4;
    }
    if (statement.customer.address.postalCode) {
      doc.text(statement.customer.address.postalCode, midX + 10, toY);
    }
  }

  yPos += 20;

  // ============================================
  // TRANSACTIONS TABLE
  // ============================================

  const tableHeaders = ['Date', 'Reference', 'Description', 'Debit', 'Credit'];

  const tableData = statement.transactions.map(tx => [
    formatDate(tx.date),
    tx.reference,
    tx.description,
    tx.debit ? formatCurrency(tx.debit) : '',
    tx.credit ? formatCurrency(tx.credit) : ''
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.dark,
      lineColor: COLORS.lightGray,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: COLORS.white,
      textColor: COLORS.gray,
      fontStyle: 'italic',
      fontSize: 9,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 25 },           // Date
      1: { cellWidth: 35 },           // Reference
      2: { cellWidth: 65 },           // Description
      3: { cellWidth: 30, halign: 'right' },  // Debit
      4: { cellWidth: 30, halign: 'right' }   // Credit
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      // Add subtle row borders
      if (data.section === 'body') {
        doc.setDrawColor(COLORS.lightGray);
        doc.setLineWidth(0.1);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ============================================
  // AGING BUCKETS
  // ============================================

  const agingHeaders = ['120+ Days', '90 Days', '60 Days', '30 Days', 'Current', 'Amount Due', 'Amount Paid'];
  const agingData = [
    formatCurrency(statement.aging.over120Days),
    formatCurrency(statement.aging.days90),
    formatCurrency(statement.aging.days60),
    formatCurrency(statement.aging.days30),
    formatCurrency(statement.aging.current),
    formatCurrency(statement.totalDue),
    formatCurrency(statement.totalPaid)
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
      fillColor: COLORS.white,
      textColor: COLORS.dark,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      5: { fontStyle: 'bold' },  // Amount Due - emphasized
      6: { fontStyle: 'bold' }   // Amount Paid - emphasized
    },
    margin: { left: margin, right: margin }
  });

  // ============================================
  // FOOTER - Company registration
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
 * Generate Statement PDF as base64
 */
export function generateStatementPDFBase64(statement: StatementData): string {
  const doc = generateStatementPDF(statement);
  return doc.output('datauristring');
}

/**
 * Generate Statement PDF as Blob
 */
export function generateStatementPDFBlob(statement: StatementData): Blob {
  const doc = generateStatementPDF(statement);
  return doc.output('blob');
}

/**
 * Generate Statement PDF as ArrayBuffer
 */
export function generateStatementPDFBuffer(statement: StatementData): ArrayBuffer {
  const doc = generateStatementPDF(statement);
  return doc.output('arraybuffer');
}
