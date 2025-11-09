/**
 * Installation Scheduled Email Template
 * Sent when installation appointment is confirmed
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

interface InstallationScheduledEmailProps {
  customerName: string;
  installationDate: string;
  installationTime: string;
  installationAddress: string;
  technicianName?: string;
  technicianPhone?: string;
  packageName: string;
}

export const InstallationScheduledEmail: React.FC<InstallationScheduledEmailProps> = ({
  customerName = 'John Doe',
  installationDate = '15 November 2025',
  installationTime = '09:00 - 12:00',
  installationAddress = '123 Main Street, Pretoria',
  technicianName = 'Mike Johnson',
  technicianPhone = '+27 12 345 6789',
  packageName = 'Fibre 100Mbps Uncapped',
}) => {
  const installationDetails: ServiceDetail[] = [
    { label: 'Date', value: installationDate, icon: '📅' },
    { label: 'Time Slot', value: installationTime, icon: '🕐' },
    { label: 'Address', value: installationAddress, icon: '📍' },
    { label: 'Package', value: packageName, icon: '📦' },
  ];

  if (technicianName) {
    installationDetails.push({
      label: 'Technician',
      value: `${technicianName}${technicianPhone ? ` (${technicianPhone})` : ''}`,
      icon: '👷',
    });
  }

  return (
    <Html>
      <Head />
      <Preview>
        Your installation is scheduled for {installationDate} at {installationTime}
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Installation Scheduled!"
            subtitle={`Hi ${customerName}, your installation has been confirmed.`}
            icon="📅"
            variant="gradient"
          />

          <CircleTelTextBlock align="left">
            <strong>Great news!</strong> We've scheduled your installation and our technician
            will arrive at your address during the specified time slot.
          </CircleTelTextBlock>

          <CircleTelServiceDetails details={installationDetails} columns={1} />

          <CircleTelTextBlock align="left" variant="normal">
            <strong>What to expect:</strong>
            <br />
            • Our technician will arrive during the scheduled time slot
            <br />
            • Installation typically takes 2-4 hours
            <br />
            • Please ensure someone 18+ is present at the address
            <br />
            • We'll test your connection before we leave
            <br />
            <br />
            <strong>Need to reschedule?</strong> Contact us at least 24 hours in advance.
          </CircleTelTextBlock>

          <CircleTelFooter showSocialLinks={true} />
        </Container>
      </Body>
    </Html>
  );
};

export default InstallationScheduledEmail;
