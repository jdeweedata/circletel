import { config } from 'dotenv';
import { resolve } from 'path';
import { chromium } from 'playwright-core';

config({ path: resolve(process.cwd(), '.env.production.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const quoteId = 'af633333-2295-4128-a84e-194e269536d7';
const quoteNumber = 'BQ-2026-001';
const companyName = 'MABECE TILANA INCORPORATED ("MTI") ATTORNEYS';
const contactName = 'Shirley Tilana-Mabece';
const contactEmail = 'tilanas@mtilaw.co.za';
const contactPhone = '084 827 9268';
const serviceAddress = '25 Owl Street, 15th Metal Box, Braamfontein Werf, Johannesburg';
const quoteDate = '16 March 2026';
const validUntil = '15 April 2026';
const contractTerm = '24';
const totalContractValue = 'R 45,576.00';

async function generatePDF(): Promise<Buffer> {
  console.log('Generating PDF from preview page (with ?shared=true)...');
  const previewUrl = `https://www.circletel.co.za/quotes/business/${quoteId}/preview?shared=true`;

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Hide non-print elements (action buttons, WhatsApp widget)
    await page.evaluate(() => {
      // Hide print:hidden elements
      document.querySelectorAll('.print\\:hidden, [class*="print:hidden"]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      // Hide fixed elements (WhatsApp widget, nav)
      document.querySelectorAll('*').forEach(el => {
        if (el instanceof HTMLElement) {
          const pos = getComputedStyle(el).position;
          if (pos === 'fixed') {
            el.style.display = 'none';
          }
        }
      });
    });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      printBackground: true,
      preferCSSPageSize: false,
    });

    await context.close();
    console.log(`PDF generated: ${pdf.length} bytes, ${Math.ceil(pdf.length / 1024)}KB`);
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function buildEmailHtml(): string {
  // Email HTML that mirrors the quote preview page layout
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 30px 15px;">
        <table role="presentation" width="700" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden;">

          <!-- ============================================ -->
          <!-- HEADER: Logo + Company Info -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 30px 35px 20px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: top; width: 200px;">
                    <img src="https://www.circletel.co.za/images/logo.png" alt="CircleTel" width="150" style="display: block;" />
                  </td>
                  <td style="vertical-align: top; text-align: right;">
                    <p style="margin: 0; font-size: 12px; color: #4B5563; line-height: 20px;">
                      Tel: +27 87 087 6305<br>
                      Email: sales@circletel.co.za<br>
                      Web: www.circletel.co.za
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- QUOTE HEADER + PREPARED FOR -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px 20px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Left: Quote Details -->
                  <td style="vertical-align: top; width: 55%;">
                    <h1 style="margin: 0 0 15px 0; font-size: 28px; color: #1F2937; font-weight: 800; letter-spacing: -0.5px;">QUOTE</h1>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 13px; padding: 3px 15px 3px 0;">Quote No:</td>
                        <td style="color: #F5831F; font-size: 13px; font-weight: 700;">${quoteNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 13px; padding: 3px 15px 3px 0;">Date:</td>
                        <td style="color: #1F2937; font-size: 13px; font-weight: 600;">${quoteDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 13px; padding: 3px 15px 3px 0;">Valid Until:</td>
                        <td style="color: #1F2937; font-size: 13px; font-weight: 600;">${validUntil}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 13px; padding: 3px 15px 3px 0;">Status:</td>
                        <td style="padding: 3px 0;">
                          <span style="display: inline-block; background-color: #F5831F; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 12px; border-radius: 4px;">Draft</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Right: Prepared For Box -->
                  <td style="vertical-align: top; width: 45%;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 2px solid #F5831F; border-radius: 8px;">
                      <tr>
                        <td style="padding: 18px 20px; text-align: right;">
                          <p style="margin: 0 0 6px 0; font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Prepared For:</p>
                          <p style="margin: 0 0 10px 0; font-size: 16px; color: #1F2937; font-weight: 800; line-height: 22px;">${companyName}</p>
                          <p style="margin: 0; font-size: 12px; color: #4B5563; line-height: 18px;">
                            ${contactName}<br>
                            ${contactEmail}<br>
                            ${contactPhone}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding: 0 35px;"><hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;"></td></tr>

          <!-- ============================================ -->
          <!-- CUSTOMER DETAILS + SERVICE SUMMARY -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 20px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Left: Customer Details -->
                  <td style="vertical-align: top; width: 50%; padding-right: 20px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; font-weight: 800;">CUSTOMER DETAILS</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0; width: 110px; vertical-align: top;">Company:</td>
                        <td style="color: #1F2937; font-size: 12px; padding: 4px 0; font-weight: 600; text-align: right;">${companyName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0; vertical-align: top;">Contact Person:</td>
                        <td style="color: #1F2937; font-size: 12px; padding: 4px 0; text-align: right;">${contactName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0; vertical-align: top;">Email:</td>
                        <td style="color: #F5831F; font-size: 12px; padding: 4px 0; text-align: right;">${contactEmail}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0; vertical-align: top;">Phone:</td>
                        <td style="color: #1F2937; font-size: 12px; padding: 4px 0; font-weight: 600; text-align: right;">${contactPhone}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0; vertical-align: top;">Service Address:</td>
                        <td style="color: #1F2937; font-size: 12px; padding: 4px 0; font-weight: 600; text-align: right;">${serviceAddress}</td>
                      </tr>
                    </table>
                  </td>
                  <!-- Right: Service Summary -->
                  <td style="vertical-align: top; width: 50%; padding-left: 20px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; font-weight: 800;">SERVICE SUMMARY</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0;">Customer Type:</td>
                        <td style="color: #1F2937; font-size: 12px; padding: 4px 0; text-align: right;">SMME</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0;">Contract Term:</td>
                        <td style="color: #1F2937; font-size: 12px; padding: 4px 0; text-align: right; font-weight: 600;">${contractTerm} months</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0;">Services:</td>
                        <td style="color: #1F2937; font-size: 12px; padding: 4px 0; text-align: right;">1 package(s)</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 12px; padding: 4px 0;">Monthly Total:</td>
                        <td style="color: #F5831F; font-size: 16px; padding: 4px 0; text-align: right; font-weight: 800;">R 1,899.00</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- SERVICE PACKAGE DETAILS TABLE -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px 20px 35px;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; font-weight: 800;">SERVICE PACKAGE DETAILS</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden;">
                <!-- Table Header -->
                <tr style="background-color: #F9FAFB;">
                  <td style="padding: 10px 12px; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 1px solid #E5E7EB;">Service Description</td>
                  <td style="padding: 10px 8px; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 1px solid #E5E7EB; text-align: center;">Qty</td>
                  <td style="padding: 10px 8px; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 1px solid #E5E7EB; text-align: center;">Speed</td>
                  <td style="padding: 10px 8px; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 1px solid #E5E7EB; text-align: center;">Data</td>
                  <td style="padding: 10px 12px; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 1px solid #E5E7EB; text-align: right;">Monthly (Excl. VAT)</td>
                  <td style="padding: 10px 12px; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 1px solid #E5E7EB; text-align: right;">Installation (Excl. VAT)</td>
                </tr>
                <!-- Service Row -->
                <tr>
                  <td style="padding: 12px; font-size: 13px; color: #1F2937;">
                    <strong>SkyFibre SME Professional</strong><br>
                    <span style="font-size: 11px; color: #9CA3AF; font-style: italic;">Primary</span>
                  </td>
                  <td style="padding: 12px 8px; font-size: 13px; color: #1F2937; text-align: center;">1</td>
                  <td style="padding: 12px 8px; font-size: 13px; color: #1F2937; text-align: center;">100&#8595;/20&#8593; Mbps</td>
                  <td style="padding: 12px 8px; font-size: 13px; color: #1F2937; text-align: center;">Unlimited</td>
                  <td style="padding: 12px; font-size: 13px; color: #1F2937; text-align: right; font-weight: 600;">R 1,651.30</td>
                  <td style="padding: 12px; font-size: 13px; color: #1F2937; text-align: right;">R 0.00</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- PRICING BREAKDOWN + INCLUSIVE BENEFITS -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px 20px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Left: Pricing -->
                  <td style="vertical-align: top; width: 50%; padding-right: 20px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; font-weight: 800;">PRICING BREAKDOWN</h2>
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Monthly Recurring Costs</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #4B5563; font-size: 13px; padding: 5px 0;">Subtotal (Excl. VAT):</td>
                        <td style="color: #1F2937; font-size: 13px; padding: 5px 0; text-align: right; font-weight: 600;">R 1,651.30</td>
                      </tr>
                      <tr>
                        <td style="color: #4B5563; font-size: 13px; padding: 5px 0;">VAT (15%):</td>
                        <td style="color: #1F2937; font-size: 13px; padding: 5px 0; text-align: right;">R 247.70</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 5px 0;"><hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;"></td>
                      </tr>
                      <tr>
                        <td style="color: #1F2937; font-size: 14px; padding: 5px 0; font-weight: 800;">Monthly Total (Incl. VAT):</td>
                        <td style="color: #F5831F; font-size: 16px; padding: 5px 0; text-align: right; font-weight: 800;">R 1,899.00</td>
                      </tr>
                    </table>

                    <!-- Contract Summary Box -->
                    <h3 style="margin: 20px 0 10px 0; font-size: 14px; color: #1F2937; font-weight: 800;">CONTRACT SUMMARY</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 2px dashed #FCA5A5; border-radius: 8px; padding: 2px;">
                      <tr>
                        <td style="padding: 15px; text-align: center;">
                          <p style="margin: 0; font-size: 12px; color: #6B7280;">Contract Term:</p>
                          <p style="margin: 4px 0 12px 0; font-size: 20px; color: #1F2937; font-weight: 800;">${contractTerm} months</p>
                          <p style="margin: 0; font-size: 12px; color: #6B7280;">Total Contract Value:</p>
                          <p style="margin: 4px 0 0 0; font-size: 22px; color: #DC2626; font-weight: 800;">${totalContractValue}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Right: Inclusive Benefits -->
                  <td style="vertical-align: top; width: 50%; padding-left: 20px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; font-weight: 800;">INCLUSIVE BENEFITS</h2>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; 24/7 Network Operations Centre (NOC) monitoring</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; 99.9% Service Level Agreement (SLA)</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Dedicated account manager</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Equipment maintenance and replacement</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Free technical support during business hours</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Monthly usage reporting and analytics</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; No fair usage policy restrictions</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Priority technical support</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Professional installation and configuration</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Service level reporting</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; South African-based customer support</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Static IP address allocation</td></tr>
                      <tr><td style="padding: 3px 0; font-size: 12px; color: #4B5563;">&#10003; Unlimited data usage</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- TERMS AND CONDITIONS -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px 20px 35px;">
              <h2 style="margin: 0 0 5px 0; font-size: 16px; color: #1F2937; font-weight: 800;">TERMS AND CONDITIONS</h2>
              <hr style="border: none; border-top: 2px solid #F5831F; margin: 0 0 15px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Left Column -->
                  <td style="vertical-align: top; width: 48%; padding-right: 15px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">1. CONTRACT TERMS</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">This quote is valid for 30 days from the date issued. Pricing is subject to change after this period. Contract term as specified above.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">2. INSTALLATION</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">Installation will be scheduled within 7-14 business days of order confirmation, subject to site readiness, landlord approval (where applicable), and third-party provider availability.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">3. PAYMENT TERMS</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">Monthly charges are payable in advance. Installation fees are due on completion of installation. All amounts are inclusive of VAT where applicable.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">4. SERVICE LEVEL AGREEMENT</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">CircleTel provides a 99.5% uptime SLA measured monthly. Service credits apply for verified outages exceeding SLA thresholds.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">5. SITE SURVEY</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">This quote is subject to a successful site survey confirming line-of-sight and signal quality. CircleTel reserves the right to revise pricing or service specifications based on site survey findings.</p>
                  </td>
                  <!-- Right Column -->
                  <td style="vertical-align: top; width: 48%; padding-left: 15px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">6. CANCELLATION</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">30 days written notice required for cancellation. Early termination fees may apply for contract term commitments.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">7. EQUIPMENT</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">Customer Premises Equipment (CPE) remains CircleTel property and must be returned in good condition upon service termination.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">8. LANDLORD APPROVAL</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">For wireless installations, the customer is responsible for obtaining written approval from the property owner/landlord for CPE mounting on the building. Installation cannot proceed without this approval.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">9. FAIR USAGE</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">While data is unlimited, CircleTel reserves the right to manage traffic during peak periods to ensure fair usage across all customers.</p>

                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #1F2937; font-weight: 700;">10. GOVERNING LAW</h3>
                    <p style="margin: 0 0 12px 0; font-size: 11px; color: #4B5563; line-height: 16px;">This agreement is governed by South African law. Full terms and conditions available at <a href="https://www.circletel.co.za/terms-of-service" style="color: #F5831F;">www.circletel.co.za/terms</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- CUSTOMER ACCEPTANCE -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px 20px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 2px solid #F5831F; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 25px; text-align: center;">
                    <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #F5831F; font-weight: 800;">CUSTOMER ACCEPTANCE</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 25px 20px 25px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Left: Declaration -->
                        <td style="vertical-align: top; width: 50%; padding-right: 15px;">
                          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1F2937; font-weight: 700;">ACCEPTANCE DECLARATION</h3>
                          <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563; line-height: 16px;">&#9744; I accept the terms and conditions as outlined above</p>
                          <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563; line-height: 16px;">&#9744; I confirm the service address and technical requirements are correct</p>
                          <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563; line-height: 16px;">&#9744; I authorize CircleTel to proceed with site survey and installation</p>
                          <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563; line-height: 16px;">&#9744; I confirm landlord/property owner approval for CPE installation</p>
                          <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B5563; line-height: 16px;">&#9744; I have authority to sign on behalf of the company</p>
                        </td>
                        <!-- Right: Signature -->
                        <td style="vertical-align: top; width: 50%; padding-left: 15px;">
                          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1F2937; font-weight: 700;">SIGNATURE</h3>
                          <p style="margin: 0 0 3px 0; font-size: 11px; color: #6B7280;">Authorized Signatory Name:</p>
                          <p style="margin: 0 0 10px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 8px;">&nbsp;</p>
                          <p style="margin: 0 0 3px 0; font-size: 11px; color: #6B7280;">Position/Title:</p>
                          <p style="margin: 0 0 10px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 8px;">&nbsp;</p>
                          <p style="margin: 0 0 3px 0; font-size: 11px; color: #6B7280;">Date:</p>
                          <p style="margin: 0 0 10px 0; border-bottom: 1px solid #D1D5DB; padding-bottom: 8px;">&nbsp;</p>
                          <p style="margin: 0 0 3px 0; font-size: 11px; color: #6B7280;">Signature:</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" style="border: 1px dashed #9CA3AF; width: 100%; height: 50px; margin-top: 5px;">
                            <tr><td style="text-align: center; color: #D1D5DB; font-size: 12px;">Sign Here</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 25px 15px 25px;">
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0 0 10px 0;">
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">
                      This quote can be accepted digitally via the online portal or manually signed and returned to <a href="mailto:sales@circletel.co.za" style="color: #F5831F;">sales@circletel.co.za</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- IMPORTANT NOTES (Pre-Acceptance Requirements) -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px 20px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFF7ED; border-left: 4px solid #F5831F; border-radius: 0 8px 8px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #92400E; font-weight: 700;">BEFORE ACCEPTANCE &mdash; REQUIRED STEPS</h3>
                    <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 20px;">
                      1. <strong>Site Survey</strong> &mdash; CircleTel will schedule a site survey to confirm wireless feasibility and signal quality at the service address.<br>
                      2. <strong>Landlord Approval</strong> &mdash; Written approval from the property owner/landlord is required for the wireless CPE mounting.<br>
                      3. <strong>Quote Acceptance</strong> &mdash; Once the above are confirmed, the quote can be formally accepted and installation scheduled.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- VIEW ONLINE CTA -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px 25px 35px; text-align: center;">
              <a href="https://www.circletel.co.za/quotes/business/${quoteId}/preview?shared=true" style="display: inline-block; background: #F5831F; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">ACCEPT QUOTE &amp; REQUEST TO SIGN</a>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #9CA3AF;">View the full quote and accept digitally via the online portal</p>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- FOOTER: 3 Columns -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 35px;">
              <hr style="border: none; border-top: 2px solid #F5831F; margin: 0;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 35px 15px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width: 33%; vertical-align: top; text-align: center;">
                    <h3 style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937; font-weight: 700;">HEAD OFFICE</h3>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; line-height: 16px;">
                      CircleTel (Pty) Ltd<br>
                      Registration: 2020/123456/07<br>
                      VAT: 4123456789
                    </p>
                  </td>
                  <td style="width: 34%; vertical-align: top; text-align: center;">
                    <h3 style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937; font-weight: 700;">CONTACT</h3>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; line-height: 16px;">
                      Tel: +27 87 087 6305<br>
                      Email: sales@circletel.co.za<br>
                      Web: www.circletel.co.za
                    </p>
                  </td>
                  <td style="width: 33%; vertical-align: top; text-align: center;">
                    <h3 style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937; font-weight: 700;">SUPPORT</h3>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; line-height: 16px;">
                      WhatsApp: 082 487 3900<br>
                      Business Hours: 08:00 - 17:00<br>
                      contactus@circletel.co.za
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 35px 20px 35px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; line-height: 16px;">
                Thank you for choosing CircleTel as your telecommunications partner.<br>
                We look forward to delivering exceptional connectivity solutions for your business.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main() {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not found');
    process.exit(1);
  }

  console.log(`Preparing quote email for: ${companyName}`);
  console.log(`Quote: ${quoteNumber}`);
  console.log('---');

  // Step 1: Generate PDF from the live preview page
  const pdfBuffer = await generatePDF();

  // Step 2: Build email HTML matching the quote design
  const emailHtml = buildEmailHtml();

  // Step 3: Send via Resend with PDF attachment
  console.log('Sending email with PDF attachment...');
  const pdfBase64 = pdfBuffer.toString('base64');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CircleTel Quotes <billing@notify.circletel.co.za>',
      to: 'jeffrey.de.wee@circletel.co.za',
      subject: `[TEST] CircleTel Quote ${quoteNumber} - ${companyName}`,
      html: emailHtml,
      attachments: [
        {
          filename: `CircleTel-Quote-${quoteNumber}.pdf`,
          content: pdfBase64,
        }
      ],
    }),
  });

  const result = await response.json();

  if (response.ok) {
    console.log('Email sent successfully!');
    console.log('Email ID:', result.id);
  } else {
    console.error('Failed to send:', JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
