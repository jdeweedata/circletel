/**
 * CircleTel Email Button Component
 *
 * Call-to-action button with multiple variants
 */

import * as React from 'react';
import { Section, Button } from '@react-email/components';
import { emailStyles, brandColors } from '../utils/styles';

interface CircleTelButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  align?: 'left' | 'center' | 'right';
  fullWidth?: boolean;
}

export const CircleTelButton: React.FC<CircleTelButtonProps> = ({
  href,
  children,
  variant = 'primary',
  align = 'center',
  fullWidth = false,
}) => {
  const buttonStyle =
    variant === 'primary'
      ? emailStyles.buttonPrimary
      : variant === 'secondary'
      ? emailStyles.buttonSecondary
      : emailStyles.buttonOutline;

  const sectionStyle = {
    ...emailStyles.section,
    textAlign: align as 'left' | 'center' | 'right',
  };

  return (
    <Section style={sectionStyle}>
      <Button
        href={href}
        style={{
          ...buttonStyle,
          width: fullWidth ? '100%' : 'auto',
          boxSizing: 'border-box' as const,
        }}
      >
        {children}
      </Button>
    </Section>
  );
};

export default CircleTelButton;
