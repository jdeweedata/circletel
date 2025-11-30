/**
 * Invoice Generated Email Template
 * Sent when invoice is generated and ready for payment
 */

import * as React from 'react';
import { Html, Head, Body, Preview, Container } from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelButton,
  CircleTelServiceDetails,
  CircleTelInvoiceTable,
  CircleTelFooter,
  emailStyles,
  ServiceDetail,
  InvoiceLineItem,
} from '../../slices';

interface InvoiceGeneratedEmailProps {
  customerName: string;
  companyName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  paymentUrl: string;
  totalAmount: string;
  dueDate: string;
  lineItems?: InvoiceLineItem[];
  subtotal?: string;
  vatAmount?: string;
  accountNumber?: string;
}

export const InvoiceGeneratedEmail: React.FC<InvoiceGeneratedEmailProps> = ({
  customerName = 'John Doe',
  companyName = 'ABC Technologies',
  invoiceNumber = 'INV-2025-001',
  invoiceUrl = 'https://www.circletel.co.za/invoices/123',
  paymentUrl = 'https://www.circletel.co.za/invoices/123/pay',
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
    { label: 'Due Date', value: dueDate },
  ];

  if (accountNumber) {
    invoiceDetails.push({ label: 'Account Number', value: accountNumber });
  }

  return (
    <Html>
      <Head />
      <Preview>
        Invoice {invoiceNumber} ready - Amount Due: {totalAmount}
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Invoice Ready"
            subtitle={`Dear ${customerName}, your invoice is ready for payment.`}
            variant="light"
          />

          <CircleTelTextBlock align="center">
            Thank you for choosing CircleTel. Your invoice has been generated and is ready for payment.
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

          <CircleTelButton href={paymentUrl} variant="primary" align="center">
            Pay Now
          </CircleTelButton>

          <CircleTelButton href={invoiceUrl} variant="secondary" align="center">
            Download Invoice PDF
          </CircleTelButton>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Payment Options:</strong>
            <br />
            - <strong>Online Payment:</strong> Click "Pay Now" to pay securely online
            <br />
            - <strong>EFT Transfer:</strong> Download the invoice for our banking details
            <br />
            - <strong>Debit Order:</strong> Set up recurring payments via your dashboard
            <br />
            <br />
            We accept: Credit Cards, Instant EFT, Capitec Pay, and more.
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Important Information:</strong>
            <br />
            - Payment is due by: <strong>{dueDate}</strong>
            <br />
            - Late payments may result in service suspension
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

export default InvoiceGeneratedEmail;
