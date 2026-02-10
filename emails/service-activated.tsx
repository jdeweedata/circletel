/**
 * Service Activated Email Template
 * Sent when RICA is approved and service is fully activated
 *
 * Triggers: Service activation complete → Credentials generated
 *
 * @see emails/types.ts for context interfaces
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from '@react-email/components';
import {
  type ServiceActivatedEmailProps,
  formatDate,
  createDefaultCustomer,
  createDefaultOrder,
  createDefaultService,
  createDefaultPackage,
} from './types';

// Default props for email preview in development
const defaultProps: ServiceActivatedEmailProps = {
  customer: createDefaultCustomer(),
  order: createDefaultOrder(),
  service: createDefaultService(),
  package: createDefaultPackage(),
  installation: { date: '2025-11-01' },
  support: { portalUrl: 'https://circletel.co.za/customer/support' },
};

export default function ServiceActivatedEmail(props: Partial<ServiceActivatedEmailProps>) {
  // Merge with defaults for preview mode
  const {
    customer,
    order,
    service,
    package: pkg,
    installation,
    support,
  } = { ...defaultProps, ...props } as ServiceActivatedEmailProps;

  const formattedDate = installation.date ? formatDate(installation.date) : '';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={header}>
            <Img
              src="https://circletel.co.za/logo.png"
              width="150"
              height="50"
              alt="CircleTel"
              style={logo}
            />
          </Section>

          {/* Celebration Header */}
          <Section style={celebrationSection}>
            <Text style={celebrationIcon}>🎉</Text>
            <Text style={heading}>Welcome to CircleTel!</Text>
            <Text style={subheading}>Your service is now active</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>Hi {customer.name},</Text>
            
            <Text style={paragraph}>
              Congratulations! Your CircleTel internet service has been successfully
              activated and is ready to use.
            </Text>

            {/* Service Details */}
            <Section style={serviceBox}>
              <Text style={boxTitle}>Your Service Details</Text>
              
              <Section style={detailRow}>
                <Text style={detailLabel}>Order Number:</Text>
                <Text style={detailValue}>{order.number}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Account Number:</Text>
                <Text style={detailValue}>{service.accountNumber}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Package:</Text>
                <Text style={detailValue}>{pkg.name}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Speed:</Text>
                <Text style={detailValue}>{pkg.speed}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Activated:</Text>
                <Text style={detailValue}>{formattedDate}</Text>
              </Section>
            </Section>

            {/* Login Credentials */}
            <Section style={credentialsBox}>
              <Text style={credentialsTitle}>
                🔐 Your Login Credentials
              </Text>
              
              <Section style={credentialItem}>
                <Text style={credentialLabel}>Username:</Text>
                <Text style={credentialCode}>{service.username}</Text>
              </Section>

              <Section style={credentialItem}>
                <Text style={credentialLabel}>Temporary Password:</Text>
                <Text style={credentialCode}>{service.temporaryPassword}</Text>
              </Section>

              <Section style={warningBox}>
                <Text style={warningIcon}>⚠️</Text>
                <Text style={warningText}>
                  <strong>Important:</strong> Please change your password on first login
                  for security reasons. Your temporary password will expire in 7 days.
                </Text>
              </Section>
            </Section>

            {/* Getting Started */}
            <Text style={sectionTitle}>Getting Started:</Text>
            <Section style={stepsList}>
              <Text style={step}>
                <span style={stepNumber}>1</span>
                <span style={stepText}>
                  Connect your device to the internet
                  {/* <br /><small>(Router should be powered on and all lights green)</small> */}
                </span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>2</span>
                <span style={stepText}>
                  Log in to the customer portal using credentials above
                </span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>3</span>
                <span style={stepText}>
                  Change your temporary password to something secure
                </span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>4</span>
                <span style={stepText}>
                  Enjoy blazing-fast internet! 🚀
                </span>
              </Text>
            </Section>

            {/* CTA Buttons */}
            <Section style={buttonRow}>
              <Button style={primaryButton} href={support.portalUrl}>
                Access Customer Portal
              </Button>
              <Button style={secondaryButton} href="https://circletel.co.za/support">
                Support Center
              </Button>
            </Section>

            {/* Quick Tips */}
            <Section style={tipsBox}>
              <Text style={tipsTitle}>💡 Quick Tips</Text>
              <Text style={tipItem}>
                <strong>WiFi Name:</strong> Check the sticker on your router for your WiFi network name (SSID)
              </Text>
              <Text style={tipItem}>
                <strong>Speed Test:</strong> Visit{' '}
                <a href="https://speedtest.circletel.co.za" style={link}>speedtest.circletel.co.za</a>{' '}
                to check your connection speed
              </Text>
              <Text style={tipItem}>
                <strong>Billing:</strong> Your first invoice was already paid. Recurring billing starts next month.
              </Text>
              <Text style={tipItem}>
                <strong>Support:</strong> 24/7 technical support available via phone, email, or live chat
              </Text>
            </Section>

            {/* Troubleshooting */}
            <Section style={troubleshootingBox}>
              <Text style={troubleshootingTitle}>Having trouble connecting?</Text>
              <Text style={troubleshootingItem}>
                ✓ Check all router lights are green
              </Text>
              <Text style={troubleshootingItem}>
                ✓ Restart your router (power off, wait 30 seconds, power on)
              </Text>
              <Text style={troubleshootingItem}>
                ✓ Check cable connections are secure
              </Text>
              <Text style={troubleshootingItem}>
                ✓ Try connecting with an Ethernet cable to test
              </Text>
              <Text style={troubleshootingContact}>
                Still having issues?{' '}
                <a href="tel:+27824873900" style={link}>Call us: +27 82 487 3900</a>
              </Text>
            </Section>
          </Section>

          {/* Divider */}
          <Hr style={divider} />

          {/* Support Section */}
          <Section style={footer}>
            <Text style={footerTitle}>24/7 Support Available</Text>
            <Text style={footerText}>
              📧 <a href="mailto:support@circletel.co.za" style={link}>support@circletel.co.za</a>
            </Text>
            <Text style={footerText}>
              📞 <a href="tel:+27824873900" style={link}>+27 82 487 3900</a>
            </Text>
            <Text style={footerText}>
              💬 <a href={support.portalUrl} style={link}>Live Chat Support</a>
            </Text>
            <Text style={footerText}>
              📱 <a href="https://wa.me/27824873900" style={link}>WhatsApp: +27 82 487 3900</a>
            </Text>
          </Section>

          {/* Social Media */}
          <Section style={socialSection}>
            <Text style={socialTitle}>Stay Connected</Text>
            <Section style={socialLinks}>
              <a href="https://facebook.com/circletel" style={socialLink}>Facebook</a>
              <span style={socialDivider}>|</span>
              <a href="https://twitter.com/circletel" style={socialLink}>Twitter</a>
              <span style={socialDivider}>|</span>
              <a href="https://instagram.com/circletel" style={socialLink}>Instagram</a>
            </Section>
          </Section>

          {/* Legal Footer */}
          <Section style={legal}>
            <Text style={legalText}>
              Thank you for choosing CircleTel as your internet service provider.
            </Text>
            <Text style={legalText}>
              © {new Date().getFullYear()} CircleTel (Pty) Ltd. All rights reserved.
              <br />
              ECNS License: ECNS/001/2024
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginTop: '20px',
  marginBottom: '20px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const header = {
  padding: '20px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, #F5831F 0%, #e67516 100%)',
};

