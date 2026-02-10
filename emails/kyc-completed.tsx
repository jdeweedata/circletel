/**
 * KYC Verification Complete Email Template
 * Sent when Didit KYC verification completes successfully
 * 
 * Triggers: Didit webhook → verification.completed event
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

interface KYCCompletedEmailProps {
  customerName: string;
  verificationDate: string;
  riskTier: 'low' | 'medium' | 'high';
  contractUrl: string;
  quoteNumber: string;
}

export default function KYCCompletedEmail({
  customerName = 'John Doe',
  verificationDate = '2025-11-01',
  riskTier = 'low',
  contractUrl = 'https://circletel.co.za/customer/contracts/123',
  quoteNumber = 'QT-2025-001',
}: KYCCompletedEmailProps) {
  const verificationDateFormatted = new Date(verificationDate).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

          {/* Success Icon */}
          <Section style={successSection}>
            <Text style={successIcon}>✅</Text>
            <Text style={heading}>Verification Complete!</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>Hi {customerName},</Text>
            
            <Text style={paragraph}>
              Great news! Your identity verification has been completed successfully.
              We're now preparing your contract for signature.
            </Text>

            {/* Verification Details */}
            <Section style={infoBox}>
              <Text style={infoLabel}>Quote Reference:</Text>
              <Text style={infoValue}>{quoteNumber}</Text>
              
              <Text style={infoLabel}>Verification Date:</Text>
              <Text style={infoValue}>{verificationDateFormatted}</Text>
              
              <Text style={infoLabel}>Status:</Text>
              <Text style={infoValue}>
                <span style={approvedBadge}>Approved</span>
              </Text>
            </Section>

            {/* What's Next */}
            <Text style={sectionTitle}>What happens next?</Text>
            <Section style={stepsList}>
              <Text style={step}>
                <span style={stepNumber}>1</span>
                <span style={stepText}>Contract generation (in progress)</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>2</span>
                <span style={stepText}>Digital signature via email (within 24 hours)</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>3</span>
                <span style={stepText}>Payment processing</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>4</span>
                <span style={stepText}>Installation scheduling</span>
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={contractUrl}>
                View Your Quote
              </Button>
            </Section>

            <Text style={helpText}>
              You'll receive another email once your contract is ready to sign,
              usually within 1 business day.
            </Text>
          </Section>

          {/* Divider */}
          <Hr style={divider} />

          {/* Support Section */}
          <Section style={footer}>
            <Text style={footerTitle}>Need help?</Text>
            <Text style={footerText}>
              📧 Email: <a href="mailto:support@circletel.co.za" style={link}>support@circletel.co.za</a>
            </Text>
            <Text style={footerText}>
              📞 Phone: <a href="tel:+27824873900" style={link}>+27 82 487 3900</a>
            </Text>
            <Text style={footerText}>
              🕐 Hours: Monday-Friday 8AM-6PM, Saturday 9AM-1PM
            </Text>
          </Section>

          {/* Legal Footer */}
          <Section style={legal}>
            <Text style={legalText}>
              This is an automated email from CircleTel (Pty) Ltd.
              Please do not reply to this email.
            </Text>
            <Text style={legalText}>
              © {new Date().getFullYear()} CircleTel (Pty) Ltd. All rights reserved.
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
  backgroundColor: '#ffffff',
  borderBottom: '3px solid #F5831F',
};

const logo = {
  margin: '0 auto',
};

const successSection = {
  textAlign: 'center' as const,
  padding: '30px 20px',
};

const successIcon = {
  fontSize: '64px',
  margin: '0',
  lineHeight: '1',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1F2937',
  margin: '10px 0 0 0',
  textAlign: 'center' as const,
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
  fontSize: '18px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '24px 0 12px 0',
};

const infoBox = {
  backgroundColor: '#F5F9FF',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  border: '1px solid #CDD6F4',
};

const infoLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6B7280',
  textTransform: 'uppercase' as const,
  margin: '8px 0 4px 0',
  letterSpacing: '0.5px',
};

const infoValue = {
  fontSize: '16px',
  color: '#1F2937',
  margin: '0 0 12px 0',
  fontWeight: '500',
};

const approvedBadge = {
  display: 'inline-block',
  backgroundColor: '#10B981',
  color: '#ffffff',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: '600',
};

const stepsList = {
  margin: '16px 0',
};

const step = {
  fontSize: '16px',
  color: '#4B5563',
  margin: '12px 0',
  display: 'flex',
  alignItems: 'center',
};

const stepNumber = {
  display: 'inline-block',
  width: '28px',
  height: '28px',
  backgroundColor: '#F5831F',
  color: '#ffffff',
  borderRadius: '50%',
  textAlign: 'center' as const,
  lineHeight: '28px',
  fontSize: '14px',
  fontWeight: 'bold',
  marginRight: '12px',
};

const stepText = {
  flex: '1',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#F5831F',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
};

const helpText = {
  fontSize: '14px',
  color: '#6B7280',
  textAlign: 'center' as const,
  margin: '24px 0 0 0',
  fontStyle: 'italic',
};

const divider = {
  borderColor: '#E6E9EF',
  margin: '0',
};

const footer = {
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const footerTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0 0 12px 0',
};

const footerText = {
  fontSize: '14px',
  color: '#6B7280',
  margin: '8px 0',
};

const link = {
  color: '#F5831F',
  textDecoration: 'none',
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
};
