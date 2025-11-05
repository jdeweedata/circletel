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
import { chromium } from 'playwright';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'CircleTel Quotes <quotes@circletel.co.za>';

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

    // Generate PDF using Playwright by rendering the actual preview page
    // This ensures the PDF matches the preview page exactly
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const previewUrl = `${baseUrl}/quotes/business/${id}/preview`;

    let pdfBuffer: Buffer;
    const browser = await chromium.launch({ headless: true });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to the preview page
      await page.goto(previewUrl, { waitUntil: 'networkidle' });

      // Wait for the content to load
      await page.waitForSelector('img[alt="CircleTel Logo"]', { timeout: 10000 });

      // Generate PDF with proper page settings
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: true
      });

      pdfBuffer = Buffer.from(pdf);

      await context.close();
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

            ${message ? `
              <div class="message-box">
                <strong>Message from CircleTel:</strong><br>
                ${message.replace(/\n/g, '<br>')}
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
              Email: quotes@circletel.co.za<br>
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

    if (!emailResult.data) {
      throw new Error('Failed to send email');
    }

    // Update quote status if draft
    if (quote.status === 'draft') {
      await supabase
        .from('business_quotes')
        .update({ status: 'sent' })
        .eq('id', id);
    }

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
    console.error('Email sending error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: error.message
      },
      { status: 500 }
    );
  }
}
