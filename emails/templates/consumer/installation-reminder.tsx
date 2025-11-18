import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { CircleTelHeader } from '@/emails/slices/CircleTelHeader';
import { CircleTelFooter } from '@/emails/slices/CircleTelFooter';
import { CircleTelHero } from '@/emails/slices/CircleTelHero';
import { CircleTelTextBlock } from '@/emails/slices/CircleTelTextBlock';
import { CircleTelButton } from '@/emails/slices/CircleTelButton';
import { CircleTelInfoBox } from '@/emails/slices/CircleTelInfoBox';

interface InstallationReminderEmailProps {
  customerName: string;
  orderNumber: string;
  installationDate: string;
  installationTime: string;
  technicianName?: string;
  technicianPhone?: string;
  installationAddress: string;
  packageName: string;
}

export const InstallationReminderEmail: React.FC<InstallationReminderEmailProps> = ({
  customerName = 'Valued Customer',
  orderNumber = 'ORD-XXXXXX',
  installationDate = 'Monday, January 15, 2025',
  installationTime = '8:00 AM - 12:00 PM',
  technicianName = 'Our technician',
  technicianPhone = 'TBD',
  installationAddress = '123 Main Street',
  packageName = 'Fibre Internet',
}) => {
  const previewText = `Installation Reminder: ${installationDate} - ${orderNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <CircleTelHeader />

          <CircleTelHero
            title="Installation Reminder"
            subtitle="Your CircleTel installation is scheduled"
            icon="🔧"
          />

          <CircleTelTextBlock>
            Hi {customerName},
          </CircleTelTextBlock>

          <CircleTelTextBlock>
            This is a friendly reminder that your CircleTel fibre installation is scheduled for:
          </CircleTelTextBlock>

          <CircleTelInfoBox
            items={[
              { label: 'Date', value: installationDate },
              { label: 'Time', value: installationTime },
              { label: 'Address', value: installationAddress },
              { label: 'Package', value: packageName },
              { label: 'Order Number', value: orderNumber },
            ]}
          />

          {technicianName && technicianName !== 'TBD' && (
            <>
              <CircleTelTextBlock>
                <strong>Your Technician:</strong>
              </CircleTelTextBlock>
              <CircleTelInfoBox
                items={[
                  { label: 'Name', value: technicianName },
                  ...(technicianPhone && technicianPhone !== 'TBD'
                    ? [{ label: 'Phone', value: technicianPhone }]
                    : []),
                ]}
              />
            </>
          )}

          <Section style={sectionWithBg}>
            <Text style={heading}>Important Reminders:</Text>
            <ul style={list}>
              <li style={listItem}>
                <strong>Someone 18+ must be present</strong> during the installation
              </li>
              <li style={listItem}>
                Installation typically takes <strong>2-3 hours</strong>
              </li>
              <li style={listItem}>
                Please ensure clear access to the installation area
              </li>
              <li style={listItem}>
                If you need to reschedule, please contact us <strong>at least 24 hours</strong> in
                advance
              </li>
              <li style={listItem}>
                Have your <strong>ID document</strong> ready for verification
              </li>
            </ul>
          </Section>

          <Section style={sectionWithBg}>
            <Text style={heading}>What to Expect:</Text>
            <ul style={list}>
              <li style={listItem}>Our technician will call you upon arrival</li>
              <li style={listItem}>They will install the fibre ONT (Optical Network Terminal)</li>
              <li style={listItem}>Router setup and WiFi configuration</li>
              <li style={listItem}>Speed test to ensure optimal performance</li>
              <li style={listItem}>Brief demonstration of your new service</li>
            </ul>
          </Section>

          <CircleTelTextBlock>
            If you have any questions or need to reschedule, please don't hesitate to contact us.
          </CircleTelTextBlock>

          <CircleTelButton href="tel:+27878019000" variant="primary">
            Call Us: 087 801 9000
          </CircleTelButton>

          <CircleTelTextBlock>
            We're excited to get you connected!
          </CircleTelTextBlock>

          <Hr style={hr} />

          <CircleTelFooter />
        </Container>
      </Body>
    </Html>
  );
};

export default InstallationReminderEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const sectionWithBg = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const heading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0 0 16px 0',
};

const list = {
  margin: '0',
  padding: '0 0 0 20px',
  listStyleType: 'disc',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#4B5563',
  margin: '8px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};
