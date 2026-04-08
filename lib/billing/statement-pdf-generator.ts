/**
 * Customer Statement PDF Generator
 * Generates professional statements matching CircleTel brand style
 * Layout matches StatementPreview.tsx HTML component exactly.
 *
 * Features:
 * - Real CircleTel logo
 * - Orange rule matching brand header
 * - FROM/TO two-column grid
 * - 6-column transactions table with running balance
 * - Color-coded aging buckets
 * - Banking details card
 * - Multi-page footer via didDrawPage
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_DETAILS } from '@/lib/invoices/invoice-pdf-generator';
import { circleTelLogoBase64 } from '@/lib/quotes/circletel-logo-base64';

// Brand colors - professional, minimal
const COLORS = {
  primary: '#F5831F',      // CircleTel Orange (accent only)
  dark: '#1F2937',         // Dark text
  gray: '#6B7280',         // Secondary text
  lightGray: '#E5E7EB',    // Borders
  white: '#FFFFFF',
  green: '#059669',        // Credits/Payments
  red: '#DC2626',          // 120+ days overdue
  redLight: '#EF4444',     // 90 days
  orange: '#F97316',       // 60 days
  yellow: '#CA8A04',       // 30 days
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
 * Format date as DD/MM/YYYY for table rows
 */
function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format currency as South African Rand
 */
function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate Customer Statement PDF — layout matches StatementPreview.tsx
 */
