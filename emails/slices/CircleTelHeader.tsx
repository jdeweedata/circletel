/**
 * CircleTel Email Header Component
 *
 * Brand header with logo and orange gradient background
 */

import * as React from 'react';
import { Section, Img, Link } from '@react-email/components';
import { emailStyles, brandColors } from '../utils/styles';

interface CircleTelHeaderProps {
  logoUrl?: string;
  homeUrl?: string;
}

export const CircleTelHeader: React.FC<CircleTelHeaderProps> = ({
  logoUrl = 'https://www.circletel.co.za/logo-white.png',
  homeUrl = 'https://www.circletel.co.za',
}) => {
  return (
    <Section style={emailStyles.header}>
      <Link href={homeUrl} style={{ textDecoration: 'none' }}>
        <Img
          src={logoUrl}
          alt="CircleTel"
          width="180"
          height="50"
          style={{
            display: 'block',
            margin: '0 auto',
          }}
        />
      </Link>
    </Section>
  );
};

export default CircleTelHeader;
