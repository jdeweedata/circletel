/**
 * Base Email Template
 * Provides the HTML wrapper and styling for all email templates
 */

export interface BaseTemplateOptions {
  /** Custom CSS to inject */
  customStyles?: string;
}

/**
 * CircleTel brand colors
 */
export const BRAND_COLORS = {
  primary: '#F5831F',        // CircleTel Orange
  secondary: '#1F2937',      // Dark Neutral
  background: '#E6E9EF',     // Light Neutral
  success: '#10B981',        // Green
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Red
  info: '#3B82F6',           // Blue
  text: '#1F2937',
  textMuted: '#4B5563',
  textLight: '#6B7280',
} as const;

/**
 * Base HTML template wrapper for all emails
 */
export function wrapEmailContent(content: string, options?: BaseTemplateOptions): string {
  const customStyles = options?.customStyles || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.6;
          color: ${BRAND_COLORS.text};
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: ${BRAND_COLORS.primary};
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border: 1px solid ${BRAND_COLORS.background};
          border-top: none;
        }
        .footer {
          background-color: ${BRAND_COLORS.background};
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: ${BRAND_COLORS.textMuted};
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${BRAND_COLORS.primary};
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .info-box {
          background-color: ${BRAND_COLORS.background};
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .label {
          font-weight: bold;
          color: ${BRAND_COLORS.textMuted};
        }
        .value {
          color: ${BRAND_COLORS.text};
        }
        .success-box {
          background-color: #D1FAE5;
          border-left: 4px solid ${BRAND_COLORS.success};
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        .warning-box {
          background-color: #FEF3C7;
          border-left: 4px solid ${BRAND_COLORS.warning};
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        .error-box {
          background-color: #FEE2E2;
          border-left: 4px solid ${BRAND_COLORS.error};
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        ${customStyles}
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

/**
 * Create a standard header section
 */
export function createHeader(title: string, subtitle?: string, backgroundColor?: string): string {
  const bgColor = backgroundColor || BRAND_COLORS.primary;
  return `
    <div class="header" style="background-color: ${bgColor};">
      <h1>${title}</h1>
      ${subtitle ? `<p style="margin: 5px 0 0; font-size: 14px; color: white;">${subtitle}</p>` : ''}
    </div>
  `;
}

/**
 * Create a gradient header section
 */
export function createGradientHeader(title: string, subtitle?: string, fromColor?: string, toColor?: string): string {
  const from = fromColor || BRAND_COLORS.primary;
  const to = toColor || '#FF6B00';
  return `
    <div class="header" style="background: linear-gradient(135deg, ${from} 0%, ${to} 100%);">
      <h1>${title}</h1>
      ${subtitle ? `<p style="margin: 5px 0 0; font-size: 14px; color: white;">${subtitle}</p>` : ''}
    </div>
  `;
}

/**
 * Create a standard footer section
 */
export function createFooter(department?: string, email?: string, phone?: string, accountNumber?: string): string {
  const dept = department || 'CircleTel (Pty) Ltd';
  const emailAddr = email || 'support@circletel.co.za';
  const phoneNum = phone || '0860 CIRCLE (0860 247 253)';

  return `
    <div class="footer">
      <p>${dept}</p>
      <p>${emailAddr} | ${phoneNum}</p>
      ${accountNumber ? `<p>Account Number: ${accountNumber}</p>` : ''}
    </div>
  `;
}

/**
 * Create an info box with key-value rows
 */
export function createInfoBox(rows: Array<{ label: string; value: string }>, style?: string): string {
  const rowsHtml = rows.map(row => `
    <div class="info-row">
      <span class="label">${row.label}:</span>
      <span class="value">${row.value}</span>
    </div>
  `).join('');

  return `
    <div class="info-box"${style ? ` style="${style}"` : ''}>
      ${rowsHtml}
    </div>
  `;
}

/**
 * Create a CTA button
 */
export function createButton(text: string, url: string, color?: string): string {
  const bgColor = color || BRAND_COLORS.primary;
  return `
    <a href="${url}" class="button" style="background-color: ${bgColor};">
      ${text}
    </a>
  `;
}

/**
 * Format currency for South African Rand
 */
export function formatCurrency(amount: number): string {
  return `R ${amount.toFixed(2)}`;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
