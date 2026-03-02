/**
 * Payment Method Registration Email Template
 * Sent when customer needs to register their payment method (bank account/credit card)
 */

import * as React from 'react';
import { Html, Head, Body, Preview, Container } from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelButton,
  CircleTelFooter,
  emailStyles,
} from '../../slices';

interface PaymentMethodRegistrationEmailProps {
  customerName: string;
  orderNumber: string;
  mandateUrl: string;
  monthlyAmount: number;
  packageName?: string;
}

export const PaymentMethodRegistrationEmail: React.FC<PaymentMethodRegistrationEmailProps> = ({
  customerName = 'John Doe',
  orderNumber = 'ORD-2025-1234',
  mandateUrl = 'https://pay.netcash.co.za/...',
  monthlyAmount = 899,
  packageName = 'SkyFibre Home Plus',
}) => {
  return (
    <Html>
      <Head />
      <Preview>
        {customerName}, please register your payment method for recurring billing
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Payment Method Required"
            subtitle={`Set up recurring billing for ${orderNumber}`}
            icon="💳"
            variant="gradient"
          />

          <CircleTelTextBlock align="left">
            Hi {customerName},
            <br />
            <br />
            Great news! Your KYC verification has been approved and we're ready to proceed with your
            service installation.
            <br />
            <br />
            Before we can activate your <strong>{packageName}</strong> service (R{monthlyAmount.toFixed(2)}/month), we need you to
            register your payment method for automatic monthly billing.
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left">
            <strong>Why do we need this?</strong>
            <br />
            <br />
            • Your service will be billed monthly after activation
            <br />
            • Automated payments ensure uninterrupted service
            <br />
            • You can choose bank account (debit order) or credit card
            <br />
            • All information is securely encrypted and processed by NetCash
          </CircleTelTextBlock>

          <CircleTelButton href={mandateUrl} variant="primary" align="center">
            Register Payment Method Now
          </CircleTelButton>

          <CircleTelTextBlock align="left">
            <strong>How it works:</strong>
            <br />
            <br />
            1. Click the button above to access the secure NetCash registration form
            <br />
            2. You'll receive an OTP via SMS for verification
            <br />
            3. Complete your banking details (bank account or credit card)
            <br />
            4. Digitally sign the mandate
            <br />
            5. Done! We'll automatically update your order status
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="small">
            <strong>Important:</strong> This registration link expires in 7 days. If you need a new
            link, please contact our support team or reply to this email.
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="small">
            <strong>Order Reference:</strong> {orderNumber}
            <br />
            <strong>Monthly Amount:</strong> R{monthlyAmount.toFixed(2)}
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentMethodRegistrationEmail;
