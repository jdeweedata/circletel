/**
 * API Route: Email Quote PDF
 *
 * POST /api/quotes/business/[id]/email
 *
 * Sends a quote PDF via email to specified recipients
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { apiLogger } from '@/lib/logging';

// Vercel serverless config — allow longer execution for PDF rendering
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface EmailRequest {
  recipientEmail: string;
  recipientName?: string;
  ccEmails?: string[];
  message?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL
    ? `CircleTel Quotes <${process.env.RESEND_FROM_EMAIL}>`
    : process.env.NODE_ENV === 'development'
      ? 'CircleTel Quotes <onboarding@resend.dev>'
      : 'CircleTel Quotes <notifications@notify.circletel.co.za>';

  try {
    const { id } = await context.params;
    const body: EmailRequest = await request.json();

    const { recipientEmail, recipientName, ccEmails, message } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch quote with items
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Generate PDF by rendering the actual preview page with Puppeteer
    // This ensures the PDF matches the preview page exactly
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
    // Use ?shared=true so the preview page uses the public API (no auth needed)
    const previewUrl = `${baseUrl}/quotes/business/${id}/preview?shared=true`;

    let pdfBuffer: Buffer;

    const isLocal = process.env.NODE_ENV === 'development';

    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: isLocal
        ? '/usr/bin/google-chrome'
        : await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar'
          ),
      headless: true,
    });

    try {
      const page = await browser.newPage();

      // Navigate to the preview page and wait for content to render
      await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for the quote content to fully render
      await page.waitForSelector('.customer-acceptance, .terms-section', { timeout: 10000 }).catch(() => {
        // If selectors not found, page likely rendered — continue anyway
      });

      // Generate PDF matching print layout (A4)
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
        printBackground: true,
        preferCSSPageSize: true,
      });

      pdfBuffer = Buffer.from(pdf);
    } finally {
      await browser.close();
    }

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2
      }).format(amount);
    };

    // Escape HTML to prevent template injection
    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Safely format the message for HTML
    const safeMessage = message ? escapeHtml(message).replace(/\n/g, '<br>') : null;

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #F5831F 0%, #e67516 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .quote-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .quote-details h3 {
              margin-top: 0;
              color: #F5831F;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #666;
            }
            .value {
              color: #333;
              text-align: right;
            }
            .cta-button {
              display: inline-block;
              background: #F5831F;
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
              margin-top: 30px;
            }
            .message-box {
              background: #e3f2fd;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Your CircleTel Quote</h1>
          </div>

          <div class="content">
            <p>Dear ${recipientName || quote.contact_name},</p>

            <p>Thank you for your interest in CircleTel's services. Please find attached your personalized quote.</p>

            ${safeMessage ? `
              <div class="message-box">
                <strong>Message from CircleTel:</strong><br>
                ${safeMessage}
              </div>
            ` : ''}

            <div class="quote-details">
              <h3>Quote Summary</h3>
              <div class="detail-row">
                <span class="label">Quote Number:</span>
                <span class="value">${quote.quote_number}</span>
              </div>
              <div class="detail-row">
                <span class="label">Company:</span>
                <span class="value">${quote.company_name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service Address:</span>
                <span class="value">${quote.service_address}</span>
              </div>
              <div class="detail-row">
                <span class="label">Contract Term:</span>
                <span class="value">${quote.contract_term} months</span>
              </div>
              <div class="detail-row">
                <span class="label">Monthly Total:</span>
                <span class="value" style="color: #F5831F; font-weight: bold; font-size: 18px;">
                  ${formatCurrency(quote.total_monthly)}
                </span>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za'}/quotes/business/${quote.id}/preview" class="cta-button">
                View Quote Online
              </a>
            </p>

            <p><strong>What's Next?</strong></p>
            <ol>
              <li>Review the attached quote PDF</li>
              <li>Contact us if you have any questions</li>
              <li>Accept the quote to proceed with your order</li>
            </ol>

            <p>This quote is valid for 30 days from the issue date. If you have any questions or would like to discuss the quote, please don't hesitate to contact us.</p>

            <p>Best regards,<br>
            <strong>The CircleTel Team</strong></p>
          </div>

          <div class="footer">
            <p>
              <strong>CircleTel (Pty) Ltd</strong><br>
              Tel: +27 87 087 6305<br>
              Email: sales@circletel.co.za<br>
              Web: www.circletel.co.za
            </p>
            <p style="margin-top: 15px; color: #999;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email with PDF attachment
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      cc: ccEmails,
      subject: `CircleTel Quote ${quote.quote_number} - ${quote.company_name}`,
      html: emailHtml,
      attachments: [
        {
          filename: `CircleTel-Quote-${quote.quote_number}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    apiLogger.info('Resend API result', { result: JSON.stringify(emailResult, null, 2) });

    if (!emailResult.data || emailResult.error) {
      apiLogger.error('Resend error', { error: emailResult.error?.message || 'Unknown error' });
      throw new Error(emailResult.error?.message || 'Failed to send email');
    }

    // Update quote status and ensure sharing is enabled for the PDF renderer
    const statusUpdate: Record<string, any> = { share_enabled: true };
    if (quote.status === 'draft') {
      statusUpdate.status = 'sent';
    }
    await supabase
      .from('business_quotes')
      .update(statusUpdate)
      .eq('id', id);

    // Track email sent event in the tracking system
    await supabase
      .from('quote_tracking')
      .insert({
        quote_id: id,
        event_type: 'email_sent',
        viewer_email: recipientEmail,
        viewer_name: recipientName,
        metadata: {
          cc_emails: ccEmails,
          has_custom_message: !!message,
          email_id: emailResult.data.id
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Quote email sent successfully',
      emailId: emailResult.data.id
    });

  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    apiLogger.error('Email sending error', { error: errorMsg });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: errorMsg
      },
      { status: 500 }
    );
  }
}