const logo = {
  margin: '0 auto',
  filter: 'brightness(0) invert(1)', // Make logo white
};

const celebrationSection = {
  textAlign: 'center' as const,
  padding: '40px 20px 20px',
  background: 'linear-gradient(180deg, #F5F9FF 0%, #ffffff 100%)',
};

const celebrationIcon = {
  fontSize: '72px',
  margin: '0',
  lineHeight: '1',
};

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1F2937',
  margin: '16px 0 0 0',
};

const subheading = {
  fontSize: '18px',
  color: '#10B981',
  margin: '8px 0 0 0',
  fontWeight: '600',
};

const content = {
  padding: '0 40px 40px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4B5563',
  margin: '16px 0',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '32px 0 16px 0',
};

const serviceBox = {
  backgroundColor: '#F5F9FF',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '2px solid #1E4B85',
};

const boxTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1E4B85',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '12px 0',
};

const detailLabel = {
  fontSize: '14px',
  color: '#6B7280',
  margin: '0',
};

const detailValue = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0',
};

const credentialsBox = {
  backgroundColor: '#FEF3E7',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '2px solid #F5831F',
};

const credentialsTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const credentialItem = {
  margin: '16px 0',
};

const credentialLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6B7280',
  margin: '0 0 6px 0',
};

const credentialCode = {
  display: 'block',
  backgroundColor: '#ffffff',
  padding: '12px 16px',
  borderRadius: '6px',
  fontSize: '16px',
  fontFamily: 'Consolas, Monaco, monospace',
  color: '#1F2937',
  border: '1px solid #D1D5DB',
  wordBreak: 'break-all' as const,
};

