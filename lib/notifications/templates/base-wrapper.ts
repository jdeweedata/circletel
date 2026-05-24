/**
 * Base email template wrapper — shared HTML/CSS shell for all notification emails.
 * Extracted from notification-service.ts renderTemplate method.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

export function baseTemplate(content: string): string {
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
            color: #1F2937;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #F5831F;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #E6E9EF;
            border-top: none;
          }
          .footer {
            background-color: #E6E9EF;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #4B5563;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #F5831F;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .info-box {
            background-color: #E6E9EF;
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
            color: #4B5563;
          }
          .value {
            color: #1F2937;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
}
