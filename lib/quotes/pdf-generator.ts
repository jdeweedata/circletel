/**
 * PDF Generator for Business Quotes
 *
 * Generates professional PDF quotes with CircleTel branding
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuoteDetails } from './types';
import { calculatePricingBreakdown } from './quote-calculator';

interface PDFOptions {
  includeTerms?: boolean;
  includeSignature?: boolean;
}

/**
 * Format currency for South Africa (ZAR)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate PDF quote document
 */
export function generateQuotePDF(quote: QuoteDetails, options: PDFOptions = {}): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Calculate pricing if database values are 0
  const hasValidPricing = quote.subtotal_monthly > 0 || quote.total_monthly > 0;
  
  let pricing;
  if (hasValidPricing) {
    pricing = {
      subtotal_monthly: quote.subtotal_monthly || 0,
      vat_amount_monthly: quote.vat_amount_monthly || 0,
      total_monthly: quote.total_monthly || 0,
      subtotal_installation: quote.subtotal_installation || 0,
      vat_amount_installation: quote.vat_amount_installation || 0,
      total_installation: quote.total_installation || 0,
    };
  } else {
    const calculated = calculatePricingBreakdown(
      quote.items,
      quote.contract_term,
      quote.custom_discount_percent || 0,
      quote.custom_discount_amount || 0
    );
    
    pricing = {
      subtotal_monthly: calculated.subtotal_monthly,
      vat_amount_monthly: calculated.vat_monthly,
      total_monthly: calculated.total_monthly,
      subtotal_installation: calculated.subtotal_installation,
      vat_amount_installation: calculated.vat_installation,
      total_installation: calculated.total_installation,
    };
  }

  let yPos = 20;

  // ===================================
  // HEADER - CircleTel Logo & Info
  // ===================================

  // Orange header bar
  doc.setFillColor(245, 131, 31); // CircleTel Orange
  doc.rect(0, 0, pageWidth, 35, 'F');

  // CircleTel Logo/Branding (left side)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('circleTEL', 20, 18);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Business Connectivity Solutions', 20, 24);

  // Company details (right side)
  doc.setFontSize(7.5);
  const headerRight = pageWidth - 20;
  
  doc.text('West House | Devcon Park | 7', headerRight, 10, { align: 'right' });
  doc.text('Autumn Road | Rivonia | 2128', headerRight, 14, { align: 'right' });
  doc.text('PO Box 3895, 2128', headerRight, 18, { align: 'right' });
  doc.text('TEL: +27 87 087 6305', headerRight, 22, { align: 'right' });
  doc.text('EMAIL: contactus@circletel.co.za', headerRight, 26, { align: 'right' });
  doc.text('WEB: www.circletel.co.za', headerRight, 30, { align: 'right' });

  yPos = 45;

  // ===================================
  // QUOTE HEADER
  // ===================================

  doc.setTextColor(31, 41, 55); // Dark neutral
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BUSINESS QUOTATION', 20, yPos);

  yPos += 10;

  // Quote metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99); // Secondary neutral

  const metaLeft = 20;
  const metaRight = pageWidth / 2 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Quote Number:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quote_number, metaLeft + 35, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', metaRight, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.created_at), metaRight + 15, yPos);

  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.status.toUpperCase(), metaLeft + 35, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Valid Until:', metaRight, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.valid_until), metaRight + 25, yPos);

  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Contract Term:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${quote.contract_term} Months`, metaLeft + 35, yPos);

  yPos += 15;

  // ===================================
  // CUSTOMER INFORMATION
  // ===================================

  doc.setFillColor(230, 233, 239); // Light neutral
  doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CUSTOMER INFORMATION', 22, yPos);

  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  doc.setFont('helvetica', 'bold');
  doc.text('Company:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.company_name, metaLeft + 25, yPos);

  yPos += 6;

  if (quote.registration_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('Registration:', metaLeft, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.registration_number, metaLeft + 30, yPos);
    yPos += 6;
  }

  if (quote.vat_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('VAT Number:', metaLeft, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.vat_number, metaLeft + 30, yPos);
    yPos += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Person:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.contact_name, metaLeft + 35, yPos);

  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.contact_email, metaLeft + 15, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', metaRight, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.contact_phone, metaRight + 15, yPos);

  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Service Address:', metaLeft, yPos);
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(quote.service_address, pageWidth - 80);
  doc.text(addressLines, metaLeft + 38, yPos);

  yPos += 6 * addressLines.length + 10;

  // ===================================
  // SERVICES TABLE
  // ===================================

  doc.setFillColor(230, 233, 239);
  doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SERVICES', 22, yPos);

  yPos += 8;

  // Prepare table data
  const tableData = quote.items.map((item, index) => [
    String(index + 1),
    `${item.service_name}\n${item.speed_down}Mbps ↓ / ${item.speed_up}Mbps ↑${item.data_cap_gb ? `\nData: ${item.data_cap_gb}GB` : '\nUnlimited Data'}`,
    item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1),
    String(item.quantity),
    formatCurrency(item.monthly_price),
    formatCurrency(item.installation_price),
    formatCurrency(item.monthly_price * item.quantity)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Service Description', 'Type', 'Qty', 'Monthly', 'Install', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [245, 131, 31], // CircleTel Orange
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===================================
  // PRICING SUMMARY
  // ===================================

  const summaryX = pageWidth - 80;

  doc.setDrawColor(230, 233, 239);
  doc.setLineWidth(0.5);

  // Subtotal Monthly
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal (Monthly):', summaryX, yPos);
  doc.text(formatCurrency(pricing.subtotal_monthly), summaryX + 60, yPos, { align: 'right' });
  yPos += 7;

  // Installation
  if (pricing.subtotal_installation > 0) {
    doc.text('Installation (Once-off):', summaryX, yPos);
    doc.text(formatCurrency(pricing.subtotal_installation), summaryX + 60, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.line(summaryX, yPos - 2, summaryX + 60, yPos - 2);

  // VAT
  doc.text('VAT (15%):', summaryX, yPos);
  doc.text(formatCurrency(pricing.vat_amount_monthly), summaryX + 60, yPos, { align: 'right' });
  yPos += 7;

  if (pricing.vat_amount_installation > 0) {
    doc.text('VAT on Installation:', summaryX, yPos);
    doc.text(formatCurrency(pricing.vat_amount_installation), summaryX + 60, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.line(summaryX, yPos - 2, summaryX + 60, yPos - 2);

  // Total Monthly
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(245, 131, 31); // Orange
  doc.text('TOTAL MONTHLY:', summaryX, yPos);
  doc.text(formatCurrency(pricing.total_monthly), summaryX + 60, yPos, { align: 'right' });
  yPos += 8;

  // Total Installation
  if (pricing.total_installation > 0) {
    doc.text('TOTAL INSTALLATION:', summaryX, yPos);
    doc.text(formatCurrency(pricing.total_installation), summaryX + 60, yPos, { align: 'right' });
    yPos += 8;
  }

  yPos += 10;

  // ===================================
  // CUSTOMER NOTES
  // ===================================

  if (quote.customer_notes && !quote.customer_notes.startsWith('REJECTED:')) {
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 20, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(quote.customer_notes, pageWidth - 40);
    doc.text(notesLines, 20, yPos);
    yPos += 5 * notesLines.length + 10;
  }

  // ===================================
  // TERMS & CONDITIONS
  // ===================================

  if (options.includeTerms !== false) {
    // Add new page if needed
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(230, 233, 239);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TERMS & CONDITIONS', 22, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);

    const terms = [
      '1. This quote is valid for 30 days from the date of issue.',
      '2. Prices are quoted in South African Rands (ZAR) and include 15% VAT.',
      '3. Installation is subject to a successful site survey and feasibility assessment.',
      '4. Services are provided subject to network availability at the specified address.',
      '5. Contract terms are binding for the specified duration. Early termination fees may apply.',
      '6. Monthly fees are billed in advance and are due on the 1st of each month.',
      '7. Installation fees are payable upon contract signing or before installation commences.',
      '8. Customer is responsible for providing suitable infrastructure and access for installation.',
      '9. Service Level Agreements (SLAs) are detailed in the full service agreement.',
      '10. CircleTel reserves the right to amend pricing subject to 30 days written notice.'
    ];

    terms.forEach(term => {
      const termLines = doc.splitTextToSize(term, pageWidth - 45);
      doc.text(termLines, 22, yPos);
      yPos += 5 * termLines.length;
    });

    yPos += 10;
  }

  // ===================================
  // SIGNATURE SECTION
  // ===================================

  if (options.includeSignature !== false) {
    if (yPos > pageHeight - 90) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(230, 233, 239);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CUSTOMER ACCEPTANCE & SIGNATURE', 22, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);

    const acceptanceText = [
      'I, the undersigned, hereby confirm that I have read and understood the terms and conditions',
      'of this quotation and accept the services as described above. I authorize CircleTel to proceed',
      'with the installation and provisioning of services as outlined in this quote.'
    ];

    acceptanceText.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });

    yPos += 5;

    if (quote.signature) {
      // Quote has been signed - show signature details
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text('Signed by:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(quote.signature.signer_name, 45, yPos);

      yPos += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Date:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(quote.signature.signed_at), 45, yPos);

      yPos += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('ID Number:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(quote.signature.signer_id_number, 45, yPos);

      yPos += 10;

      // Signature image
      doc.setDrawColor(34, 197, 94); // Green
      doc.setLineWidth(1);
      doc.rect(20, yPos, 80, 30);
      doc.setFontSize(8);
      doc.setTextColor(34, 197, 94);
      doc.text('✓ DIGITALLY SIGNED', 60, yPos + 15, { align: 'center' });
    } else {
      // Quote not signed yet - show signature fields
      const leftCol = 20;
      const rightCol = pageWidth / 2 + 10;

      // Full Name field
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Full Name:', leftCol, yPos);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(leftCol + 25, yPos + 1, leftCol + 85, yPos + 1);

      yPos += 8;

      // ID Number field
      doc.text('ID Number:', leftCol, yPos);
      doc.line(leftCol + 25, yPos + 1, leftCol + 85, yPos + 1);

      yPos += 8;

      // Date field
      doc.text('Date:', leftCol, yPos);
      doc.line(leftCol + 25, yPos + 1, leftCol + 85, yPos + 1);

      yPos += 10;

      // Signature box
      doc.text('Signature:', leftCol, yPos);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(1);
      doc.rect(leftCol, yPos + 3, 80, 25);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Sign here', leftCol + 40, yPos + 18, { align: 'center' });
      
      yPos += 30;

      // Instructions
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      const instructions = [
        'To accept this quote:',
        '1. Complete the fields above',
        '2. Sign in the designated area',
        '3. Email the signed quote to quotes@circletel.co.za',
        'OR visit www.circletel.co.za/quotes to accept online'
      ];
      
      yPos += 5;
      instructions.forEach(line => {
        doc.text(line, leftCol, yPos);
        yPos += 4;
      });
    }
  }

  // ===================================
  // FOOTER
  // ===================================

  const footerY = pageHeight - 15;
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('CircleTel (Pty) Ltd | West House, Devcon Park, 7 Autumn Road, Rivonia, 2128 | PO Box 3895, 2128', pageWidth / 2, footerY, { align: 'center' });
  doc.text('www.circletel.co.za | contactus@circletel.co.za | TEL: +27 87 087 6305', pageWidth / 2, footerY + 4, { align: 'center' });

  return doc;
}

/**
 * Generate and download PDF
 */
export function downloadQuotePDF(quote: QuoteDetails, options?: PDFOptions): void {
  const pdf = generateQuotePDF(quote, options);
  pdf.save(`CircleTel-Quote-${quote.quote_number}.pdf`);
}

/**
 * Generate PDF as blob for server-side usage
 */
export function generateQuotePDFBlob(quote: QuoteDetails, options?: PDFOptions): Blob {
  const pdf = generateQuotePDF(quote, options);
  return pdf.output('blob');
}
