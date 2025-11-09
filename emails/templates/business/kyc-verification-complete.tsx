/**
 * KYC Verification Complete Email Template
 * Sent when KYC verification is completed successfully
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

interface KYCVerificationCompleteEmailProps {
  customerName: string;
  companyName: string;
  verificationDate: string;
  riskTier?: 'low' | 'medium' | 'high';
  contractUrl?: string;
  documentsVerified?: string[];
  accountNumber?: string;
}

export const KYCVerificationCompleteEmail: React.FC<KYCVerificationCompleteEmailProps> = ({
  customerName = 'John Doe',
  companyName = 'ABC Technologies',
  verificationDate = '8 November 2025',
  riskTier = 'low',
  contractUrl = 'https://www.circletel.co.za/contracts/sign/123',
  documentsVerified = ['Identity Document', 'Company Registration', 'Proof of Address'],
  accountNumber = 'CT-2025-00123',
}) => {
  const verificationDetails: ServiceDetail[] = [
    { label: 'Verification Date', value: verificationDate, icon: '📅' },
    { label: 'Risk Assessment', value: riskTier === 'low' ? '✅ Low Risk' : riskTier === 'medium' ? '⚠️ Medium Risk' : '🔴 High Risk', icon: '🛡️' },
    { label: 'Status', value: 'Approved', icon: '✅' },
  ];

  if (accountNumber) {
    verificationDetails.push({ label: 'Account Number', value: accountNumber, icon: '🔢' });
  }

  const riskTierColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444'
  };

  const riskTierColor = riskTierColors[riskTier];

  return (
    <Html>
      <Head />
      <Preview>
        KYC Verification Complete - Your CircleTel account is verified
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="KYC Verified! ✅"
            subtitle={`Great news ${customerName}! Your identity verification for ${companyName} is complete.`}
            icon="🛡️"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            Your KYC (Know Your Customer) verification has been successfully completed.
            You can now proceed with contract signing and service activation.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={verificationDetails} columns={2} />

          {documentsVerified && documentsVerified.length > 0 && (
            <>
              <CircleTelTextBlock align="left">
                <strong>Documents Verified:</strong>
              </CircleTelTextBlock>
              <CircleTelTextBlock align="left" variant="normal">
                {documentsVerified.map((doc, index) => (
                  <React.Fragment key={index}>
                    ✅ {doc}
                    <br />
                  </React.Fragment>
                ))}
              </CircleTelTextBlock>
            </>
          )}

          <CircleTelTextBlock align="center" variant="highlight">
            <div style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: riskTierColor,
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              Risk Assessment: {riskTier.toUpperCase()}
            </div>
          </CircleTelTextBlock>

          {contractUrl && (
            <>
              <CircleTelTextBlock align="center">
                <strong>Ready for Next Step</strong>
                <br />
                Your verification is complete. Please proceed to sign your service contract.
              </CircleTelTextBlock>

              <CircleTelButton href={contractUrl} variant="primary" align="center">
                Sign Contract
              </CircleTelButton>
            </>
          )}

          <CircleTelTextBlock align="left" variant="normal">
            <strong>What This Means:</strong>
            <br />
            ✅ Your identity has been verified through Didit AI
            <br />
            ✅ All required documents have been validated
            <br />
            ✅ Your account meets FICA compliance requirements
            <br />
            ✅ You can now proceed with service activation
            <br />
            <br />
            🔒 <strong>Security Note:</strong> All your personal information is encrypted and stored securely in compliance with POPIA (Protection of Personal Information Act).
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Next Steps:</strong>
            <br />
            1. Review and sign your service contract
            <br />
            2. Make payment to activate your service
            <br />
            3. Schedule your installation
            <br />
            4. Complete RICA registration (if required)
            <br />
            5. Start enjoying your CircleTel connectivity
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left" variant="small">
            <strong>Questions about KYC?</strong>
            <br />
            KYC (Know Your Customer) is a regulatory requirement to verify customer identity
            and prevent fraud. It's required by South African law (FICA) for all telecom services.
            <br /><br />
            For questions: compliance@circletel.co.za
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default KYCVerificationCompleteEmail;
