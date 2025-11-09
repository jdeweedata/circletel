/**
 * Installation Reminder Email Template
 * Sent 24 hours before installation
 */

import * as React from 'react';
import { Html, Head, Body, Preview, Container } from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelServiceDetails,
  CircleTelFooter,
  emailStyles,
  ServiceDetail,
} from '../../slices';

interface InstallationReminderEmailProps {
  customerName: string;
  installationDate: string;
  installationTime: string;
  installationAddress: string;
  technicianPhone?: string;
}

export const InstallationReminderEmail: React.FC<InstallationReminderEmailProps> = ({
  customerName = 'John Doe',
  installationDate = 'Tomorrow',
  installationTime = '09:00 - 12:00',
  installationAddress = '123 Main Street, Pretoria',
  technicianPhone = '+27 12 345 6789',
}) => {
  const installationDetails: ServiceDetail[] = [
    { label: 'Date', value: installationDate, icon: '📅' },
    { label: 'Time', value: installationTime, icon: '🕐' },
    { label: 'Address', value: installationAddress, icon: '📍' },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        Reminder: Your installation is scheduled for {installationDate} at {installationTime}
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Installation Reminder"
            subtitle={`Hi ${customerName}, your installation is coming up soon!`}
            icon="⏰"
            variant="light"
          />

          <CircleTelTextBlock align="center">
            This is a friendly reminder that your CircleTel installation is scheduled for{' '}
            <strong>{installationDate}</strong>.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={installationDetails} columns={1} />

          <CircleTelTextBlock align="left" variant="normal">
            <strong>Preparation checklist:</strong>
            <br />
            ✓ Ensure someone 18+ will be present
            <br />
            ✓ Clear access to installation area
            <br />
            ✓ Have your ID document ready
            <br />
            ✓ Notify security/complex if applicable
            <br />
            <br />
            Our technician will call you 30 minutes before arrival.
            {technicianPhone && (
              <>
                <br />
                Contact: <a href={`tel:${technicianPhone}`} style={{ color: '#F5831F' }}>{technicianPhone}</a>
              </>
            )}
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default InstallationReminderEmail;
