/**
 * Quote Approved Email Template
 * Sent when quote is approved and ready for customer acceptance
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

interface QuoteApprovedEmailProps {
  customerName: string;
  companyName: string;
  quoteNumber: string;
  acceptanceUrl: string;
  quoteAmount: string;
  validUntil: string;
  packageName?: string;
  monthlyAmount?: string;
  installationAmount?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
}

export const QuoteApprovedEmail: React.FC<QuoteApprovedEmailProps> = ({
  customerName = 'John Doe',
  companyName = 'ABC Technologies',
  quoteNumber = 'QT-2025-001',
  acceptanceUrl = 'https://www.circletel.co.za/quotes/accept/123',
  quoteAmount = 'R 15,000.00',
  validUntil = '30 November 2025',
  packageName = '100Mbps Fibre Business',
  monthlyAmount = 'R 1,299.00',
  installationAmount = 'R 0.00',
  agentName = 'Sarah Williams',
  agentEmail = 'sarah@circletel.co.za',
  agentPhone = '+27 12 345 6789',
}) => {
  const quoteDetails: ServiceDetail[] = [
    { label: 'Quote Number', value: quoteNumber, icon: '📄' },
    { label: 'Total Amount', value: quoteAmount, icon: '💰' },
    { label: 'Valid Until', value: validUntil, icon: '📅' },
  ];

  if (packageName) {
    quoteDetails.push({ label: 'Package', value: packageName, icon: '📦' });
  }

  const pricingDetails: ServiceDetail[] = [];
  if (monthlyAmount) {
    pricingDetails.push({ label: 'Monthly Fee', value: monthlyAmount, icon: '💳' });
  }
  if (installationAmount) {
    pricingDetails.push({ label: 'Installation Fee', value: installationAmount, icon: '🔧' });
  }

  const contactDetails: ServiceDetail[] = [];
  if (agentName) {
    contactDetails.push({ label: 'Your Account Manager', value: agentName, icon: '👤' });
  }
  if (agentEmail) {
    contactDetails.push({ label: 'Email', value: agentEmail, icon: '📧' });
  }
  if (agentPhone) {
    contactDetails.push({ label: 'Phone', value: agentPhone, icon: '📞' });
  }

  return (
    <Html>
      <Head />
      <Preview>
        Your quote {quoteNumber} has been approved - Accept now to proceed
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Quote Approved! 🎉"
            subtitle={`Great news ${customerName}! Your quote for ${companyName} has been approved.`}
            icon="✅"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            We're excited to bring enterprise-grade connectivity to your business.
            Your customized quote is ready for your acceptance.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={quoteDetails} columns={2} />

          {pricingDetails.length > 0 && (
            <>
              <CircleTelTextBlock align="left">
                <strong>Pricing Breakdown:</strong>
              </CircleTelTextBlock>
              <CircleTelServiceDetails details={pricingDetails} columns={2} />
            </>
          )}

          <CircleTelButton href={acceptanceUrl} variant="primary" align="center">
            Accept Quote
          </CircleTelButton>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>What happens next?</strong>
            <br />
            1. Review the quote details
            <br />
            2. Click "Accept Quote" to proceed
            <br />
            3. Complete the KYC verification process
            <br />
            4. Sign the service contract digitally
            <br />
            5. Make payment to activate your service
            <br />
            6. Schedule your installation
            <br />
            <br />
            ⚠️ <strong>Important:</strong> This quote is valid until <strong>{validUntil}</strong>.
            Please accept before this date to secure your pricing.
          </CircleTelTextBlock>

          {contactDetails.length > 0 && (
            <>
              <CircleTelTextBlock align="left">
                <strong>Your Dedicated Contact:</strong>
              </CircleTelTextBlock>
              <CircleTelServiceDetails details={contactDetails} columns={1} />
              <CircleTelTextBlock align="left" variant="small">
                Have questions? Your account manager is here to help you through every step of the process.
              </CircleTelTextBlock>
            </>
          )}

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default QuoteApprovedEmail;