const warningBox = {
  backgroundColor: '#FEF2F2',
  padding: '12px',
  borderRadius: '6px',
  margin: '16px 0 0 0',
  display: 'flex',
  alignItems: 'flex-start',
  border: '1px solid #FECACA',
};

const warningIcon = {
  fontSize: '20px',
  marginRight: '10px',
  flexShrink: '0',
};

const warningText = {
  fontSize: '13px',
  color: '#7F1D1D',
  margin: '0',
  lineHeight: '18px',
};

const stepsList = {
  margin: '16px 0',
};

const step = {
  fontSize: '16px',
  color: '#4B5563',
  margin: '16px 0',
  display: 'flex',
  alignItems: 'flex-start',
};

const stepNumber = {
  display: 'inline-block',
  width: '32px',
  height: '32px',
  backgroundColor: '#10B981',
  color: '#ffffff',
  borderRadius: '50%',
  textAlign: 'center' as const,
  lineHeight: '32px',
  fontSize: '16px',
  fontWeight: 'bold',
  marginRight: '12px',
  flexShrink: '0',
};

const stepText = {
  flex: '1',
  paddingTop: '6px',
};

const buttonRow = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const primaryButton = {
  backgroundColor: '#F5831F',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
  margin: '8px',
  boxShadow: '0 4px 6px rgba(245, 131, 31, 0.3)',
};

const secondaryButton = {
  backgroundColor: '#1E4B85',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
  margin: '8px',
};

const tipsBox = {
  backgroundColor: '#ECFDF5',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
  border: '1px solid #A7F3D0',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#065F46',
  margin: '0 0 12px 0',
};

const tipItem = {
  fontSize: '14px',
  color: '#047857',
  margin: '10px 0',
  lineHeight: '20px',
};

const troubleshootingBox = {
  backgroundColor: '#F9FAFB',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
  border: '1px solid #E5E7EB',
};

const troubleshootingTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0 0 12px 0',
};

const troubleshootingItem = {
  fontSize: '14px',
  color: '#4B5563',
  margin: '8px 0',
};

const troubleshootingContact = {
  fontSize: '14px',
  color: '#4B5563',
  margin: '12px 0 0 0',
  fontWeight: '600',
};

const link = {
  color: '#F5831F',
  textDecoration: 'none',
};

const divider = {
  borderColor: '#E6E9EF',
  margin: '0',
};

const footer = {
  padding: '30px 40px 20px',
  textAlign: 'center' as const,
};

const footerTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0 0 16px 0',
};

const footerText = {
  fontSize: '14px',
  color: '#6B7280',
  margin: '8px 0',
};

const socialSection = {
  padding: '20px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#F9FAFB',
};

const socialTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6B7280',
  margin: '0 0 12px 0',
};

const socialLinks = {
  fontSize: '14px',
};

const socialLink = {
  color: '#F5831F',
  textDecoration: 'none',
  padding: '0 8px',
};

const socialDivider = {
  color: '#D1D5DB',
  padding: '0 4px',
};

const legal = {
  padding: '20px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#F9FAFB',
  borderTop: '1px solid #E6E9EF',
};

const legalText = {
  fontSize: '12px',
  color: '#9CA3AF',
  margin: '4px 0',
  lineHeight: '18px',
};
