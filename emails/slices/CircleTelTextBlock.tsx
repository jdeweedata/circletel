/**
 * CircleTel Email Text Block Component
 *
 * Paragraph content with optional alignment and spacing
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { emailStyles } from '../utils/styles';

interface CircleTelTextBlockProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  variant?: 'normal' | 'small' | 'large';
  spacing?: 'normal' | 'tight' | 'loose';
}

export const CircleTelTextBlock: React.FC<CircleTelTextBlockProps> = ({
  children,
  align = 'left',
  variant = 'normal',
  spacing = 'normal',
}) => {
  const fontSize =
    variant === 'small' ? '14px' : variant === 'large' ? '18px' : '16px';
  const marginBottom =
    spacing === 'tight' ? '8px' : spacing === 'loose' ? '24px' : '16px';

  return (
    <Section style={emailStyles.section}>
      <Text
        style={{
          ...emailStyles.paragraph,
          textAlign: align,
          fontSize,
          marginBottom,
        }}
      >
        {children}
      </Text>
    </Section>
  );
};

export default CircleTelTextBlock;
