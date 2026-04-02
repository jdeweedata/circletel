/**
 * One-off script: generate a sample invoice PDF and email it
 * Usage: node --env-file=.env.production.local scripts/send-sample-invoice.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'billing@notify.circletel.co.za';
const TO_EMAIL = 'jeffrey.de.wee@circletel.co.za';

// Most recent invoice with line items
const INVOICE_ID = '3cb5d982-2b0b-4d20-bd36-da9037b038ac'; // INV-2026-00005

async function main() {
  console.log('🔧 Connecting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Fetch invoice
  console.log('📄 Fetching invoice INV-2026-00005...');
  const { data: invoice, error: invError } = await supabase
    .from('customer_invoices')
    .select('id, invoice_number, invoice_date, due_date, period_start, period_end, subtotal, tax_amount, total_amount, amount_due, line_items, notes, status, customer_id')
    .eq('id', INVOICE_ID)
    .single();

  if (invError || !invoice) {
    console.error('❌ Invoice fetch failed:', invError?.message);
    process.exit(1);
  }
  console.log(`✅ Invoice: ${invoice.invoice_number} — R${invoice.total_amount} (${invoice.status})`);

  // Fetch customer
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('first_name, last_name, email, phone, account_number, business_name, business_registration, tax_number')
    .eq('id', invoice.customer_id)
    .single();

  if (custError || !customer) {
    console.error('❌ Customer fetch failed:', custError?.message);
    process.exit(1);
  }
  console.log(`✅ Customer: ${customer.first_name} ${customer.last_name} (${customer.email})`);

  // Fetch most recent order for address
  const { data: order } = await supabase
    .from('consumer_orders')
    .select('installation_address, city, province, postal_code')
    .eq('customer_id', invoice.customer_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Dynamically import jsPDF-based generator (ESM)
  console.log('🖨️  Generating PDF...');

  // Build invoice data manually (mirrors buildInvoiceData logic)
  const lineItems = (invoice.line_items || []).map(item => {
    const inclPrice = item.unit_price || item.amount || 0;
    const quantity = item.quantity || 1;
    const vatPercent = 15;
    const inclTotal = inclPrice * quantity;
    const exclTotal = Math.round((inclTotal / 1.15) * 100) / 100;
    return {
      description: item.description || 'Service',
      quantity,
      unit_price: Math.round((inclPrice / 1.15) * 100) / 100,
      vat_percent: vatPercent,
      excl_total: exclTotal,
      incl_total: Math.round(inclTotal * 100) / 100,
    };
  });

  const subtotalExcl = lineItems.reduce((s, i) => s + i.excl_total, 0);
  const totalVat = Math.round((parseFloat(invoice.total_amount) - subtotalExcl) * 100) / 100;

  const invoiceData = {
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    paymentReference: invoice.invoice_number,
    periodStart: invoice.period_start ?? undefined,
    periodEnd: invoice.period_end ?? undefined,
    customer: {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone ?? undefined,
      accountNumber: customer.account_number ?? undefined,
      address: order ? {
        line1: order.installation_address ?? undefined,
        city: order.city ?? undefined,
        province: order.province ?? undefined,
        postalCode: order.postal_code ?? undefined,
      } : undefined,
    },
    lineItems,
    subtotal: subtotalExcl,
    totalDiscount: 0,
    totalVat,
    total: parseFloat(invoice.total_amount),
    notes: invoice.notes ?? undefined,
    status: invoice.status,
  };

  // Generate PDF using jsPDF directly (avoiding TS imports in this script)
  const jspdfModule = await import('jspdf');
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Header
  doc.setFillColor('#F5831F');
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CIRCLE TEL SA (PTY) LTD', margin, 8);
  doc.text('TAX INVOICE', pageWidth - margin, 8, { align: 'right' });

  y = 22;
  doc.setTextColor('#1F2937');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', margin, y);
  y += 8;

  // Company + Invoice info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#6B7280');
  doc.text('Circle Tel SA (Pty) Ltd', margin, y);
  doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.text('8a Mellis Rd, Rivonia, Sandton, 2128', margin, y);
  doc.text(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-ZA')}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.text('VAT No: 4380269318 | Reg: 2008/026404/07', margin, y);
  doc.text(`Due: ${new Date(invoiceData.dueDate).toLocaleDateString('en-ZA')}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.text('support@circletel.co.za | www.circletel.co.za', margin, y);

  y += 10;
  doc.setDrawColor('#E5E7EB');
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Bill To
  doc.setTextColor('#6B7280');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#1F2937');
  doc.text(`${customer.first_name} ${customer.last_name}`, margin, y);
  y += 5;
  doc.text(customer.email, margin, y);
  if (customer.phone) { y += 5; doc.text(customer.phone, margin, y); }
  if (customer.account_number) { y += 5; doc.text(`Account: ${customer.account_number}`, margin, y); }
  if (order?.installation_address) { y += 5; doc.text(order.installation_address, margin, y); }

  y += 12;

  // Line items table
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Unit Price (excl)', 'VAT%', 'Amount (incl)']],
    body: invoiceData.lineItems.map(item => [
      item.description,
      item.quantity.toString(),
      `R ${item.unit_price.toFixed(2)}`,
      `${item.vat_percent}%`,
      `R ${item.incl_total.toFixed(2)}`,
    ]),
    headStyles: { fillColor: '#F5831F', textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Totals
  const rightCol = pageWidth - margin;
  const labelX = rightCol - 60;
  doc.setFontSize(9);
  doc.setTextColor('#6B7280');
  doc.text('Subtotal (excl VAT):', labelX, y); doc.setTextColor('#1F2937'); doc.text(`R ${invoiceData.subtotal.toFixed(2)}`, rightCol, y, { align: 'right' }); y += 6;
  doc.setTextColor('#6B7280'); doc.text('VAT (15%):', labelX, y); doc.setTextColor('#1F2937'); doc.text(`R ${invoiceData.totalVat.toFixed(2)}`, rightCol, y, { align: 'right' }); y += 6;
  doc.setFillColor('#F3F4F6'); doc.rect(labelX - 5, y - 4, rightCol - labelX + 5 + margin, 8, 'F');
  doc.setTextColor('#1F2937'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('TOTAL DUE:', labelX, y + 1); doc.text(`R ${invoiceData.total.toFixed(2)}`, rightCol, y + 1, { align: 'right' });

  y += 16;

  // Bank details
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor('#6B7280');
  doc.text('PAYMENT DETAILS', margin, y); y += 5;
  doc.setFont('helvetica', 'normal'); doc.setTextColor('#1F2937');
  doc.text('Bank: Standard Bank  |  Account: Circle Tel SA (Pty) Ltd  |  Acc No: 202413993', margin, y); y += 5;
  doc.text(`Branch: 051001  |  Type: Current  |  Reference: ${invoiceData.invoiceNumber}`, margin, y);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFillColor('#F5831F');
  doc.rect(0, footerY - 2, pageWidth, 14, 'F');
  doc.setTextColor('#FFFFFF'); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business. | www.circletel.co.za | contactus@circletel.co.za | 082 487 3900', pageWidth / 2, footerY + 4, { align: 'center' });

  const pdfBuffer = doc.output('arraybuffer');
  const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
  console.log(`✅ PDF generated (${Math.round(pdfBase64.length / 1024)} KB base64)`);

  // Send via Resend with PDF attachment
  console.log(`📧 Sending to ${TO_EMAIL}...`);

  const payload = {
    from: `CircleTel Billing <${FROM_EMAIL}>`,
    to: [TO_EMAIL],
    subject: `Tax Invoice ${invoice.invoice_number} — R${parseFloat(invoice.total_amount).toFixed(2)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #F5831F; padding: 16px 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">CircleTel Tax Invoice</h1>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 15px;">Hi ${customer.first_name},</p>
          <p style="color: #374151;">Please find your tax invoice attached. Here's a summary:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #F5831F; color: white;">
              <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Invoice #</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Period</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 13px;">Amount Due</th>
            </tr>
            <tr style="background: white; border: 1px solid #e5e7eb;">
              <td style="padding: 10px 12px; font-size: 14px; font-weight: bold;">${invoice.invoice_number}</td>
              <td style="padding: 10px 12px; font-size: 13px; color: #6B7280;">Feb 2026</td>
              <td style="padding: 10px 12px; font-size: 16px; font-weight: bold; text-align: right; color: #F5831F;">R ${parseFloat(invoice.total_amount).toFixed(2)}</td>
            </tr>
          </table>
          <p style="color: #6B7280; font-size: 13px;">Due date: ${new Date(invoice.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p style="color: #374151; font-size: 13px;">The full SARS-compliant PDF invoice is attached to this email.</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://www.circletel.co.za/dashboard/billing" style="background: #F5831F; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">View in Portal</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">Circle Tel SA (Pty) Ltd · VAT 4380269318 · contactus@circletel.co.za · 082 487 3900</p>
        </div>
      </div>
    `,
    text: `CircleTel Tax Invoice ${invoice.invoice_number} — R${parseFloat(invoice.total_amount).toFixed(2)} due ${new Date(invoice.due_date).toLocaleDateString('en-ZA')}. See attached PDF.`,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: pdfBase64,
      }
    ],
    reply_to: 'contactus@circletel.co.za',
  };

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await resp.json();

  if (!resp.ok) {
    console.error('❌ Resend error:', JSON.stringify(result));
    process.exit(1);
  }

  console.log('✅ Email sent!');
  console.log(`   Message ID: ${result.id}`);
  console.log(`   To: ${TO_EMAIL}`);
  console.log(`   Invoice: ${invoice.invoice_number}`);
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
