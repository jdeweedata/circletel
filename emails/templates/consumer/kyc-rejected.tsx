/**
 * KYC Rejected Email Template
 * Sent when KYC documents are rejected with reason
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

interface KYCRejectedEmailProps {
  customerName: string;
  rejectionReason: string;
  resubmitUrl: string;
}

export const KYCRejectedEmail: React.FC<KYCRejectedEmailProps> = ({
  customerName = 'John Doe',
  rejectionReason = 'The proof of residence document provided is older than 3 months.',
  resubmitUrl = 'https://www.circletel.co.za/kyc/resubmit',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Action Required: Your KYC documents need to be resubmitted</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="KYC Documents Require Attention"
            subtitle={`Hi ${customerName}, we need you to resubmit some documents.`}
            icon="⚠️"
            variant="light"
          />

          <CircleTelTextBlock align="left">
            Unfortunately, we were unable to approve your KYC documents for the following
            reason:
            <br />
            <br />
            <div
              style={{
                padding: '12px',
                backgroundColor: '#FEF2F2',
                borderLeft: '4px solid #EF4444',
                borderRadius: '4px',
                marginBottom: '16px',
              }}
            >
              <strong>Reason:</strong> {rejectionReason}
            </div>
            Don't worry! You can easily resubmit your documents by clicking the button below.
          </CircleTelTextBlock>

          <CircleTelButton href={resubmitUrl} variant="primary" align="center">
            Resubmit Documents
          </CircleTelButton>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Tips for successful verification:</strong>
            <br />
            • Ensure documents are clear and legible
            <br />
            • Proof of residence must be dated within the last 3 months
            <br />
            • ID document should show all corners clearly
            <br />
            • Selfie should clearly show your face and ID
            <br />
            <br />
            Need help? Contact our support team for guidance.
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default KYCRejectedEmail;
