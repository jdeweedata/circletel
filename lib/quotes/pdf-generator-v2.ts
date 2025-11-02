/**
 * PDF Generator V2 for Business Quotes
 * Matches CircleTel MTN Quote Layout
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuoteDetails } from './types';
import { CIRCLETEL_LOGO_BASE64 } from './circletel-logo-base64';

interface PDFOptions {
  includeTerms?: boolean;
  includeSignature?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function generateQuotePDF(quote: QuoteDetails, options: PDFOptions = {}): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper function to add header/footer on each page
  const addHeaderFooter = () => {
    // Header - CircleTel Logo (left side) - 1:1 ratio (square)
    try {
      doc.addImage(CIRCLETEL_LOGO_BASE64, 'PNG', 15, 10, 25, 25);
    } catch (e) {
      // Fallback if logo fails to load
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 131, 31);
      doc.text('circleTEL', 15, 22);
    }

    // Header - Company Details (right side)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 75, 75);
    const rightX = pageWidth - 15;
    doc.text('West House | Devcon Park | 7', rightX, 12, { align: 'right' });
    doc.text('Autumn Road | Rivonia | 2128', rightX, 17, { align: 'right' });
    doc.text('PO Box 3895, 2128', rightX, 22, { align: 'right' });
    doc.text('TEL: +27 87 087 6307', rightX, 27, { align: 'right' });
    doc.setTextColor(245, 131, 31);
    doc.text('EMAIL: ', rightX - 45, 32, { align: 'left' });
    doc.setTextColor(75, 75, 75);
    doc.text('contactus@circletel.co.za', rightX, 32, { align: 'right' });
    doc.setTextColor(245, 131, 31);
    doc.text('WEB: ', rightX - 37, 37, { align: 'left' });
    doc.setTextColor(75, 75, 75);
    doc.text('www.circletel.co.za', rightX, 37, { align: 'right' });

    // Orange horizontal line
    doc.setDrawColor(245, 131, 31);
    doc.setLineWidth(0.8);
    doc.line(15, 40, pageWidth - 15, 40);

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(75, 75, 75);
    doc.setFont('helvetica', 'bold');
    doc.text('Circle Tel SA (PTY) LTD - Authorized MTN Business Partner', pageWidth / 2, footerY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Registration Number: 2008/026404/07', pageWidth / 2, footerY + 4, { align: 'center' });
    doc.text('All prices include VAT unless otherwise stated', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text('E&OE - Errors and Omissions Excepted', pageWidth / 2, footerY + 12, { align: 'center' });
  };

  // First page header
  addHeaderFooter();

  let yPos = 50;

  // Quote Reference and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Quote Reference: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quote_number, 52, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Date: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.created_at), 28, yPos);

  yPos += 10;

  // CUSTOMER DETAILS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CUSTOMER DETAILS', 15, yPos);

  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Installation Address:', 15, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(quote.service_address, pageWidth - 30);
  addressLines.forEach((line: string) => {
    doc.text(line, 15, yPos);
    yPos += 5;
  });

  yPos += 5;

  // SERVICE SUMMARY
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE SUMMARY', 15, yPos);

  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Name: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.company_name, 50, yPos);

  yPos += 5;

  if (quote.registration_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('Registration: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.registration_number, 50, yPos);
    yPos += 5;
  }

  if (quote.vat_number) {
    doc.setFont('helvetica', 'bold');
    doc.text('VAT Number: ', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.vat_number, 50, yPos);
    yPos += 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Contract Term: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${quote.contract_term} Months`, 50, yPos);

  yPos += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Valid Until: ', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.valid_until), 50, yPos);

  yPos += 10;

  // SERVICE PACKAGE DETAILS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 102, 153); // Blue heading like in original
  doc.text('SERVICE PACKAGE DETAILS', 15, yPos);

  yPos += 8;

  // Services table - using autoTable for clean formatting
  const servicesData = quote.items.map((item, index) => {
    const dataInfo = item.data_cap_gb ? `${item.data_cap_gb}GB` : 'Uncapped Data';
    const typeLabel = item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1);

    return [
      `Service ${index + 1}`,
      item.service_name,
      typeLabel,
      dataInfo,
      String(item.quantity),
      item.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Service Name', 'Type', 'Data', 'Qty', 'Notes']],
    body: servicesData,
    theme: 'plain',
    headStyles: {
      fillColor: [211, 227, 247],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0],
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left' },
      1: { cellWidth: 55, halign: 'left' },
      2: { cellWidth: 25, halign: 'left' },
      3: { cellWidth: 30, halign: 'left' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 40, fontSize: 8, fontStyle: 'italic', halign: 'left' }
    },
    margin: { left: 15, right: 15 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    addHeaderFooter();
    yPos = 50;
  }

  // PRICING
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 102, 153);
  doc.text('PRICING', 15, yPos);

  yPos += 10;

  // Pricing table
  const pricingData = [
    ['Monthly Subscription (Incl VAT)', formatCurrency(quote.total_monthly)],
    ['Monthly Subscription (Ex VAT)', formatCurrency(quote.subtotal_monthly)],
  ];

  if (quote.total_installation > 0) {
    pricingData.push(['Once-off Installation Fee', formatCurrency(quote.total_installation)]);
  }

  pricingData.push(['TOTAL MONTHLY COST', formatCurrency(quote.total_monthly)]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount']],
    body: pricingData,
    theme: 'plain',
    headStyles: {
      fillColor: [211, 227, 247],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === pricingData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 11;
      }
    },
    margin: { left: 15, right: 15 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Contract Value
  const contractValue = quote.total_monthly * quote.contract_term;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${quote.contract_term}-Month Contract Value: `, 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatCurrency(contractValue)} (${formatCurrency(quote.total_monthly)} × ${quote.contract_term} months)`, 72, yPos);

  yPos += 15;

  // PRODUCT FEATURES (for client reference)
  if (yPos > pageHeight - 100) {
    doc.addPage();
    addHeaderFooter();
    yPos = 50;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 102, 153);
  doc.text('Inclusive Benefits', 15, yPos);

  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const features = [
    'Free SIM Card (where applicable)',
    'Free Caller Line Identity (CLI)',
    'Free International Toll Billing (ITB)',
    '24/7 Technical Support',
    'Online Account Management Portal',
    'Monthly Usage Reports',
    'SLA-backed Service Guarantee',
    'Professional Installation & Configuration'
  ];

  features.forEach(feature => {
    // Use proper bullet point
    doc.text('•  ' + feature, 18, yPos);
    yPos += 5;
  });

  yPos += 10;

  // TERMS AND CONDITIONS
  if (options.includeTerms !== false) {
    if (yPos > pageHeight - 100) {
      doc.addPage();
      addHeaderFooter();
      yPos = 50;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('TERMS AND CONDITIONS', 15, yPos);

    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const terms = [
      'This quotation is valid for 30 days from the date of issue',
      'Service is subject to network availability at the installation address',
      'Installation is subject to site survey and feasibility assessment',
      `The ${quote.contract_term}-month contract period commences from service activation date`,
      'Early termination fees apply if contract is cancelled before completion',
      'Monthly fees are billed in advance',
      'Standard CircleTel business terms and conditions apply',
      'Prices include VAT at current rate of 15%',
      'Equipment remains property of the service provider and must be returned upon contract termination',
      'All services subject to acceptable use policy and fair usage terms'
    ];

    terms.forEach((term, index) => {
      const termText = `${index + 1}. ${term}`;
      const termLines = doc.splitTextToSize(termText, pageWidth - 35);
      termLines.forEach((line: string) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          addHeaderFooter();
          yPos = 50;
        }
        doc.text(line, 18, yPos);
        yPos += 4.5;
      });
    });
  }

  // Customer Notes
  if (quote.customer_notes && !quote.customer_notes.startsWith('REJECTED:')) {
    yPos += 5;

    if (yPos > pageHeight - 40) {
      doc.addPage();
      addHeaderFooter();
      yPos = 50;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 102, 153);
    doc.text('Additional Notes', 15, yPos);

    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const notesLines = doc.splitTextToSize(quote.customer_notes, pageWidth - 30);
    notesLines.forEach((line: string) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        addHeaderFooter();
        yPos = 50;
      }
      doc.text(line, 15, yPos);
      yPos += 4.5;
    });
  }

  return doc;
}

export function downloadQuotePDF(quote: QuoteDetails, options?: PDFOptions): void {
  const pdf = generateQuotePDF(quote, options);
  pdf.save(`CircleTel-Quote-${quote.quote_number}.pdf`);
}

export function generateQuotePDFBlob(quote: QuoteDetails, options?: PDFOptions): Blob {
  const pdf = generateQuotePDF(quote, options);
  return pdf.output('blob');
}
