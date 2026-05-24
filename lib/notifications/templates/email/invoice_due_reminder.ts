/**
 * Email template: invoice_due_reminder
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderInvoiceDueReminder(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
            <h1>⏰ Payment Reminder</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: white;">Invoice ${data.invoice_number} due in ${data.days_until_due} days</p>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>This is a friendly reminder that payment for your invoice is due in <strong>${data.days_until_due} days</strong>.</p>

            <div class="info-box" style="background-color: #FEF3C7; border-left: 4px solid #F59E0B;">
              <h3 style="margin-top: 0; color: #92400E;">Invoice Details</h3>
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
                <span class="value"><strong style="color: #D97706;">${data.due_date}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Service:</span>
                <span class="value">${data.service_description}</span>
              </div>
              <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 10px; margin-top: 10px;">
                <span class="label">Amount Due:</span>
                <span class="value"><strong style="color: #F5831F; font-size: 20px;">R ${typeof data.amount_due === 'number' ? data.amount_due.toFixed(2) : data.amount_due}</strong></span>
              </div>
            </div>

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

            ${data.pdf_url ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.pdf_url}" class="button" style="background-color: #F5831F;">
                📄 View Invoice PDF
              </a>
            </div>
            ` : ''}

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Important:</strong> Please use your invoice number <strong>${data.invoice_number}</strong> as the payment reference to ensure your payment is allocated correctly.</p>
            </div>

            <p>If you have already made this payment, please disregard this reminder. If you have any questions about your invoice, please don't hesitate to contact us.</p>

            <p>Thank you for being a valued CircleTel customer!</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>accounts@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
            ${data.account_number ? `<p>Account Number: ${data.account_number}</p>` : ''}
          </div>
        `;
  return baseTemplate(content);
}
