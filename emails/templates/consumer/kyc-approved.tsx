/**
 * KYC Approved Email Template
 * Sent when KYC documents are approved
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

interface KYCApprovedEmailProps {
  customerName: string;
  dashboardUrl?: string;
  nextSteps?: string;
}

export const KYCApprovedEmail: React.FC<KYCApprovedEmailProps> = ({
  customerName = 'John Doe',
  dashboardUrl = 'https://www.circletel.co.za/dashboard',
  nextSteps = 'We are now processing your order and will contact you soon to schedule installation.',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Great news {customerName}! Your KYC verification has been approved.</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="KYC Verified!"
            subtitle={`Congratulations ${customerName}, your documents have been approved.`}
            icon="✅"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            Your KYC documents have been successfully verified and approved. Thank you for
            providing the required information!
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left">
            <strong>What happens next?</strong>
            <br />
            <br />
            {nextSteps}
          </CircleTelTextBlock>

          {dashboardUrl && (
            <CircleTelButton href={dashboardUrl} variant="primary" align="center">
              View Order Status
            </CircleTelButton>
          )}

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default KYCApprovedEmail;
