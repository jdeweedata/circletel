/**
 * Quote Sent Email Template
 * Sent when business quote is generated and sent to customer
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

interface QuoteSentEmailProps {
  customerName: string;
  companyName: string;
  quoteNumber: string;
  quoteUrl: string;
  quoteAmount: string;
  validUntil: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
}

export const QuoteSentEmail: React.FC<QuoteSentEmailProps> = ({
  customerName = 'John Doe',
  companyName = 'ABC Technologies',
  quoteNumber = 'QT-2025-001',
  quoteUrl = 'https://www.circletel.co.za/quotes/123',
  quoteAmount = 'R 15,000.00',
  validUntil = '30 November 2025',
  agentName = 'Sarah Williams',
  agentEmail = 'sarah@circletel.co.za',
  agentPhone = '+27 12 345 6789',
}) => {
  const quoteDetails: ServiceDetail[] = [
    { label: 'Quote Number', value: quoteNumber, icon: '📄' },
    { label: 'Total Amount', value: quoteAmount, icon: '💰' },
    { label: 'Valid Until', value: validUntil, icon: '📅' },
    { label: 'Company', value: companyName, icon: '🏢' },
  ];

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
        Your CircleTel quote {quoteNumber} is ready for review - {quoteAmount}
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Your Quote is Ready"
            subtitle={`Hi ${customerName}, we've prepared a customized quote for ${companyName}.`}
            icon="📄"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            Thank you for your interest in CircleTel's business connectivity solutions.
            We've prepared a detailed quote tailored to your requirements.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={quoteDetails} columns={2} />

          <CircleTelButton href={quoteUrl} variant="primary" align="center">
            View Quote
          </CircleTelButton>

          {contactDetails.length > 0 && (
            <>
              <CircleTelTextBlock align="left">
                <strong>Your Dedicated Contact:</strong>
              </CircleTelTextBlock>
              <CircleTelServiceDetails details={contactDetails} columns={1} />
            </>
          )}

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Next Steps:</strong>
            <br />
            1. Review the quote details online
            <br />
            2. Contact us if you have any questions
            <br />
            3. Accept the quote to proceed
            <br />
            4. We'll schedule your installation
            <br />
            <br />
            Please note: This quote is valid until <strong>{validUntil}</strong>
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default QuoteSentEmail;
