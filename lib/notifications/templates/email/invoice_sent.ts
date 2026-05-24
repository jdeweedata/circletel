/**
 * Email template: invoice_sent
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderInvoiceSent(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>📄 Your Invoice is Ready</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: white;">Invoice ${data.invoice_number}</p>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>Your invoice is now available for viewing and payment.</p>

            <div class="info-box" style="background-color: #D1FAE5; border-left: 4px solid #10B981;">
              <h3 style="margin-top: 0; color: #065F46;">Invoice Summary</h3>
              <div class="info-row">
                <span class="label">Invoice Number:</span>
                <span class="value"><strong>${data.invoice_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Invoice Date:</span>
                <span class="value">${data.invoice_date}</span>
              </div>
              <div class="info-row">
                <span class="label">Due Date:</span>
                <span class="value"><strong style="color: #065F46;">${data.due_date}</strong></span>
              </div>
              ${data.period_start && data.period_end ? `
              <div class="info-row">
                <span class="label">Service Period:</span>
                <span class="value">${data.period_start} to ${data.period_end}</span>
              </div>
              ` : ''}
              <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 10px; margin-top: 10px;">
                <span class="label">Total Amount:</span>
                <span class="value"><strong style="color: #F5831F; font-size: 22px;">R ${typeof data.total_amount === 'number' ? data.total_amount.toFixed(2) : data.total_amount}</strong></span>
              </div>
            </div>

            ${data.pdf_url ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.pdf_url}" class="button" style="background-color: #10B981;">
                📥 Download Invoice PDF
              </a>
            </div>
            ` : ''}

            <h3>💳 Payment Options</h3>
            <div class="info-box">
              <p><strong>EFT / Bank Transfer:</strong></p>
              <div class="info-row">
                <span class="label">Bank:</span>
                <span class="value">First National Bank (FNB)</span>
              </div>
              <div class="info-row">
                <span class="label">Account Name:</span>
                <span class="value">CircleTel (Pty) Ltd</span>
              </div>
              <div class="info-row">
                <span class="label">Account Number:</span>
                <span class="value">62956619547</span>
              </div>
              <div class="info-row">
                <span class="label">Branch Code:</span>
                <span class="value">250655</span>
              </div>
              <div class="info-row">
                <span class="label">Reference:</span>
                <span class="value"><strong>${data.invoice_number}</strong></span>
              </div>
            </div>

            <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <p style="margin: 0;"><strong>💡 Tip:</strong> Please use your invoice number <strong>${data.invoice_number}</strong> as the payment reference to ensure your payment is allocated correctly.</p>
            </div>

            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

            <p>Thank you for choosing CircleTel!</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>accounts@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
            ${data.account_number ? `<p>Account Number: ${data.account_number}</p>` : ''}
          </div>
        `;
  return baseTemplate(content);
}
