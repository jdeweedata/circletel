/**
 * Password Reset Email Template
 * Custom template with personalized greeting using customer's first name
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

interface PasswordResetEmailProps {
  firstName: string;
  resetUrl: string;
  expiresIn?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  firstName = 'Customer',
  resetUrl = 'https://www.circletel.co.za/auth/reset-password',
  expiresIn = '1 hour',
}) => {
  return (
    <Html>
      <Head />
      <Preview>
        Reset your CircleTel password
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Reset Your Password"
            subtitle="Secure password reset request"
            icon="🔐"
            variant="gradient"
          />

          <CircleTelTextBlock align="left">
            <strong>Hello {firstName},</strong>
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left">
            You requested to reset your password for your CircleTel account. 
            Click the button below to create a new password:
          </CircleTelTextBlock>

          <CircleTelButton href={resetUrl} variant="primary" align="center">
            Reset Password
          </CircleTelButton>

          {/* Security Notice */}
          <div style={{
            backgroundColor: '#FEF3C7',
            padding: '15px 20px',
            borderRadius: '6px',
            borderLeft: '4px solid #F59E0B',
            margin: '20px 40px',
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#92400E' }}>
              ⏰ Link expires in {expiresIn}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400E', lineHeight: '1.5' }}>
              For security reasons, this password reset link will expire in {expiresIn}. 
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>

          <CircleTelTextBlock align="left" variant="small">
            If the button doesn't work, copy and paste this link into your browser:
            <br />
            <a href={resetUrl} style={{ color: '#F5831F', wordBreak: 'break-all' as const }}>
              {resetUrl}
            </a>
          </CircleTelTextBlock>

          <CircleTelTextBlock align="left">
            Thank you for being a valued CircleTel customer!
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;