export function generateStatementPDF(statement: StatementData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
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
  // SECTION 1: HEADER — logo left, STATEMENT + meta right
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

  // Right side: STATEMENT + meta
  let rightY = yPos;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(COLORS.dark);
  doc.text('STATEMENT', pageWidth - margin, rightY + 7, { align: 'right' });
  rightY += 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.gray);
  doc.text(`Statement Date: ${formatDate(statement.statementDate)}`, pageWidth - margin, rightY, { align: 'right' });
  rightY += 5;
  doc.text(`Account: `, pageWidth - margin - doc.getTextWidth(statement.customer.accountNumber), rightY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(statement.customer.accountNumber, pageWidth - margin, rightY, { align: 'right' });

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
  doc.text(statement.customer.name, col2X, col2Y);
  col2Y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`Account: ${statement.customer.accountNumber}`, col2X, col2Y);  col2Y += 4;

  if (statement.customer.email) {
    doc.text(statement.customer.email, col2X, col2Y);  col2Y += 4;
  }
  if (statement.customer.phone) {
    doc.text(statement.customer.phone, col2X, col2Y);  col2Y += 4;
  }
  if (statement.customer.vatNumber) {
    doc.text(`VAT No: ${statement.customer.vatNumber}`, col2X, col2Y);  col2Y += 4;
  }
  if (statement.customer.address) {
    const addr = statement.customer.address;
    if (addr.line1)      { doc.text(addr.line1, col2X, col2Y);  col2Y += 4; }
    if (addr.line2)      { doc.text(addr.line2, col2X, col2Y);  col2Y += 4; }
    if (addr.city || addr.province) {
      const cityProvince = [addr.city, addr.province].filter(Boolean).join(', ');
      const line = addr.postalCode ? `${cityProvince} ${addr.postalCode}` : cityProvince;
      doc.text(line, col2X, col2Y);  col2Y += 4;
    }
  }

  yPos = Math.max(leftY, col2Y) + 8;

  // ============================================================
  // SECTION 4: TRANSACTIONS TABLE — 6 columns with running balance
  // ============================================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('TRANSACTION HISTORY', margin, yPos);
  yPos += 4;

  // Compute running balance matching HTML: balance += debit - credit per row
  let runningBalance = 0;
  const tableRows = statement.transactions.length > 0
    ? statement.transactions.map(tx => {
        runningBalance += parseFloat(String(tx.debit || 0)) - parseFloat(String(tx.credit || 0));
        return [
          formatShortDate(tx.date),
          tx.reference,
          tx.description,
          tx.debit ? formatCurrency(parseFloat(String(tx.debit))) : '—',
          tx.credit ? formatCurrency(parseFloat(String(tx.credit))) : '—',
          formatCurrency(runningBalance),
        ];
      })
    : [['', '', 'No transactions found for the selected period.', '', '', '']];

  // Store running balance per row for didDrawCell color-coding
  let balanceRowIdx = 0;
  const balanceValues: number[] = [];
  let tmpBalance = 0;
  for (const tx of statement.transactions) {
    tmpBalance += parseFloat(String(tx.debit || 0)) - parseFloat(String(tx.credit || 0));
    balanceValues.push(tmpBalance);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['DATE', 'REFERENCE', 'DESCRIPTION', 'DEBIT (R)', 'CREDIT (R)', 'BALANCE (R)']],
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
      fillColor: '#F3F4F6',
      textColor: '#4B5563',
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 22 },                            // Date
      1: { cellWidth: 32 },                            // Reference
      2: { cellWidth: 60 },                            // Description
      3: { cellWidth: 26, halign: 'right' },           // Debit
      4: { cellWidth: 26, halign: 'right' },           // Credit
      5: { cellWidth: 14, halign: 'right' },           // Balance
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => { drawFooter(); },
    didDrawCell: (data) => {
      // Color-code Credit column (col 4) green and Balance column (col 5) red/green
      if (data.section === 'body' && statement.transactions.length > 0) {
        const rowIdx = data.row.index;
        if (data.column.index === 4 && statement.transactions[rowIdx]?.credit) {
          doc.setTextColor(COLORS.green);
          const cell = data.cell;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(
            formatCurrency(parseFloat(String(statement.transactions[rowIdx].credit))),
            cell.x + cell.width - 1,
            cell.y + cell.height / 2 + 2.5,
            { align: 'right' }
          );
        }
        if (data.column.index === 5) {
          const bal = balanceValues[rowIdx] ?? 0;
          doc.setTextColor(bal > 0 ? '#DC2626' : COLORS.green);
          const cell = data.cell;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(
            formatCurrency(bal),
            cell.x + cell.width - 1,
            cell.y + cell.height / 2 + 2.5,
            { align: 'right' }
          );
        }
      }
      balanceRowIdx++;
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================
  // SECTION 5: AGING BUCKETS — 7 columns with color coding
  // ============================================================
  ensureSpace(30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('AGING ANALYSIS', margin, yPos);
  yPos += 4;

  // Raw aging values for color lookup in didDrawCell
  const agingValues = [
    parseFloat(String(statement.aging.over120Days)),
    parseFloat(String(statement.aging.days90)),
    parseFloat(String(statement.aging.days60)),
    parseFloat(String(statement.aging.days30)),
    parseFloat(String(statement.aging.current)),
    parseFloat(String(statement.totalDue)),
    parseFloat(String(statement.totalPaid)),
  ];

  const agingData = agingValues.map(v => formatCurrency(v));

  // Aging cell text colors by column index (body row)
  const agingCellColors = [
    COLORS.red,           // 120+ days — bold red
    COLORS.redLight,      // 90 days — red-500
    COLORS.orange,        // 60 days — orange
    COLORS.yellow,        // 30 days — yellow-600
    COLORS.dark,          // Current — normal
    COLORS.primary,       // Amount Due — orange bold
    COLORS.green,         // Amount Paid — green bold
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['120+ DAYS', '90 DAYS', '60 DAYS', '30 DAYS', 'CURRENT', 'AMOUNT DUE', 'AMOUNT PAID']],
    body: [agingData],
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.dark,
      lineColor: '#E5E7EB',
      lineWidth: 0.2,
      halign: 'right',
    },
    headStyles: {
      fillColor: '#F3F4F6',
      textColor: '#4B5563',
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'right',
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => { drawFooter(); },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        const colIdx = data.column.index;
        const color = agingCellColors[colIdx] ?? COLORS.dark;
        const value = agingValues[colIdx] ?? 0;
        const isBold = colIdx === 5 || colIdx === 6 || (value > 0 && colIdx < 4);
        doc.setTextColor(color);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(8);
        const cell = data.cell;
        doc.text(
          formatCurrency(value),
          cell.x + cell.width - 1,
          cell.y + cell.height / 2 + 2.5,
          { align: 'right' }
        );
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================
  // SECTION 6: BANKING DETAILS — bordered card
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
    ['Bank',           COMPANY_DETAILS.banking.bankName,      'Branch Code',  COMPANY_DETAILS.banking.branchCode],
    ['Account Name',   COMPANY_DETAILS.banking.accountName,   'Account Type', COMPANY_DETAILS.banking.accountType],
    ['Account Number', COMPANY_DETAILS.banking.accountNumber, 'Reference',    statement.customer.accountNumber],
  ];

  bankRows.forEach(([leftLabel, leftValue, rightLabel, rightValue]) => {
    doc.setFontSize(8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(leftLabel, bankLabelX, bankY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text(leftValue, bankValueX, bankY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(rightLabel, bankRightLabelX, bankY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rightLabel === 'Reference' ? COLORS.primary : COLORS.dark);
    doc.text(rightValue, bankRightValueX, bankY);

    bankY += 7;
  });

  // Reference note below the grid
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  const noteLabel = 'Please use your account number as payment reference: ';
  doc.text(noteLabel, bankLabelX, bankY);
  const noteLabelWidth = doc.getTextWidth(noteLabel);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text(statement.customer.accountNumber, bankLabelX + noteLabelWidth, bankY);

  yPos += cardHeight + 8;

  // ============================================================
  // FOOTER — company registration, VAT, contact (every page)
  // ============================================================
  drawFooter();

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
