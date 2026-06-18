/**
 * Invoice Generated Email Template - Debit Order Variant
 * Sent when invoice is generated for debit order payment
 * Different from PayNow variant: emphasizes automatic collection instead of manual payment
 */

import * as React from 'react';
import { Html, Head, Body, Preview, Container } from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelServiceDetails,
  CircleTelInvoiceTable,
  CircleTelFooter,
  emailStyles,
  ServiceDetail,
  InvoiceLineItem,
} from '../../slices';

interface InvoiceGeneratedDebitOrderEmailProps {
  customerName: string;
  companyName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  totalAmount: string;
  dueDate: string;
  lineItems?: InvoiceLineItem[];
  subtotal?: string;
  vatAmount?: string;
  accountNumber?: string;
}

export const InvoiceGeneratedDebitOrderEmail: React.FC<InvoiceGeneratedDebitOrderEmailProps> = ({
  customerName = 'John Doe',
  companyName = 'ABC Technologies',
  invoiceNumber = 'INV-2025-001',
  invoiceUrl = 'https://www.circletel.co.za/invoices/123',
  totalAmount = 'R 15,000.00',
  dueDate = '30 November 2025',
  lineItems = [
    { description: '100Mbps Fibre Business', quantity: 1, unitPrice: 'R 1,299.00', total: 'R 1,299.00' },
    { description: 'Installation Fee', quantity: 1, unitPrice: 'R 0.00', total: 'R 0.00' },
  ],
  subtotal = 'R 1,130.43',
  vatAmount = 'R 169.57',
  accountNumber = 'CT-2025-00123',
}) => {
  const invoiceDetails: ServiceDetail[] = [
    { label: 'Invoice Number', value: invoiceNumber },
    { label: 'Total Amount', value: totalAmount },
    { label: 'Collection Date', value: dueDate },
  ];

  if (accountNumber) {
    invoiceDetails.push({ label: 'Account Number', value: accountNumber });
  }

  return (
    <Html>
      <Head />
      <Preview>
        Invoice {invoiceNumber} ready - Debit order collection on {dueDate}
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Invoice Ready"
            subtitle={`Dear ${customerName}, your invoice will be collected automatically.`}
            variant="light"
          />

          <CircleTelTextBlock align="center">
            Thank you for choosing CircleTel. Your invoice has been generated and will be collected by debit order on the due date.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={invoiceDetails} columns={2} />

          <CircleTelTextBlock align="left">
            <strong>Invoice Details:</strong>
          </CircleTelTextBlock>

          <CircleTelInvoiceTable
            lineItems={lineItems}
            subtotal={subtotal}
            vatAmount={vatAmount}
            totalAmount={totalAmount}
          />

          <CircleTelTextBlock align="center">
            <strong style={{ color: '#28a745', fontSize: '16px' }}>
              Amount of R{totalAmount.replace('R ', '')} will be collected by debit order on {dueDate}. No action is needed.
            </strong>
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>What to Expect:</strong>
            <br />
            - Your account will be debited automatically on {dueDate}
            <br />
            - Ensure there are sufficient funds available
            <br />
            - You will receive an SMS and email confirmation
            <br />
            - No additional action is required from your side
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Important Information:</strong>
            <br />
            - Collection Date: <strong>{dueDate}</strong>
            <br />
            - Your reference number is: <strong>{invoiceNumber}</strong>
            <br />
            - For queries, contact: contactus@circletel.co.za
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceGeneratedDebitOrderEmail;
