/**
 * CircleTel Email Header Component
 *
 * Brand header with logo and orange gradient background
 */

import * as React from 'react';
import { Section, Img, Link, Text } from '@react-email/components';
import { emailStyles, brandColors } from '../utils/styles';

interface CircleTelHeaderProps {
  logoUrl?: string;
  homeUrl?: string;
}

export const CircleTelHeader: React.FC<CircleTelHeaderProps> = ({
  logoUrl = 'https://www.circletel.co.za/images/circletel-logo.png',
  homeUrl = 'https://www.circletel.co.za',
}) => {
  return (
    <Section style={{
      backgroundColor: brandColors.primary,
      padding: '24px 20px',
      textAlign: 'center' as const,
    }}>
      <Link href={homeUrl} style={{ textDecoration: 'none' }}>
        <Img
          src={logoUrl}
          alt="CircleTel"
          width="200"
          height="60"
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '200px',
          }}
        />
      </Link>
    </Section>
  );
};

export default CircleTelHeader;
