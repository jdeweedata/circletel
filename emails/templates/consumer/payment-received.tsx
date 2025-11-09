/**
 * Payment Received Email Template
 * Sent when a customer's payment is successfully processed
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

interface PaymentReceivedEmailProps {
  customerName: string;
  paymentAmount: string;
  paymentMethod: string;
  paymentDate: string;
  orderNumber: string;
  receiptUrl?: string;
}

export const PaymentReceivedEmail: React.FC<PaymentReceivedEmailProps> = ({
  customerName = 'John Doe',
  paymentAmount = 'R 799.00',
  paymentMethod = 'Credit Card',
  paymentDate = '8 November 2025',
  orderNumber = 'ORD-2025-001',
  receiptUrl = 'https://www.circletel.co.za/receipts/123',
}) => {
  const paymentDetails: ServiceDetail[] = [
    { label: 'Amount Paid', value: paymentAmount, icon: '💰' },
    { label: 'Payment Method', value: paymentMethod, icon: '💳' },
    { label: 'Payment Date', value: paymentDate, icon: '📅' },
    { label: 'Order Number', value: orderNumber, icon: '📦' },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        Payment of {paymentAmount} received successfully. Thank you {customerName}!
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Payment Received!"
            subtitle={`Thank you ${customerName}, your payment has been processed successfully.`}
            icon="✅"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            We have successfully received your payment of <strong>{paymentAmount}</strong>.
            Your order is now being processed and you'll receive updates shortly.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={paymentDetails} columns={2} />

          {receiptUrl && (
            <CircleTelButton href={receiptUrl} variant="primary" align="center">
              Download Receipt
            </CircleTelButton>
          )}

          <CircleTelTextBlock align="center" variant="small">
            Need help? Contact us at{' '}
            <a href="mailto:support@circletel.co.za" style={{ color: '#F5831F' }}>
              support@circletel.co.za
            </a>
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentReceivedEmail;
