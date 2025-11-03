/**
 * Contract Ready for Signature Email Template
 * Sent when contract PDF is generated and ready to sign via Zoho Sign
 * 
 * Triggers: Contract generation complete → Zoho Sign session created
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

interface ContractReadyEmailProps {
  customerName: string;
  contractNumber: string;
  zohoSignUrl: string;
  packageName: string;
  monthlyPrice: number;
  installationFee: number;
  expiresAt: string; // Signature link expiry
}

export default function ContractReadyEmail({
  customerName = 'John Doe',
  contractNumber = 'CT-2025-001',
  zohoSignUrl = 'https://sign.zoho.com/sign/xyz123',
  packageName = '100Mbps Fibre',
  monthlyPrice = 799.0,
  installationFee = 699.0,
  expiresAt = '2025-11-08',
}: ContractReadyEmailProps) {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-ZA', {
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

          {/* Main Heading */}
          <Section style={headingSection}>
            <Text style={icon}>📄</Text>
            <Text style={heading}>Your Contract is Ready!</Text>
            <Text style={subheading}>Please review and sign to proceed</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>Hi {customerName},</Text>
            
            <Text style={paragraph}>
              Your contract <strong>{contractNumber}</strong> has been prepared and is
              ready for your digital signature.
            </Text>

            {/* Contract Details */}
            <Section style={contractBox}>
              <Text style={boxTitle}>Contract Summary</Text>
              
              <Section style={detailRow}>
                <Text style={detailLabel}>Contract Number:</Text>
                <Text style={detailValue}>{contractNumber}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Service Package:</Text>
                <Text style={detailValue}>{packageName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Monthly Fee:</Text>
                <Text style={detailValue}>R {monthlyPrice.toFixed(2)}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Installation Fee:</Text>
                <Text style={detailValue}>R {installationFee.toFixed(2)}</Text>
              </Section>

              <Hr style={detailDivider} />

              <Section style={detailRow}>
                <Text style={totalLabel}>First Invoice Total:</Text>
                <Text style={totalValue}>
                  R {(monthlyPrice + installationFee).toFixed(2)}
                </Text>
              </Section>
            </Section>

            {/* Important Note */}
            <Section style={noteBox}>
              <Text style={noteIcon}>⏰</Text>
              <Text style={noteText}>
                <strong>Please sign by {expiryDate}</strong>
                <br />
                Your signature link will expire in 7 days. If you need more time,
                please contact our support team.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={zohoSignUrl}>
                Review & Sign Contract
              </Button>
            </Section>

            {/* How to Sign */}
            <Text style={sectionTitle}>How to sign your contract:</Text>
            <Section style={stepsList}>
              <Text style={step}>
                <span style={stepNumber}>1</span>
                <span style={stepText}>Click the "Review & Sign Contract" button above</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>2</span>
                <span style={stepText}>Review all contract terms carefully</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>3</span>
                <span style={stepText}>Sign digitally using Zoho Sign (secure & legally binding)</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>4</span>
                <span style={stepText}>You'll receive your signed copy immediately via email</span>
              </Text>
            </Section>

            {/* What's Next */}
            <Section style={nextStepsBox}>
              <Text style={nextStepsTitle}>After you sign:</Text>
              <Text style={nextStepItem}>✅ Invoice will be sent for payment</Text>
              <Text style={nextStepItem}>✅ Installation will be scheduled</Text>
              <Text style={nextStepItem}>✅ Service activation within 5-7 business days</Text>
            </Section>

            {/* Security Note */}
            <Section style={securityBox}>
              <Text style={securityIcon}>🔒</Text>
              <Text style={securityText}>
                <strong>Secure Digital Signature</strong>
                <br />
                Powered by Zoho Sign - Your signature is encrypted and legally binding
                in South Africa. Complies with ECTA (Electronic Communications and
                Transactions Act).
              </Text>
            </Section>
          </Section>

          {/* Divider */}
          <Hr style={divider} />

          {/* Support Section */}
          <Section style={footer}>
            <Text style={footerTitle}>Questions about your contract?</Text>
            <Text style={footerText}>
              📧 Email: <a href="mailto:contracts@circletel.co.za" style={link}>contracts@circletel.co.za</a>
            </Text>
            <Text style={footerText}>
              📞 Phone: <a href="tel:+27211234567" style={link}>+27 21 123 4567</a>
            </Text>
            <Text style={footerText}>
              💬 Live Chat: <a href="https://circletel.co.za/support" style={link}>circletel.co.za/support</a>
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
  backgroundColor: '#ffffff',
  borderBottom: '3px solid #F5831F',
};

const logo = {
  margin: '0 auto',
};

const headingSection = {
  textAlign: 'center' as const,
  padding: '30px 20px 20px',
};

const icon = {
  fontSize: '64px',
  margin: '0',
  lineHeight: '1',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1F2937',
  margin: '10px 0 0 0',
};

const subheading = {
  fontSize: '16px',
  color: '#6B7280',
  margin: '8px 0 0 0',
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

const contractBox = {
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

const detailDivider = {
  borderColor: '#CDD6F4',
  margin: '16px 0',
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0',
};

const totalValue = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#F5831F',
  margin: '0',
};

const noteBox = {
  backgroundColor: '#FEF3C7',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
  border: '1px solid #FCD34D',
  display: 'flex',
  alignItems: 'flex-start',
};

const noteIcon = {
  fontSize: '24px',
  marginRight: '12px',
  flexShrink: '0',
};

const noteText = {
  fontSize: '14px',
  color: '#78350F',
  margin: '0',
  lineHeight: '20px',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '32px 0 16px 0',
};

const stepsList = {
  margin: '16px 0',
};

const step = {
  fontSize: '15px',
  color: '#4B5563',
  margin: '12px 0',
  display: 'flex',
  alignItems: 'flex-start',
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
  flexShrink: '0',
};

const stepText = {
  flex: '1',
  paddingTop: '4px',
};

const nextStepsBox = {
  backgroundColor: '#ECFDF5',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
  border: '1px solid #A7F3D0',
};

const nextStepsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#065F46',
  margin: '0 0 12px 0',
};

const nextStepItem = {
  fontSize: '14px',
  color: '#047857',
  margin: '8px 0',
  lineHeight: '20px',
};

const securityBox = {
  backgroundColor: '#F3F4F6',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
  display: 'flex',
  alignItems: 'flex-start',
};

const securityIcon = {
  fontSize: '24px',
  marginRight: '12px',
  flexShrink: '0',
};

const securityText = {
  fontSize: '13px',
  color: '#374151',
  margin: '0',
  lineHeight: '18px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#F5831F',
  color: '#ffffff',
  padding: '16px 40px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '18px',
  display: 'inline-block',
  boxShadow: '0 4px 6px rgba(245, 131, 31, 0.3)',
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
  lineHeight: '18px',
};
