/**
 * KYC Upload Request Email Template
 * Sent when customer needs to upload KYC documents
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

interface KYCUploadRequestEmailProps {
  customerName: string;
  kycUploadUrl: string;
  deadline?: string;
}

export const KYCUploadRequestEmail: React.FC<KYCUploadRequestEmailProps> = ({
  customerName = 'John Doe',
  kycUploadUrl = 'https://www.circletel.co.za/kyc/upload',
  deadline = '7 days',
}) => {
  return (
    <Html>
      <Head />
      <Preview>
        Action Required: Please upload your KYC documents to complete your order
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="KYC Verification Required"
            subtitle={`Hi ${customerName}, we need a few documents to complete your order.`}
            icon="📄"
            variant="light"
          />

          <CircleTelTextBlock align="left">
            To comply with South African FICA regulations and complete your order, we need
            you to upload the following documents:
            <br />
            <br />
            <strong>Required Documents:</strong>
            <br />
            • Copy of your South African ID (front and back)
            <br />
            • Proof of residence (utility bill, bank statement, or lease agreement)
            <br />
            • Selfie photo holding your ID
            <br />
            <br />
            <strong>Document Requirements:</strong>
            <br />
            • Clear, legible images or scans
            <br />
            • Not older than 3 months (proof of residence)
            <br />
            • Accepted formats: PDF, JPG, PNG
            <br />
            • Maximum file size: 5MB per document
          </CircleTelTextBlock>

          <CircleTelButton href={kycUploadUrl} variant="primary" align="center">
            Upload Documents Now
          </CircleTelButton>

          <CircleTelTextBlock align="center" variant="small">
            Please complete this within <strong>{deadline}</strong> to avoid delays in
            processing your order.
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="small">
            <strong>🔒 Your Privacy Matters:</strong> All documents are encrypted and stored
            securely. We comply with POPIA regulations and will never share your information
            without consent.
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default KYCUploadRequestEmail;
