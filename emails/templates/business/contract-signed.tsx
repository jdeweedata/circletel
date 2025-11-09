/**
 * Contract Signed Email Template
 * Sent when contract is digitally signed by all parties
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

interface ContractSignedEmailProps {
  customerName: string;
  companyName: string;
  contractNumber: string;
  contractUrl: string;
  signedDate: string;
  contractTerm: string;
  monthlyAmount: string;
  startDate?: string;
  packageName?: string;
  accountNumber?: string;
}

export const ContractSignedEmail: React.FC<ContractSignedEmailProps> = ({
  customerName = 'John Doe',
  companyName = 'ABC Technologies',
  contractNumber = 'CT-2025-001',
  contractUrl = 'https://www.circletel.co.za/contracts/123',
  signedDate = '8 November 2025',
  contractTerm = '24 months',
  monthlyAmount = 'R 1,299.00',
  startDate = '15 November 2025',
  packageName = '100Mbps Fibre Business',
  accountNumber = 'CT-2025-00123',
}) => {
  const contractDetails: ServiceDetail[] = [
    { label: 'Contract Number', value: contractNumber, icon: '📄' },
    { label: 'Signed Date', value: signedDate, icon: '✍️' },
    { label: 'Contract Term', value: contractTerm, icon: '📅' },
    { label: 'Monthly Amount', value: monthlyAmount, icon: '💰' },
  ];

  if (startDate) {
    contractDetails.push({ label: 'Service Start Date', value: startDate, icon: '🚀' });
  }

  const serviceDetails: ServiceDetail[] = [];
  if (packageName) {
    serviceDetails.push({ label: 'Package', value: packageName, icon: '📦' });
  }
  if (accountNumber) {
    serviceDetails.push({ label: 'Account Number', value: accountNumber, icon: '🔢' });
  }

  return (
    <Html>
      <Head />
      <Preview>
        Contract {contractNumber} signed successfully - Welcome to CircleTel
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Contract Signed! 🎉"
            subtitle={`Welcome to CircleTel, ${customerName}! Your contract for ${companyName} has been signed.`}
            icon="✅"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            Congratulations! All parties have successfully signed the service agreement.
            You're now officially a CircleTel customer.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={contractDetails} columns={2} />

          {serviceDetails.length > 0 && (
            <>
              <CircleTelTextBlock align="left">
                <strong>Service Details:</strong>
              </CircleTelTextBlock>
              <CircleTelServiceDetails details={serviceDetails} columns={2} />
            </>
          )}

          <CircleTelButton href={contractUrl} variant="primary" align="center">
            Download Contract
          </CircleTelButton>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>What Happens Next?</strong>
            <br />
            ✅ <strong>Step 1:</strong> Contract signed (Complete)
            <br />
            📋 <strong>Step 2:</strong> Invoice generation (In Progress)
            <br />
            💳 <strong>Step 3:</strong> Payment processing (Pending)
            <br />
            🔧 <strong>Step 4:</strong> Installation scheduling (Pending)
            <br />
            🚀 <strong>Step 5:</strong> Service activation (Pending)
            <br />
            <br />
            You'll receive email updates as we progress through each step.
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Important Information:</strong>
            <br />
            • Your contract is legally binding and active
            <br />
            • Keep a copy of the signed contract for your records
            <br />
            • Service activation requires payment confirmation
            <br />
            • Installation will be scheduled after payment
            <br />
            • Contract term: {contractTerm} from activation date
            <br />
            <br />
            📞 <strong>Need Help?</strong>
            <br />
            Contact our support team at support@circletel.co.za or call us at +27 12 345 6789
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="highlight">
            <strong>📱 Download Our App</strong>
            <br />
            Track your installation, view invoices, and manage your service from our mobile app.
            Available on iOS and Android.
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default ContractSignedEmail;
