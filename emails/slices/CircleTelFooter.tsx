/**
 * CircleTel Email Footer Component
 *
 * Standard footer with contact info, legal disclaimers, and links
 */

import * as React from 'react';
import { Section, Text, Link, Hr } from '@react-email/components';
import { emailStyles, brandColors } from '../utils/styles';

interface CircleTelFooterProps {
  showSocialLinks?: boolean;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
  emailType?: 'transactional' | 'marketing';
}

export const CircleTelFooter: React.FC<CircleTelFooterProps> = ({
  showSocialLinks = true,
  showUnsubscribe = true, // Default to true for better deliverability
  unsubscribeUrl = 'https://www.circletel.co.za/unsubscribe',
  emailType = 'transactional',
}) => {
  return (
    <Section style={emailStyles.footer}>
      {/* Company Info */}
      <Text style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
        <strong>CircleTel (Pty) Ltd</strong>
        <br />
        Leading telecommunications provider in South Africa
      </Text>

      {/* Contact Info */}
      <Text style={{ margin: '0 0 12px 0', fontSize: '12px', lineHeight: '1.6' }}>
        Email:{' '}
        <Link
          href="mailto:contactus@circletel.co.za"
          style={emailStyles.footerLink}
        >
          contactus@circletel.co.za
        </Link>
        <br />
        Phone:{' '}
        <Link href="tel:+27870876305" style={emailStyles.footerLink}>
          087 087 6305
        </Link>
        <br />
        Website:{' '}
        <Link href="https://www.circletel.co.za" style={emailStyles.footerLink}>
          www.circletel.co.za
        </Link>
      </Text>

      {/* Social Links */}
      {showSocialLinks && (
        <>
          <Hr
            style={{
              ...emailStyles.divider,
              backgroundColor: brandColors.secondaryNeutral,
              margin: '16px 0',
            }}
          />
          <Text style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
            Follow us on social media:
          </Text>
          <div style={{ margin: '8px 0' }}>
            <Link
              href="https://facebook.com/circletel"
              style={{
                ...emailStyles.footerLink,
                marginRight: '12px',
                textDecoration: 'none',
              }}
            >
              Facebook
            </Link>
            <Link
              href="https://twitter.com/circletel"
              style={{
                ...emailStyles.footerLink,
                marginRight: '12px',
                textDecoration: 'none',
              }}
            >
              Twitter
            </Link>
            <Link
              href="https://instagram.com/circletel"
              style={{
                ...emailStyles.footerLink,
                marginRight: '12px',
                textDecoration: 'none',
              }}
            >
              Instagram
            </Link>
            <Link
              href="https://linkedin.com/company/circletel"
              style={{
                ...emailStyles.footerLink,
                textDecoration: 'none',
              }}
            >
              LinkedIn
            </Link>
          </div>
        </>
      )}

      {/* Legal & Licensing */}
      <Hr
        style={{
          ...emailStyles.divider,
          backgroundColor: brandColors.secondaryNeutral,
          margin: '16px 0',
        }}
      />
      <Text style={{ margin: '0 0 8px 0', fontSize: '11px', lineHeight: '1.5' }}>
        CircleTel is a licensed Electronic Communications Network Service (ECNS)
        provider registered with ICASA.
        <br />
        ECNS License Number: 12345 | POPIA Compliant
      </Text>

      {/* Privacy & Terms */}
      <Text style={{ margin: '0 0 8px 0', fontSize: '11px' }}>
        <Link
          href="https://www.circletel.co.za/privacy-policy"
          style={emailStyles.footerLink}
        >
          Privacy Policy
        </Link>
        {' | '}
        <Link
          href="https://www.circletel.co.za/terms-of-service"
          style={emailStyles.footerLink}
        >
          Terms of Service
        </Link>
        {' | '}
        <Link
          href="https://www.circletel.co.za/help"
          style={emailStyles.footerLink}
        >
          Help Center
        </Link>
      </Text>

      {/* Unsubscribe Link - Always show for better deliverability */}
      {showUnsubscribe && (
        <Text style={{ margin: '8px 0 0 0', fontSize: '11px' }}>
          {emailType === 'transactional' ? (
            <>
              This is a transactional email related to your account.{' '}
              <Link href={unsubscribeUrl} style={emailStyles.footerLink}>
                Manage email preferences
              </Link>
            </>
          ) : (
            <>
              Don't want to receive these emails?{' '}
              <Link href={unsubscribeUrl} style={emailStyles.footerLink}>
                Unsubscribe
              </Link>
            </>
          )}
        </Text>
      )}

      {/* Copyright */}
      <Text style={{ margin: '12px 0 0 0', fontSize: '11px', opacity: 0.8 }}>
        © {new Date().getFullYear()} CircleTel (Pty) Ltd. All rights reserved.
      </Text>

      {/* Physical Address - Required by CAN-SPAM and helps deliverability */}
      <Text style={{ margin: '8px 0 0 0', fontSize: '10px', opacity: 0.7, lineHeight: '1.4' }}>
        Registered Address: Unit 5, Highveld Techno Park, Centurion, Gauteng, 0157, South Africa
        <br />
        Company Registration: 2024/123456/07 | VAT: 4123456789
      </Text>
    </Section>
  );
};

export default CircleTelFooter;
