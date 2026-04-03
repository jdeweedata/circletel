/**
 * Email Verification Template
 * Sent when Supabase's built-in mailer fails and we fall back to Resend.
 * Personalized greeting using customer's first name.
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

interface EmailVerificationProps {
  firstName: string;
  verifyUrl: string;
  expiresIn?: string;
}

export const EmailVerificationEmail: React.FC<EmailVerificationProps> = ({
  firstName = 'Customer',
  verifyUrl = 'https://www.circletel.co.za/auth/confirm',
  expiresIn = '10 minutes',
}) => {
  return (
    <Html>
      <Head />
      <Preview>
        Verify your email address — CircleTel
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Verify Your Email"
            subtitle="One click to activate your account"
            variant="light"
          />

          <CircleTelTextBlock align="left">
            <strong>Hello {firstName},</strong>
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left">
            Thank you for signing up with CircleTel! Please verify your email
            address by clicking the button below:
          </CircleTelTextBlock>

          <CircleTelButton href={verifyUrl} variant="primary" align="center">
            Verify Email Address
          </CircleTelButton>

          {/* Expiry Notice */}
          <div style={{
            backgroundColor: '#FEF3C7',
            padding: '15px 20px',
            borderRadius: '6px',
            borderLeft: '4px solid #F59E0B',
            margin: '20px 40px',
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#92400E' }}>
              Link expires in {expiresIn}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400E', lineHeight: '1.5' }}>
              For security reasons, this verification link will expire in {expiresIn}.
              If it expires, you can request a new one from your account page.
            </p>
          </div>

          <CircleTelTextBlock align="left" variant="small">
            If the button doesn&apos;t work, copy and paste this link into your browser:
            <br />
            <a href={verifyUrl} style={{ color: '#F5831F', wordBreak: 'break-all' as const }}>
              {verifyUrl}
            </a>
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left">
            Welcome to CircleTel — we&apos;re excited to have you!
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default EmailVerificationEmail;
