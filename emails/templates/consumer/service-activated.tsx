/**
 * Service Activated Email Template
 * Sent when service is activated with login credentials
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

interface ServiceActivatedEmailProps {
  customerName: string;
  packageName: string;
  packageSpeed: string;
  username: string;
  password: string;
  accountNumber: string;
  loginUrl?: string;
  dashboardUrl?: string;
}

export const ServiceActivatedEmail: React.FC<ServiceActivatedEmailProps> = ({
  customerName = 'John Doe',
  packageName = 'Fibre 100Mbps Uncapped',
  packageSpeed = '100Mbps Down / 50Mbps Up',
  username = 'johndoe@circletel.co.za',
  password = 'TempPass123!',
  accountNumber = 'CT-2025-00001',
  loginUrl = 'https://www.circletel.co.za/login',
  dashboardUrl = 'https://www.circletel.co.za/dashboard',
}) => {
  const serviceDetails: ServiceDetail[] = [
    { label: 'Package', value: packageName, icon: '📦' },
    { label: 'Speed', value: packageSpeed, icon: '⚡' },
    { label: 'Account Number', value: accountNumber, icon: '🔢' },
  ];

  const loginDetails: ServiceDetail[] = [
    { label: 'Username', value: username, icon: '👤' },
    { label: 'Temporary Password', value: password, icon: '🔐' },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        Welcome to CircleTel! Your service is now active. Login to get started.
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Welcome to CircleTel!"
            subtitle={`Congratulations ${customerName}, your service is now active!`}
            icon="🎉"
            variant="gradient"
          />

          <CircleTelTextBlock align="center">
            Your internet service has been successfully activated. You can now enjoy
            high-speed connectivity with CircleTel!
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={serviceDetails} columns={1} />

          <CircleTelTextBlock align="left">
            <strong>Your Login Credentials:</strong>
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={loginDetails} columns={1} />

          <CircleTelTextBlock align="left" variant="small">
            <strong>⚠️ Security Notice:</strong> Please change your password immediately after
            first login for security purposes.
          </CircleTelTextBlock>

          <CircleTelButton href={loginUrl || dashboardUrl} variant="primary" align="center">
            Login to Dashboard
          </CircleTelButton>

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Getting Started:</strong>
            <br />
            1. Login using the credentials above
            <br />
            2. Change your password
            <br />
            3. Explore your dashboard for usage stats
            <br />
            4. Download the CircleTel mobile app (optional)
            <br />
            <br />
            Need help? Our support team is available 24/7.
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default ServiceActivatedEmail;
