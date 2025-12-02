/**
 * Payment Receipt Email Template
 * Sent when a customer pays an invoice via NetCash Pay Now
 *
 * Different from payment-received.tsx which is for new orders.
 * This template is for invoice payments and shows:
 * - Invoice number
 * - Payment reference
 * - Remaining balance (for partial payments)
 */

import * as React from 'react';
import { Html, Head, Body, Preview, Container } from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelButton,
  CircleTelServiceDetails,
  CircleTelFooter,
  emailStyles,
  ServiceDetail,
} from '../../slices';

interface PaymentReceiptEmailProps {
  customerName: string;
  invoiceNumber: string;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  remainingBalance: string;
  invoiceUrl: string;
}

export const PaymentReceiptEmail: React.FC<PaymentReceiptEmailProps> = ({
  customerName = 'John Doe',
  invoiceNumber = 'INV-2025-001',
  paymentAmount = 'R 799.00',
  paymentDate = '2 December 2025',
  paymentMethod = 'EFT',
  paymentReference = 'NC-123456789',
  remainingBalance = 'R 0.00',
  invoiceUrl = 'https://www.circletel.co.za/dashboard/invoices/123',
}) => {
  const isFullyPaid = remainingBalance === 'R 0.00' || remainingBalance === 'R0.00';

  const paymentDetails: ServiceDetail[] = [
    { label: 'Invoice Number', value: invoiceNumber, icon: '📄' },
    { label: 'Amount Paid', value: paymentAmount, icon: '💰' },
    { label: 'Payment Method', value: paymentMethod, icon: '💳' },
    { label: 'Payment Date', value: paymentDate, icon: '📅' },
    { label: 'Reference', value: paymentReference, icon: '🔖' },
    ...(isFullyPaid
      ? [{ label: 'Status', value: 'Paid in Full', icon: '✅' }]
      : [{ label: 'Remaining Balance', value: remainingBalance, icon: '⏳' }]),
  ];

  return (
    <Html>
      <Head />
      <Preview>
        Payment of {paymentAmount} received for Invoice {invoiceNumber}. Thank you {customerName}!
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Payment Received!"
            subtitle={`Thank you ${customerName}, we've received your payment for Invoice ${invoiceNumber}.`}
            icon="✅"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            We have successfully received your payment of <strong>{paymentAmount}</strong> for
            Invoice <strong>{invoiceNumber}</strong>.
            {isFullyPaid ? (
              <> Your invoice has been marked as <strong>paid in full</strong>.</>
            ) : (
              <>
                {' '}
                Your remaining balance is <strong>{remainingBalance}</strong>.
              </>
            )}
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={paymentDetails} columns={2} />

          <CircleTelButton href={invoiceUrl} variant="primary" align="center">
            View Invoice
          </CircleTelButton>

          {!isFullyPaid && (
            <CircleTelTextBlock align="center" variant="small">
              <strong>Note:</strong> You still have an outstanding balance of {remainingBalance}.
              Please ensure this is paid by the due date to avoid service interruption.
            </CircleTelTextBlock>
          )}

          <CircleTelTextBlock align="center" variant="small">
            Need help? Contact us at{' '}
            <a href="mailto:support@circletel.co.za" style={{ color: '#F5831F' }}>
              support@circletel.co.za
            </a>{' '}
            or call{' '}
            <a href="tel:0860247253" style={{ color: '#F5831F' }}>
              0860 CIRCLE (247 253)
            </a>
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentReceiptEmail;
