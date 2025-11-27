/**
 * Admin Access Approval Email Template
 *
 * Sent when an admin access request is approved
 * Professional table-based layout with CircleTel branding
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Preview,
  Container,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import {
  CircleTelHeader,
  CircleTelHero,
  CircleTelTextBlock,
  CircleTelButton,
  CircleTelFooter,
  emailStyles,
  brandColors,
} from '../../slices';

export interface AccessApprovalEmailProps {
  fullName: string;
  email: string;
  role: string;
  roleName?: string;
  tempPassword: string;
  loginUrl?: string;
  notes?: string;
}

export const AccessApprovalEmail: React.FC<AccessApprovalEmailProps> = ({
  fullName = 'Jeffrey De Wee',
  email = 'admin@circletel.co.za',
  role = 'super_admin',
  roleName,
  tempPassword = 'TempPass123!',
  loginUrl = 'https://www.circletel.co.za/admin/login',
  notes,
}) => {
  const displayRole = roleName || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Note: For security, we only show partial password hint, not the full password
  // This helps avoid spam filters that flag emails containing credentials
  const maskedPassword = tempPassword.length > 4 
    ? tempPassword.substring(0, 2) + '****' + tempPassword.substring(tempPassword.length - 2)
    : '****';

  const credentialItems = [
    { label: 'Email', value: email },
    { label: 'Temporary Access Code', value: maskedPassword + ' (check your secure channel)' },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        Access Approved for {fullName} - CircleTel Admin System.
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <CircleTelHeader />

          {/* Hero Section */}
          <CircleTelHero
            title="Welcome to the CircleTel Team!"
            subtitle={`Hi ${fullName}, your team access request has been approved.`}
            icon="✓"
            variant="gradient"
          />

          {/* Role Assignment */}
          <Section style={emailStyles.section}>
            <div
              style={{
                backgroundColor: '#F8F9FA',
                borderLeft: `4px solid ${brandColors.primary}`,
                padding: '15px',
                margin: '20px 0',
              }}
            >
              <Text style={{ margin: '0', fontSize: '14px', color: brandColors.darkNeutral }}>
                <strong>Role Assigned:</strong> {displayRole}
              </Text>
            </div>
          </Section>

          {/* Login Information Section */}
          <Section style={emailStyles.section}>
            <Text style={{ ...emailStyles.paragraph, fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
              Getting Started
            </Text>
            <div
              style={{
                backgroundColor: '#F8F9FA',
                border: '1px solid #E9ECEF',
                borderRadius: '8px',
                padding: '16px',
                margin: '12px 0',
              }}
            >
              <Text style={{ margin: '0 0 8px 0', fontSize: '14px', color: brandColors.darkNeutral }}>
                <strong>Your login email:</strong> {email}
              </Text>
              <Text style={{ margin: '0', fontSize: '13px', color: brandColors.secondaryNeutral }}>
                Your temporary access details have been sent via a separate secure channel. 
                Please check your SMS or contact your administrator if you haven't received them.
              </Text>
            </div>
          </Section>

          {/* Security Notice */}
          <Section style={emailStyles.section}>
            <div
              style={{
                backgroundColor: '#E8F4FD',
                borderLeft: '4px solid #0D6EFD',
                padding: '12px',
                margin: '20px 0',
              }}
            >
              <Text style={{ margin: '0', fontSize: '13px', color: '#0A58CA' }}>
                <strong>Security Notice:</strong> For your protection, please update your access credentials after your first login.
              </Text>
            </div>
          </Section>

          {/* CTA Button */}
          <CircleTelButton href={loginUrl} variant="primary" align="center">
            Login to Admin Panel
          </CircleTelButton>

          {/* Next Steps */}
          <Section style={emailStyles.section}>
            <Text style={{ ...emailStyles.paragraph, fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              Next Steps
            </Text>
            <ol style={{ paddingLeft: '20px', fontSize: '14px', color: brandColors.secondaryNeutral, lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>Log in using the credentials above</li>
              <li style={{ marginBottom: '8px' }}>Change your password in Profile Settings</li>
              <li style={{ marginBottom: '8px' }}>Familiarize yourself with the admin dashboard</li>
              <li style={{ marginBottom: '8px' }}>Review the documentation for your role</li>
            </ol>
          </Section>

          {/* Additional Notes (if any) */}
          {notes && (
            <Section style={emailStyles.section}>
              <Hr style={emailStyles.divider} />
              <Text style={{ ...emailStyles.paragraph, fontSize: '14px' }}>
                <strong>Note from Admin:</strong>
                <br />
                {notes}
              </Text>
            </Section>
          )}

          {/* Support Info */}
          <CircleTelTextBlock align="center" variant="small">
            If you have any questions or need assistance, please contact your administrator or our support team.
          </CircleTelTextBlock>

          {/* Footer */}
          <CircleTelFooter showSocialLinks={false} />
        </Container>
      </Body>
    </Html>
  );
};

export default AccessApprovalEmail;
